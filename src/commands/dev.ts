import { Command } from "commander";
import { logger } from "../utils/logger";

export interface DevOptions {
  port: string;
  host: string;
  watch: boolean;
}

export async function devCommand(options: DevOptions) {
  try {
    logger.info("Starting development server...", { options });

    // 1. Check if pulzar.config.ts exists
    const configPath = await findConfigFile();
    if (!configPath) {
      logger.error("No pulzar.config.ts found. Run 'pulzar init' first.");
      process.exit(1);
    }

    logger.info("Found configuration file", { path: configPath });

    // 2. Load configuration
    const config = await loadConfig(configPath);

    // 3. Setup environment
    process.env.NODE_ENV = process.env.NODE_ENV || "development";

    // 4. Generate DI container if needed
    await generateDIContainer(config);

    // 5. Start development server
    await startDevServer(config, options);
  } catch (error) {
    logger.error("Failed to start development server", { error });
    process.exit(1);
  }
}

async function findConfigFile(): Promise<string | null> {
  const possiblePaths = [
    "pulzar.config.ts",
    "pulzar.config.js",
    "src/pulzar.config.ts",
    "src/pulzar.config.js",
  ];

  for (const path of possiblePaths) {
    try {
      const fs = await import("fs/promises");
      await fs.access(path);
      return path;
    } catch {
      continue;
    }
  }

  return null;
}

async function loadConfig(configPath: string): Promise<any> {
  try {
    const config = await import(process.cwd() + "/" + configPath);
    return config.default || config;
  } catch (error) {
    logger.error("Failed to load configuration", { configPath, error });
    return {
      entry: "src/main.ts",
      port: 3000,
      host: "localhost",
    };
  }
}

async function generateDIContainer(config: any): Promise<void> {
  try {
    const { buildDI } = await import("./build-di");
    await buildDI({
      sourceDir: config.src || "src",
      outputFile: config.diOut || "src/generated/di-container.ts",
      watch: false,
    });

    logger.info("DI container generated for development");
  } catch (error) {
    logger.warn("Failed to generate DI container", { error });
  }
}

async function startDevServer(config: any, options: DevOptions): Promise<void> {
  const port = parseInt(options.port) || config.port || 3000;
  const host = options.host || config.host || "localhost";

  // Try to use different development strategies
  if (await tryTsxDev(config, { ...options, port: port.toString(), host })) {
    return;
  }

  if (await tryTsNodeDev(config, { ...options, port: port.toString(), host })) {
    return;
  }

  // Fallback to nodemon
  await tryNodemonDev(config, { ...options, port: port.toString(), host });
}

async function tryTsxDev(config: any, options: DevOptions): Promise<boolean> {
  try {
    const { spawn } = await import("child_process");
    const path = await import("path");

    // Check if tsx is available
    const tsxPath = path.join(process.cwd(), "node_modules", ".bin", "tsx");

    try {
      const fs = await import("fs/promises");
      await fs.access(tsxPath);
    } catch {
      return false;
    }

    const entryFile = config.entry || "src/main.ts";
    const args = ["watch", "--clear-screen=false", entryFile];

    logger.info("Starting development server with tsx", {
      entry: entryFile,
      port: options.port,
      host: options.host,
    });

    const child = spawn(tsxPath, args, {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: options.port,
        HOST: options.host,
        NODE_ENV: "development",
      },
    });

    child.on("error", (error) => {
      logger.error("Development server error", { error });
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      logger.info("Shutting down development server...");
      child.kill("SIGTERM");
      process.exit(0);
    });

    logger.info(
      `🚀 Development server started on http://${options.host}:${options.port}`
    );
    return true;
  } catch (error) {
    logger.warn("Failed to start with tsx", { error });
    return false;
  }
}

async function tryTsNodeDev(
  config: any,
  options: DevOptions
): Promise<boolean> {
  try {
    const { spawn } = await import("child_process");
    const path = await import("path");

    // Check if ts-node-dev is available
    const tsNodeDevPath = path.join(
      process.cwd(),
      "node_modules",
      ".bin",
      "ts-node-dev"
    );

    try {
      const fs = await import("fs/promises");
      await fs.access(tsNodeDevPath);
    } catch {
      return false;
    }

    const entryFile = config.entry || "src/main.ts";
    const args = [
      "--respawn",
      "--transpile-only",
      "--ignore-watch",
      "node_modules",
      "--clear",
      entryFile,
    ];

    logger.info("Starting development server with ts-node-dev", {
      entry: entryFile,
      port: options.port,
      host: options.host,
    });

    const child = spawn(tsNodeDevPath, args, {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: options.port,
        HOST: options.host,
        NODE_ENV: "development",
      },
    });

    child.on("error", (error) => {
      logger.error("Development server error", { error });
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      logger.info("Shutting down development server...");
      child.kill("SIGTERM");
      process.exit(0);
    });

    logger.info(
      `🚀 Development server started on http://${options.host}:${options.port}`
    );
    return true;
  } catch (error) {
    logger.warn("Failed to start with ts-node-dev", { error });
    return false;
  }
}

async function tryNodemonDev(config: any, options: DevOptions): Promise<void> {
  try {
    const { spawn } = await import("child_process");
    const path = await import("path");

    // Try nodemon as fallback
    const nodemonPath = path.join(
      process.cwd(),
      "node_modules",
      ".bin",
      "nodemon"
    );
    const entryFile = config.entry || "src/main.ts";

    const args = [
      "--exec",
      "npx tsx",
      "--watch",
      path.dirname(entryFile),
      "--ext",
      "ts,js,json",
      "--ignore",
      "node_modules/",
      entryFile,
    ];

    logger.info("Starting development server with nodemon + tsx", {
      entry: entryFile,
      port: options.port,
      host: options.host,
    });

    const child = spawn(nodemonPath, args, {
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: options.port,
        HOST: options.host,
        NODE_ENV: "development",
      },
    });

    child.on("error", (error) => {
      logger.error("Development server error", { error });
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      logger.info("Shutting down development server...");
      child.kill("SIGTERM");
      process.exit(0);
    });

    logger.info(
      `🚀 Development server started on http://${options.host}:${options.port}`
    );
  } catch (error) {
    logger.error("Failed to start development server", { error });
    throw error;
  }
}
