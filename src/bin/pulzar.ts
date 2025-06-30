#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package version
const packagePath = join(__dirname, "../../package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

const cli = new Command();

cli
  .name("pulzar")
  .description("Pulzar - Modern Node.js framework")
  .version(packageJson.version);

// New command - use actual implementation
cli
  .command("new <name>")
  .description("Create a new Pulzar project")
  .option(
    "-t, --template <template>",
    "Project template (basic, api, fullstack, microservice, graphql)",
    "basic"
  )
  .option(
    "--database <database>",
    "Database type (postgresql, mysql, mongodb, sqlite)",
    "postgresql"
  )
  .option("--skip-install", "Skip dependency installation", false)
  .option("--description <description>", "Project description")
  .option("--author <author>", "Project author")
  .action(async (name: string, options) => {
    try {
      const { newCommand } = await import("../commands/new.js");
      await newCommand(name, options);
    } catch (error) {
      console.error("❌ Failed to create project:", error);
      process.exit(1);
    }
  });

// Dev command - use actual implementation
cli
  .command("dev")
  .description("Start development server")
  .option("-p, --port <port>", "Port number", "3000")
  .option("-h, --host <host>", "Host address", "localhost")
  .option("--watch", "Watch for file changes", true)
  .action(
    async (options: { port?: string; host?: string; watch?: boolean }) => {
      try {
        const { devCommand } = await import("../commands/dev.js");
        await devCommand({
          port: options.port || "3000",
          host: options.host || "localhost",
          watch: options.watch ?? true,
        });
      } catch (error) {
        console.error("❌ Failed to start dev server:", error);
        process.exit(1);
      }
    }
  );

// Build command - use actual implementation
cli
  .command("build")
  .description("Build for production")
  .option("--edge", "Build for edge runtime")
  .option("--minify", "Minify output")
  .option("-o, --out <dir>", "Output directory", "dist")
  .action(
    async (options: { edge?: boolean; minify?: boolean; out?: string }) => {
      try {
        const { buildCommand } = await import("../commands/build.js");
        await buildCommand({
          out: options.out || "dist",
          edge: options.edge || false,
          minify: options.minify || false,
        });
      } catch (error) {
        console.error("❌ Failed to build project:", error);
        process.exit(1);
      }
    }
  );

// Build DI command
cli
  .command("build-di")
  .description("Build dependency injection container from source code")
  .option("-s, --source-dir <dir>", "Source directory to scan", "src")
  .option(
    "-o, --output-file <file>",
    "Output file for generated container",
    "src/generated/di-container.ts"
  )
  .option("-t, --tsconfig <file>", "TypeScript config file", "tsconfig.json")
  .option("-w, --watch", "Watch for changes and rebuild automatically", false)
  .option("--no-validate", "Skip validation of the generated container", false)
  .action(async (options) => {
    try {
      const { buildDI } = await import("../commands/build-di.js");
      await buildDI(options);
    } catch (error) {
      console.error("❌ Failed to build DI container:", error);
      process.exit(1);
    }
  });

// Info command
cli
  .command("info")
  .description("Show project and environment information")
  .action(() => {
    console.log("📋 Pulzar Project Information");
    console.log(`📦 CLI Version: ${packageJson.version}`);
    console.log(`🟢 Node.js: ${process.version}`);
    console.log(`📁 Current Directory: ${process.cwd()}`);
    console.log(`🏗️  Platform: ${process.platform}`);
    console.log(`💻 Architecture: ${process.arch}`);
  });

// Help command
cli
  .command("help [command]")
  .description("Display help for a command")
  .action((command?: string) => {
    if (command) {
      cli.outputHelp();
    } else {
      console.log("🚀 Pulzar CLI");
      console.log("");
      console.log("Available commands:");
      console.log("  new <name>     Create a new Pulzar project");
      console.log("  dev            Start development server");
      console.log("  build          Build for production");
      console.log("  build-di       Build DI container");
      console.log("  info           Show project information");
      console.log("  help           Show this help message");
      console.log("");
      console.log("Use 'pulzar <command> --help' for more info on a command");
    }
  });

// Handle unknown commands
cli.on("command:*", (operands) => {
  console.error(`❌ Unknown command: ${operands[0]}`);
  console.log("Run 'pulzar help' to see available commands");
  process.exit(1);
});

// Global error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// If no command is provided, show help
if (process.argv.length <= 2) {
  cli.outputHelp();
  process.exit(0);
}

// Parse command line arguments
cli.parse();
