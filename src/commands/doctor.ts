import { logger } from "../utils/logger";
import { promises as fs } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface DoctorOptions {
  fix?: boolean;
  verbose?: boolean;
  config?: boolean;
  deps?: boolean;
  types?: boolean;
  lint?: boolean;
  security?: boolean;
  performance?: boolean;
}

interface CheckResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  fixable?: boolean;
  details?: string[];
}

export async function doctorCommand(options: DoctorOptions = {}) {
  try {
    logger.info("🔍 Running pulzar health checks...");

    const checks: CheckResult[] = [];

    // Run all checks by default, or specific ones if requested
    const runAll =
      !options.config &&
      !options.deps &&
      !options.types &&
      !options.lint &&
      !options.security &&
      !options.performance;

    if (runAll || options.config) {
      checks.push(...(await checkConfiguration()));
    }

    if (runAll || options.deps) {
      checks.push(...(await checkDependencies()));
    }

    if (runAll || options.types) {
      checks.push(...(await checkTypeScript()));
    }

    if (runAll || options.lint) {
      checks.push(...(await checkLinting()));
    }

    if (runAll || options.security) {
      checks.push(...(await checkSecurity()));
    }

    if (runAll || options.performance) {
      checks.push(...(await checkPerformance()));
    }

    // Display results
    displayResults(checks, options.verbose);

    // Auto-fix if requested
    if (options.fix) {
      await autoFix(checks);
    }

    // Exit with appropriate code
    const hasErrors = checks.some((check) => check.status === "fail");
    const hasWarnings = checks.some((check) => check.status === "warn");

    if (hasErrors) {
      logger.error("❌ Health check failed with errors");
      process.exit(1);
    } else if (hasWarnings) {
      logger.warn("⚠️  Health check completed with warnings");
      process.exit(0);
    } else {
      logger.info("✅ All health checks passed!");
      process.exit(0);
    }
  } catch (error) {
    logger.error("Failed to run health checks", { error });
    process.exit(1);
  }
}

async function checkConfiguration(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  // Check ignite.config.ts
  try {
    await fs.access("ignite.config.ts");
    const content = await fs.readFile("ignite.config.ts", "utf8");

    if (content.includes("defineConfig")) {
      checks.push({
        name: "pulzar Configuration",
        status: "pass",
        message: "ignite.config.ts is properly configured",
      });
    } else {
      checks.push({
        name: "pulzar Configuration",
        status: "fail",
        message: "ignite.config.ts missing defineConfig usage",
        fixable: true,
      });
    }
  } catch {
    checks.push({
      name: "pulzar Configuration",
      status: "fail",
      message: "ignite.config.ts not found",
      fixable: true,
    });
  }

  // Check tsconfig.json
  try {
    await fs.access("tsconfig.json");
    const content = await fs.readFile("tsconfig.json", "utf8");
    const config = JSON.parse(content);

    const requiredSettings = {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "node",
      strict: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    };

    const missing = Object.entries(requiredSettings).filter(
      ([key, value]) => config.compilerOptions?.[key] !== value
    );

    if (missing.length === 0) {
      checks.push({
        name: "TypeScript Configuration",
        status: "pass",
        message: "tsconfig.json has recommended settings",
      });
    } else {
      checks.push({
        name: "TypeScript Configuration",
        status: "warn",
        message: `Missing recommended TypeScript settings`,
        details: missing.map(([key, value]) => `${key}: ${value}`),
        fixable: true,
      });
    }
  } catch {
    checks.push({
      name: "TypeScript Configuration",
      status: "fail",
      message: "tsconfig.json not found or invalid",
      fixable: true,
    });
  }

  // Check package.json
  try {
    await fs.access("package.json");
    const content = await fs.readFile("package.json", "utf8");
    const pkg = JSON.parse(content);

    if (pkg.type === "module") {
      checks.push({
        name: "ESM Configuration",
        status: "pass",
        message: "Package configured for ESM",
      });
    } else {
      checks.push({
        name: "ESM Configuration",
        status: "warn",
        message: "Package not configured for ESM (type: module)",
        fixable: true,
      });
    }

    // Check scripts
    const requiredScripts = ["dev", "build", "test"];
    const missingScripts = requiredScripts.filter(
      (script) => !pkg.scripts?.[script]
    );

    if (missingScripts.length === 0) {
      checks.push({
        name: "NPM Scripts",
        status: "pass",
        message: "All required scripts are present",
      });
    } else {
      checks.push({
        name: "NPM Scripts",
        status: "warn",
        message: `Missing recommended scripts: ${missingScripts.join(", ")}`,
        fixable: true,
      });
    }
  } catch {
    checks.push({
      name: "Package Configuration",
      status: "fail",
      message: "package.json not found or invalid",
    });
  }

  // Check .env files
  try {
    await fs.access(".env.example");
    checks.push({
      name: "Environment Template",
      status: "pass",
      message: ".env.example file exists",
    });
  } catch {
    checks.push({
      name: "Environment Template",
      status: "warn",
      message: ".env.example file not found",
      fixable: true,
    });
  }

  return checks;
}

async function checkDependencies(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  try {
    // Check if node_modules exists
    await fs.access("node_modules");

    // Check for core dependencies
    const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const corePackages = ["@ignite/core", "fastify", "typescript", "zod"];
    const missing = corePackages.filter((pkg) => !deps[pkg]);

    if (missing.length === 0) {
      checks.push({
        name: "Core Dependencies",
        status: "pass",
        message: "All core dependencies are installed",
      });
    } else {
      checks.push({
        name: "Core Dependencies",
        status: "fail",
        message: `Missing core dependencies: ${missing.join(", ")}`,
        fixable: true,
      });
    }

    // Check for outdated packages
    try {
      const { stdout } = await execAsync("npm outdated --json", {
        timeout: 10000,
      });
      const outdated = JSON.parse(stdout || "{}");
      const outdatedCount = Object.keys(outdated).length;

      if (outdatedCount === 0) {
        checks.push({
          name: "Package Updates",
          status: "pass",
          message: "All packages are up to date",
        });
      } else {
        checks.push({
          name: "Package Updates",
          status: "warn",
          message: `${outdatedCount} packages can be updated`,
          fixable: true,
        });
      }
    } catch {
      // npm outdated returns exit code 1 when outdated packages exist
      checks.push({
        name: "Package Updates",
        status: "warn",
        message: "Some packages may be outdated",
        fixable: true,
      });
    }
  } catch {
    checks.push({
      name: "Dependencies",
      status: "fail",
      message: "node_modules not found - run 'npm install'",
      fixable: true,
    });
  }

  return checks;
}

async function checkTypeScript(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  try {
    // Type check
    const { stdout, stderr } = await execAsync("npx tsc --noEmit", {
      timeout: 30000,
    });

    if (stderr) {
      const errorCount = (stderr.match(/error TS/g) || []).length;
      checks.push({
        name: "TypeScript Compilation",
        status: "fail",
        message: `${errorCount} TypeScript errors found`,
        details: stderr.split("\n").filter((line) => line.includes("error TS")),
      });
    } else {
      checks.push({
        name: "TypeScript Compilation",
        status: "pass",
        message: "No TypeScript errors found",
      });
    }
  } catch (error: any) {
    if (error.stdout || error.stderr) {
      const errorOutput = error.stderr || error.stdout;
      const errorCount = (errorOutput.match(/error TS/g) || []).length;
      checks.push({
        name: "TypeScript Compilation",
        status: "fail",
        message: `${errorCount} TypeScript errors found`,
        details: errorOutput
          .split("\n")
          .filter((line: string) => line.includes("error TS"))
          .slice(0, 5),
      });
    } else {
      checks.push({
        name: "TypeScript Compilation",
        status: "fail",
        message: "Failed to run TypeScript compiler",
      });
    }
  }

  return checks;
}

async function checkLinting(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  // Check if Biome is configured
  try {
    await fs.access("biome.json");
    checks.push({
      name: "Biome Configuration",
      status: "pass",
      message: "Biome configuration found",
    });

    try {
      const { stdout, stderr } = await execAsync("npx biome check src/", {
        timeout: 15000,
      });

      if (stderr && stderr.includes("error")) {
        checks.push({
          name: "Code Linting",
          status: "fail",
          message: "Linting errors found",
          fixable: true,
          details: stderr.split("\n").slice(0, 5),
        });
      } else {
        checks.push({
          name: "Code Linting",
          status: "pass",
          message: "No linting errors found",
        });
      }
    } catch (error: any) {
      checks.push({
        name: "Code Linting",
        status: "warn",
        message: "Could not run linting check",
        details: [error.message],
      });
    }
  } catch {
    checks.push({
      name: "Biome Configuration",
      status: "warn",
      message: "Biome not configured - using basic linting",
      fixable: true,
    });
  }

  return checks;
}

async function checkSecurity(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  try {
    // Check for security audit
    const { stdout } = await execAsync("npm audit --json", {
      timeout: 15000,
    });

    const audit = JSON.parse(stdout);
    const vulnerabilities = audit.metadata?.vulnerabilities;

    if (vulnerabilities) {
      const total = Object.values(vulnerabilities).reduce(
        (sum: number, count: any) => sum + count,
        0
      );

      if (total === 0) {
        checks.push({
          name: "Security Audit",
          status: "pass",
          message: "No security vulnerabilities found",
        });
      } else {
        const critical = vulnerabilities.critical || 0;
        const high = vulnerabilities.high || 0;

        checks.push({
          name: "Security Audit",
          status: critical > 0 || high > 0 ? "fail" : "warn",
          message: `${total} vulnerabilities found (${critical} critical, ${high} high)`,
          fixable: true,
        });
      }
    }
  } catch {
    checks.push({
      name: "Security Audit",
      status: "warn",
      message: "Could not run security audit",
    });
  }

  // Check for sensitive files
  const sensitiveFiles = [".env", "private.key", "cert.pem"];
  for (const file of sensitiveFiles) {
    try {
      await fs.access(file);
      checks.push({
        name: `Sensitive File: ${file}`,
        status: "warn",
        message: `Sensitive file ${file} found - ensure it's in .gitignore`,
      });
    } catch {
      // File doesn't exist, which is good
    }
  }

  return checks;
}

async function checkPerformance(): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];

  // Check for common performance issues
  const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));

  // Check for dev dependencies in production
  const prodDeps = pkg.dependencies || {};
  const devPackages = ["@types/", "eslint", "prettier", "jest", "vitest"];

  const devInProd = Object.keys(prodDeps).filter((dep) =>
    devPackages.some((devPkg) => dep.includes(devPkg))
  );

  if (devInProd.length === 0) {
    checks.push({
      name: "Production Dependencies",
      status: "pass",
      message: "No dev dependencies in production",
    });
  } else {
    checks.push({
      name: "Production Dependencies",
      status: "warn",
      message: `Dev packages in production: ${devInProd.join(", ")}`,
      fixable: true,
    });
  }

  // Check for build optimization
  try {
    await fs.access("dist");
    checks.push({
      name: "Build Output",
      status: "pass",
      message: "Build output directory exists",
    });
  } catch {
    checks.push({
      name: "Build Output",
      status: "warn",
      message: "No build output found - run 'npm run build'",
    });
  }

  return checks;
}

function displayResults(checks: CheckResult[], verbose = false) {
  console.log("\n📋 Health Check Results:");
  console.log("========================");

  const grouped = checks.reduce((acc, check) => {
    const category = check.name.split(" ")[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(check);
    return acc;
  }, {} as Record<string, CheckResult[]>);

  for (const [category, categoryChecks] of Object.entries(grouped)) {
    console.log(`\n${category}:`);

    for (const check of categoryChecks) {
      const icon =
        check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
      const fixable = check.fixable ? " (fixable)" : "";

      console.log(`  ${icon} ${check.message}${fixable}`);

      if (verbose && check.details) {
        check.details.forEach((detail) => {
          console.log(`     - ${detail}`);
        });
      }
    }
  }

  const summary = checks.reduce(
    (acc, check) => {
      acc[check.status]++;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 }
  );

  console.log("\n📊 Summary:");
  console.log(`✅ Passed: ${summary.pass}`);
  console.log(`⚠️  Warnings: ${summary.warn}`);
  console.log(`❌ Failed: ${summary.fail}`);

  if (summary.fail > 0 || summary.warn > 0) {
    console.log("\nRun with --fix to automatically fix issues where possible");
    console.log("Run with --verbose to see detailed error information");
  }
}

async function autoFix(checks: CheckResult[]) {
  const fixableChecks = checks.filter((check) => check.fixable);

  if (fixableChecks.length === 0) {
    logger.info("No fixable issues found");
    return;
  }

  logger.info(`🔧 Attempting to fix ${fixableChecks.length} issues...`);

  for (const check of fixableChecks) {
    try {
      if (check.name.includes("Configuration")) {
        await fixConfiguration(check);
      } else if (check.name.includes("Dependencies")) {
        await fixDependencies(check);
      } else if (check.name.includes("Linting")) {
        await fixLinting(check);
      } else if (check.name.includes("Security")) {
        await fixSecurity(check);
      }
    } catch (error) {
      logger.warn(`Failed to fix: ${check.name}`, { error });
    }
  }
}

async function fixConfiguration(check: CheckResult) {
  if (check.name.includes("ignite.config.ts")) {
    // Create basic ignite.config.ts
    const config = `import { defineConfig } from "@ignite/core";

export default defineConfig({
  server: {
    port: 3000,
    host: "localhost"
  },
  plugins: []
});
`;
    await fs.writeFile("ignite.config.ts", config);
    logger.info("Created ignite.config.ts");
  }
}

async function fixDependencies(check: CheckResult) {
  if (check.message.includes("npm install")) {
    await execAsync("npm install");
    logger.info("Installed dependencies");
  } else if (check.message.includes("outdated")) {
    // Note: This is handled by the upgrade command
    logger.info("Use 'ignite upgrade' to update packages");
  }
}

async function fixLinting(check: CheckResult) {
  if (check.message.includes("Linting errors")) {
    try {
      await execAsync("npx biome check --apply src/");
      logger.info("Applied linting fixes");
    } catch (error) {
      logger.warn("Could not auto-fix all linting issues");
    }
  }
}

async function fixSecurity(check: CheckResult) {
  if (check.message.includes("vulnerabilities")) {
    try {
      await execAsync("npm audit fix");
      logger.info("Applied security fixes");
    } catch (error) {
      logger.warn("Could not auto-fix all security issues");
    }
  }
}
