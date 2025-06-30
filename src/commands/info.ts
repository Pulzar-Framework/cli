import { logger } from "../utils/logger";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import os from "os";

const execAsync = promisify(exec);

export async function infoCommand() {
  try {
    logger.info("📋 Gathering system information...");

    const info = await gatherSystemInfo();
    displayInfo(info);
  } catch (error) {
    logger.error("Failed to gather system information", { error });
    process.exit(1);
  }
}

interface SystemInfo {
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    npmVersion: string;
    memory: string;
    cpus: number;
  };
  project: {
    name?: string;
    version?: string;
    igniteVersion?: string;
    hasIgniteConfig: boolean;
    hasTypeScript: boolean;
    hasGit: boolean;
    packageManager: string;
  };
  dependencies: {
    core: string[];
    dev: string[];
    total: number;
  };
  environment: {
    nodeEnv: string;
    cwd: string;
    homedir: string;
  };
}

async function gatherSystemInfo(): Promise<SystemInfo> {
  const info: SystemInfo = {
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      npmVersion: await getNpmVersion(),
      memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
      cpus: os.cpus().length,
    },
    project: {
      hasIgniteConfig: await fileExists("ignite.config.ts"),
      hasTypeScript: await fileExists("tsconfig.json"),
      hasGit: await fileExists(".git"),
      packageManager: await detectPackageManager(),
    },
    dependencies: {
      core: [],
      dev: [],
      total: 0,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      cwd: process.cwd(),
      homedir: os.homedir(),
    },
  };

  // Get project info from package.json
  try {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
    info.project.name = packageJson.name;
    info.project.version = packageJson.version;

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    info.project.igniteVersion =
      deps["@ignite/core"] || devDeps["@ignite/core"];
    info.dependencies.core = Object.keys(deps);
    info.dependencies.dev = Object.keys(devDeps);
    info.dependencies.total =
      info.dependencies.core.length + info.dependencies.dev.length;
  } catch {
    // No package.json or invalid JSON
  }

  return info;
}

async function getNpmVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync("npm --version");
    return stdout.trim();
  } catch {
    return "unknown";
  }
}

async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function detectPackageManager(): Promise<string> {
  if (await fileExists("yarn.lock")) return "yarn";
  if (await fileExists("pnpm-lock.yaml")) return "pnpm";
  if (await fileExists("bun.lockb")) return "bun";
  if (await fileExists("package-lock.json")) return "npm";
  return "unknown";
}

function displayInfo(info: SystemInfo) {
  console.log(`
🚀 pulzar Project Information

📦 PROJECT
${info.project.name ? `  Name: ${info.project.name}` : "  Name: Not found"}
${
  info.project.version
    ? `  Version: ${info.project.version}`
    : "  Version: Not found"
}
${
  info.project.igniteVersion
    ? `  pulzar: ${info.project.igniteVersion}`
    : "  pulzar: Not installed"
}
  Package Manager: ${info.project.packageManager}
  Dependencies: ${info.dependencies.total} (${
    info.dependencies.core.length
  } prod, ${info.dependencies.dev.length} dev)

⚙️  CONFIGURATION
  pulzar Config: ${info.project.hasIgniteConfig ? "✅ Found" : "❌ Missing"}
  TypeScript: ${info.project.hasTypeScript ? "✅ Configured" : "❌ Missing"}
  Git Repository: ${
    info.project.hasGit ? "✅ Initialized" : "❌ Not initialized"
  }

💻 SYSTEM
  Platform: ${info.system.platform} (${info.system.arch})
  Node.js: ${info.system.nodeVersion}
  npm: ${info.system.npmVersion}
  CPUs: ${info.system.cpus}
  Memory: ${info.system.memory}

🌍 ENVIRONMENT
  NODE_ENV: ${info.environment.nodeEnv}
  Working Directory: ${info.environment.cwd}
  Home Directory: ${info.environment.homedir}
`);

  // Show core dependencies
  if (info.dependencies.core.length > 0) {
    console.log(`📚 CORE DEPENDENCIES`);
    const ignitePackages = info.dependencies.core.filter((dep) =>
      dep.startsWith("@ignite/")
    );
    const otherPackages = info.dependencies.core.filter(
      (dep) => !dep.startsWith("@ignite/")
    );

    if (ignitePackages.length > 0) {
      console.log(`  pulzar Packages:`);
      ignitePackages.forEach((pkg) => console.log(`    • ${pkg}`));
    }

    if (otherPackages.length > 0) {
      console.log(`  Other Packages:`);
      otherPackages.slice(0, 10).forEach((pkg) => console.log(`    • ${pkg}`));
      if (otherPackages.length > 10) {
        console.log(`    ... and ${otherPackages.length - 10} more`);
      }
    }
  }

  // Show health status
  console.log(`\n🔍 HEALTH STATUS`);
  const issues = [];

  if (!info.project.hasIgniteConfig) {
    issues.push("Missing ignite.config.ts - run 'ignite config:init'");
  }

  if (!info.project.hasTypeScript) {
    issues.push("Missing tsconfig.json - TypeScript not configured");
  }

  if (!info.project.igniteVersion) {
    issues.push("pulzar not installed - run 'npm install @ignite/core'");
  }

  if (
    info.environment.nodeEnv === "production" &&
    info.dependencies.dev.length > 0
  ) {
    issues.push("Dev dependencies present in production environment");
  }

  if (issues.length === 0) {
    console.log(`  ✅ Everything looks good!`);
  } else {
    console.log(`  ⚠️  Found ${issues.length} potential issues:`);
    issues.forEach((issue) => console.log(`    • ${issue}`));
    console.log(
      `\n  Run 'ignite doctor' for detailed health check and auto-fixes`
    );
  }

  console.log(`\n💡 NEXT STEPS`);
  if (!info.project.name) {
    console.log(`  • Initialize a new project: ignite new my-project`);
  } else {
    console.log(`  • Start development: ignite dev`);
    console.log(`  • Run health check: ignite doctor`);
    console.log(`  • Generate code: ignite generate --help`);
    console.log(`  • Build for production: ignite build`);
  }
}
