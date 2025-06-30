import { logger } from "../utils/logger";
import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";

const execAsync = promisify(exec);

interface UpgradeOptions {
  interactive?: boolean;
  target?: string;
  filter?: string;
  exclude?: string;
  latest?: boolean;
  major?: boolean;
  minor?: boolean;
  patch?: boolean;
  pre?: boolean;
  doctor?: boolean;
  dry?: boolean;
}

export async function upgradeCommand(options: UpgradeOptions = {}) {
  try {
    logger.info("🔄 Checking for package updates...");

    // Ensure npm-check-updates is available
    await ensureNCUInstalled();

    // Build ncu command
    const ncuArgs = buildNCUArgs(options);
    const command = `npx npm-check-updates ${ncuArgs.join(" ")}`;

    logger.info(`Running: ${command}`);

    if (options.dry) {
      // Dry run - just show what would be updated
      await runDryUpdate(command);
    } else if (options.interactive) {
      // Interactive mode
      await runInteractiveUpdate(command);
    } else {
      // Automatic update
      await runAutomaticUpdate(command, options);
    }
  } catch (error) {
    logger.error("Failed to upgrade packages", { error });
    process.exit(1);
  }
}

async function ensureNCUInstalled() {
  try {
    await execAsync("npx npm-check-updates --version", { timeout: 10000 });
  } catch (error) {
    logger.info("Installing npm-check-updates...");
    try {
      await execAsync("npm install -g npm-check-updates", { timeout: 30000 });
    } catch (installError) {
      throw new Error(
        "Failed to install npm-check-updates. Please install it manually: npm install -g npm-check-updates"
      );
    }
  }
}

function buildNCUArgs(options: UpgradeOptions): string[] {
  const args: string[] = [];

  // Target version
  if (options.target) {
    args.push(`--target ${options.target}`);
  } else if (options.latest) {
    args.push("--target latest");
  } else if (options.major) {
    args.push("--target major");
  } else if (options.minor) {
    args.push("--target minor");
  } else if (options.patch) {
    args.push("--target patch");
  } else {
    // Default to minor updates for safety
    args.push("--target minor");
  }

  // Filtering
  if (options.filter) {
    args.push(`--filter "${options.filter}"`);
  }

  if (options.exclude) {
    args.push(`--reject "${options.exclude}"`);
  }

  // Pre-release
  if (options.pre) {
    args.push("--pre");
  }

  // Format
  args.push("--color");
  args.push("--jsonUpgraded");

  return args;
}

async function runDryUpdate(command: string) {
  try {
    const { stdout, stderr } = await execAsync(command + " --dry-run");

    if (stderr) {
      logger.warn("Warnings during dry run:", { stderr });
    }

    if (stdout.trim()) {
      console.log("📦 Packages that would be updated:");
      console.log(stdout);
    } else {
      logger.info("✅ All packages are up to date!");
    }
  } catch (error: any) {
    if (error.code === 1 && error.stdout) {
      // ncu exits with code 1 when updates are available
      console.log("📦 Packages that would be updated:");
      console.log(error.stdout);
    } else {
      throw error;
    }
  }
}

async function runInteractiveUpdate(command: string) {
  try {
    // For interactive mode, we'll run without --jsonUpgraded and let user see the output
    const interactiveCommand = command.replace(
      "--jsonUpgraded",
      "--interactive"
    );

    logger.info("🎯 Starting interactive upgrade mode...");
    logger.info("You'll be prompted to select which packages to update.");

    // Run in interactive mode - this will inherit stdio
    const { spawn } = require("child_process");
    const child = spawn(
      "npx",
      ["npm-check-updates", ...interactiveCommand.split(" ").slice(2)],
      {
        stdio: "inherit",
      }
    );

    await new Promise((resolve, reject) => {
      child.on("close", (code: number) => {
        if (code === 0 || code === 1) {
          resolve(code);
        } else {
          reject(new Error(`Interactive upgrade failed with code ${code}`));
        }
      });
    });

    // Install updated packages
    logger.info("📥 Installing updated packages...");
    await execAsync("npm install");

    logger.info("✅ Interactive upgrade completed!");
  } catch (error) {
    throw new Error(`Interactive upgrade failed: ${error}`);
  }
}

async function runAutomaticUpdate(command: string, options: UpgradeOptions) {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });

    if (stderr) {
      logger.warn("Warnings during update check:", { stderr });
    }

    let updatedPackages;
    try {
      updatedPackages = stdout.trim() ? JSON.parse(stdout) : {};
    } catch {
      // If JSON parsing fails, fall back to text output
      if (stdout.trim()) {
        console.log("📦 Package updates:");
        console.log(stdout);
        updatedPackages = { hasUpdates: true };
      } else {
        updatedPackages = {};
      }
    }

    const updateCount = Object.keys(updatedPackages).length;

    if (updateCount === 0) {
      logger.info("✅ All packages are up to date!");
      return;
    }

    logger.info(`📦 Found ${updateCount} package updates`);

    // Show what will be updated
    if (typeof updatedPackages === "object" && !updatedPackages.hasUpdates) {
      console.log("\nPackages to update:");
      for (const [pkg, version] of Object.entries(updatedPackages)) {
        console.log(`  ${pkg}: ${version}`);
      }
    }

    // Update package.json
    logger.info("📝 Updating package.json...");
    await execAsync(command.replace("--jsonUpgraded", "--upgrade"));

    // Install updated packages
    logger.info("📥 Installing updated packages...");
    await execAsync("npm install");

    // Run doctor check if requested
    if (options.doctor) {
      logger.info("🔍 Running health check after upgrade...");
      const { doctorCommand } = await import("./doctor");
      await doctorCommand({ verbose: false });
    }

    logger.info("✅ Package upgrade completed successfully!");

    // Show post-upgrade recommendations
    console.log("\n📋 Post-upgrade recommendations:");
    console.log("1. Test your application thoroughly");
    console.log("2. Check for any breaking changes in updated packages");
    console.log("3. Update your lock file: npm install");
    console.log("4. Run tests: npm test");
  } catch (error: any) {
    if (error.code === 1 && error.stdout) {
      // ncu exits with code 1 when updates are available
      await handleUpdatesAvailable(error.stdout, options);
    } else {
      throw error;
    }
  }
}

async function handleUpdatesAvailable(stdout: string, options: UpgradeOptions) {
  logger.info("📦 Updates available!");

  if (stdout.includes("Run ncu -u to upgrade")) {
    console.log(stdout);

    // Ask user if they want to proceed
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question("\nProceed with upgrade? (y/N): ", resolve);
    });
    rl.close();

    if (answer?.toString().toLowerCase().startsWith("y")) {
      logger.info("📝 Updating package.json...");
      await execAsync("npx npm-check-updates -u");

      logger.info("📥 Installing updated packages...");
      await execAsync("npm install");

      logger.info("✅ Upgrade completed!");
    } else {
      logger.info("Upgrade cancelled");
    }
  }
}

// Utility functions for specific upgrade scenarios
export async function upgradepulzar() {
  logger.info("🚀 Upgrading pulzar packages...");

  try {
    await execAsync("npx npm-check-updates --filter '@ignite/*' --upgrade");
    await execAsync("npm install");
    logger.info("✅ pulzar packages upgraded!");
  } catch (error) {
    logger.error("Failed to upgrade pulzar packages", { error });
    throw error;
  }
}

export async function upgradeSecurity() {
  logger.info("🔒 Upgrading packages with security vulnerabilities...");

  try {
    // First try npm audit fix
    await execAsync("npm audit fix");

    // Then upgrade packages with known vulnerabilities
    const { stdout } = await execAsync("npm audit --json");
    const audit = JSON.parse(stdout);

    if (audit.metadata?.vulnerabilities) {
      const vulnPackages = Object.keys(audit.vulnerabilities || {});
      if (vulnPackages.length > 0) {
        const filter = vulnPackages.join("|");
        await execAsync(
          `npx npm-check-updates --filter "${filter}" --target latest --upgrade`
        );
        await execAsync("npm install");
      }
    }

    logger.info("✅ Security upgrades completed!");
  } catch (error) {
    logger.error("Failed to upgrade security packages", { error });
    throw error;
  }
}

export async function upgradeDevDependencies() {
  logger.info("🔧 Upgrading development dependencies...");

  try {
    await execAsync(
      "npx npm-check-updates --filter '/^@types/|eslint|prettier|jest|vitest|typescript/' --upgrade"
    );
    await execAsync("npm install");
    logger.info("✅ Dev dependencies upgraded!");
  } catch (error) {
    logger.error("Failed to upgrade dev dependencies", { error });
    throw error;
  }
}
