import { logger } from "../utils/logger";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

interface LintOptions {
  fix?: boolean;
  format?: boolean;
  check?: boolean;
  staged?: boolean;
  watch?: boolean;
  config?: string;
  reporter?: "default" | "json" | "github" | "junit";
  maxWarnings?: number;
  paths?: string[];
  verbose?: boolean;
}

export async function lintCommand(options: LintOptions = {}) {
  try {
    logger.info("🔍 Running code linting and formatting...");

    // Ensure Biome is configured
    await ensureBiomeConfig();

    // Build paths to check
    const paths = options.paths?.length ? options.paths : ["src/", "tests/"];

    // Run different operations based on options
    if (options.watch) {
      await runWatchMode(paths, options);
    } else if (options.staged) {
      await runStagedFiles(options);
    } else if (options.check) {
      await runCheck(paths, options);
    } else if (options.format) {
      await runFormat(paths, options);
    } else {
      // Default: run check and format
      await runCheckAndFormat(paths, options);
    }
  } catch (error) {
    logger.error("Linting failed", { error });
    process.exit(1);
  }
}

async function ensureBiomeConfig() {
  try {
    await fs.access("biome.json");
  } catch {
    logger.info("📝 Creating Biome configuration...");

    const config = {
      $schema: "https://biomejs.dev/schemas/1.4.1/schema.json",
      organizeImports: {
        enabled: true,
      },
      linter: {
        enabled: true,
        rules: {
          recommended: true,
          style: {
            noNonNullAssertion: "off",
            useImportType: "error",
          },
          suspicious: {
            noExplicitAny: "warn",
            noArrayIndexKey: "warn",
          },
          correctness: {
            noUnusedVariables: "error",
            useExhaustiveDependencies: "warn",
          },
          performance: {
            noDelete: "error",
          },
        },
      },
      formatter: {
        enabled: true,
        formatWithErrors: false,
        indentStyle: "space",
        indentWidth: 2,
        lineWidth: 100,
        lineEnding: "lf",
        attributePosition: "auto",
      },
      javascript: {
        formatter: {
          quoteStyle: "double",
          jsxQuoteStyle: "double",
          trailingComma: "es5",
          semicolons: "always",
          arrowParentheses: "always",
        },
      },
      json: {
        formatter: {
          enabled: true,
        },
      },
      files: {
        include: ["src/**/*", "tests/**/*", "*.ts", "*.js", "*.json"],
        ignore: [
          "node_modules/**/*",
          "dist/**/*",
          "build/**/*",
          "coverage/**/*",
          ".next/**/*",
          ".nuxt/**/*",
        ],
      },
    };

    await fs.writeFile("biome.json", JSON.stringify(config, null, 2));
    logger.info("✅ Biome configuration created");
  }
}

async function runCheck(paths: string[], options: LintOptions) {
  logger.info("🔍 Running linting checks...");

  const args = buildBiomeArgs("check", paths, options);
  const command = `npx biome ${args.join(" ")}`;

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

    if (options.verbose) {
      console.log(stdout);
    }

    if (stderr) {
      logger.warn("Linting warnings:", { stderr });
    }

    // Parse output for summary
    const lines = stdout.split("\n");
    const errorLines = lines.filter(
      (line) => line.includes("error") || line.includes("✖")
    );
    const warningLines = lines.filter(
      (line) => line.includes("warning") || line.includes("⚠")
    );

    if (errorLines.length === 0 && warningLines.length === 0) {
      logger.info("✅ No linting issues found!");
    } else {
      logger.info(
        `Found ${errorLines.length} errors and ${warningLines.length} warnings`
      );

      if (
        options.maxWarnings !== undefined &&
        warningLines.length > options.maxWarnings
      ) {
        throw new Error(
          `Too many warnings (${warningLines.length} > ${options.maxWarnings})`
        );
      }
    }

    return { errors: errorLines.length, warnings: warningLines.length };
  } catch (error: any) {
    if (error.code === 1) {
      // Biome returns exit code 1 when issues are found
      const output = error.stdout || error.stderr || "";

      // Count issues
      const errorCount = (output.match(/error/gi) || []).length;
      const warningCount = (output.match(/warning/gi) || []).length;

      if (options.reporter === "json") {
        console.log(
          JSON.stringify(
            {
              success: false,
              errors: errorCount,
              warnings: warningCount,
              output: output,
            },
            null,
            2
          )
        );
      } else {
        console.log(output);
      }

      throw new Error(
        `Linting failed with ${errorCount} errors and ${warningCount} warnings`
      );
    } else {
      throw error;
    }
  }
}

async function runFormat(paths: string[], options: LintOptions) {
  logger.info("🎨 Running code formatting...");

  const args = buildBiomeArgs("format", paths, options);
  const command = `npx biome ${args.join(" ")}`;

  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

    if (options.verbose) {
      console.log(stdout);
    }

    if (stderr) {
      logger.warn("Formatting warnings:", { stderr });
    }

    logger.info("✅ Code formatting completed!");
  } catch (error: any) {
    if (error.stdout) {
      console.log(error.stdout);
    }
    throw new Error(`Formatting failed: ${error.message}`);
  }
}

async function runCheckAndFormat(paths: string[], options: LintOptions) {
  logger.info("🔍 Running linting and formatting...");

  try {
    // First run check
    const checkResult = await runCheck(paths, { ...options, fix: false });

    // Then run format if requested or if there are fixable issues
    if (options.fix || checkResult.errors > 0 || checkResult.warnings > 0) {
      await runFormat(paths, { ...options, write: true });

      // Run check again to see if issues were fixed
      logger.info("🔄 Re-checking after formatting...");
      const finalResult = await runCheck(paths, { ...options, fix: false });

      if (finalResult.errors === 0) {
        logger.info("✅ All issues have been resolved!");
      } else {
        logger.warn(`${finalResult.errors} issues remain after auto-fix`);
      }
    }
  } catch (error) {
    if (options.fix) {
      logger.info("🔧 Attempting to auto-fix issues...");
      try {
        const fixArgs = buildBiomeArgs("check", paths, {
          ...options,
          apply: true,
        });
        await execAsync(`npx biome ${fixArgs.join(" ")}`);
        logger.info("✅ Auto-fix completed!");
      } catch (fixError) {
        logger.warn("Some issues could not be auto-fixed");
        throw error;
      }
    } else {
      throw error;
    }
  }
}

async function runStagedFiles(options: LintOptions) {
  logger.info("🎯 Linting staged files...");

  try {
    // Get staged files
    const { stdout } = await execAsync(
      "git diff --cached --name-only --diff-filter=ACM"
    );
    const stagedFiles = stdout
      .split("\n")
      .filter((file) => file.match(/\.(ts|js|tsx|jsx|json)$/))
      .filter((file) => file.length > 0);

    if (stagedFiles.length === 0) {
      logger.info("No staged files to lint");
      return;
    }

    logger.info(`Linting ${stagedFiles.length} staged files...`);

    // Run biome on staged files
    const args = buildBiomeArgs("check", stagedFiles, options);
    await execAsync(`npx biome ${args.join(" ")}`);

    logger.info("✅ Staged files passed linting!");
  } catch (error) {
    logger.error("Staged files have linting issues");
    throw error;
  }
}

async function runWatchMode(paths: string[], options: LintOptions) {
  logger.info("👀 Starting lint watch mode...");
  logger.info("Press Ctrl+C to stop watching");

  // Use chokidar for file watching
  const chokidar = require("chokidar");

  const watcher = chokidar.watch(paths, {
    ignored: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    persistent: true,
  });

  let isRunning = false;

  const runLint = async (filePath?: string) => {
    if (isRunning) return;
    isRunning = true;

    try {
      const targetPaths = filePath ? [filePath] : paths;
      await runCheck(targetPaths, options);

      if (filePath) {
        logger.info(`✅ ${filePath} passed linting`);
      }
    } catch (error) {
      if (filePath) {
        logger.error(`❌ ${filePath} has linting issues`);
      }
    } finally {
      isRunning = false;
    }
  };

  watcher
    .on("change", runLint)
    .on("add", runLint)
    .on("ready", () => {
      logger.info("👀 Watching for file changes...");
      runLint(); // Initial run
    });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("\n🛑 Stopping lint watch mode...");
    watcher.close();
    process.exit(0);
  });
}

function buildBiomeArgs(
  command: string,
  paths: string[],
  options: LintOptions
): string[] {
  const args = [command];

  // Add paths
  if (paths.length > 0) {
    args.push(...paths);
  }

  // Command-specific options
  if (command === "check") {
    if (options.apply || options.fix) {
      args.push("--apply");
    }
  } else if (command === "format") {
    if (options.write !== false) {
      args.push("--write");
    }
  }

  // Common options
  if (options.config) {
    args.push("--config-path", options.config);
  }

  // Reporter
  if (options.reporter && options.reporter !== "default") {
    args.push("--reporter", options.reporter);
  }

  // Verbose
  if (options.verbose) {
    args.push("--verbose");
  }

  return args;
}

// Utility functions for specific linting scenarios
export async function lintStaged() {
  logger.info("🎯 Linting staged files for pre-commit...");

  try {
    await lintCommand({ staged: true, fix: true });
    logger.info("✅ Staged files are ready for commit!");
  } catch (error) {
    logger.error(
      "❌ Staged files have linting issues. Fix them before committing."
    );
    process.exit(1);
  }
}

export async function setupPreCommitHook() {
  logger.info("🪝 Setting up pre-commit linting hook...");

  try {
    // Create .husky directory if it doesn't exist
    await fs.mkdir(".husky", { recursive: true });

    // Create pre-commit hook
    const hookContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx ignite lint --staged
`;

    await fs.writeFile(".husky/pre-commit", hookContent);
    await execAsync("chmod +x .husky/pre-commit");

    logger.info("✅ Pre-commit hook setup completed!");
    logger.info("Staged files will be automatically linted before each commit");
  } catch (error) {
    logger.error("Failed to setup pre-commit hook", { error });
    throw error;
  }
}

export async function lintCI() {
  logger.info("🤖 Running linting for CI/CD...");

  try {
    await lintCommand({
      check: true,
      reporter: "github",
      maxWarnings: 0, // Fail on any warnings in CI
      paths: ["src/", "tests/"],
    });

    logger.info("✅ CI linting passed!");
  } catch (error) {
    logger.error("❌ CI linting failed");
    process.exit(1);
  }
}
