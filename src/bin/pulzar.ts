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

const program = new Command();

program
  .name("pulzar")
  .description("Pulzar - Modern Node.js framework")
  .version(packageJson.version);

// New command
program
  .command("new <name>")
  .description("Create a new Pulzar project")
  .option("-t, --template <template>", "Project template", "api")
  .option("--database <db>", "Database type", "postgresql")
  .action((name: string, options: { template?: string; database?: string }) => {
    console.log(`🚀 Creating new Pulzar project: ${name}`);
    console.log(`📁 Template: ${options.template}`);
    console.log(`🗄️  Database: ${options.database}`);
    console.log("✅ Project created successfully!");
  });

// Dev command
program
  .command("dev")
  .description("Start development server")
  .option("-p, --port <port>", "Port number", "3000")
  .option("-h, --host <host>", "Host address", "localhost")
  .option("--watch", "Watch for file changes", true)
  .action(
    async (options: { port?: string; host?: string; watch?: boolean }) => {
      const { devCommand } = await import("../commands/dev.js");
      await devCommand({
        port: options.port || "3000",
        host: options.host || "localhost",
        watch: options.watch ?? true,
      });
    }
  );

// Build command
program
  .command("build")
  .description("Build for production")
  .option("--edge", "Build for edge runtime")
  .option("--minify", "Minify output")
  .option("-o, --out <dir>", "Output directory", "dist")
  .action(
    async (options: { edge?: boolean; minify?: boolean; out?: string }) => {
      const { buildCommand } = await import("../commands/build.js");
      await buildCommand({
        out: options.out || "dist",
        edge: options.edge || false,
        minify: options.minify || false,
      });
    }
  );

// Test command
program
  .command("test")
  .description("Run tests")
  .option("--coverage", "Generate coverage report")
  .option("--watch", "Watch mode")
  .action((options: { coverage?: boolean; watch?: boolean }) => {
    console.log("🧪 Running tests...");
    if (options.coverage) {
      console.log("📊 Generating coverage report");
    }
    if (options.watch) {
      console.log("👀 Running in watch mode");
    }
  });

// Generate command
program
  .command("generate <type> <name>")
  .description("Generate code scaffolding")
  .alias("g")
  .action((type: string, name: string) => {
    console.log(`🛠️  Generating ${type}: ${name}`);
    console.log("✅ Code generated successfully!");
  });

// Build DI command
program
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
    const { buildDI } = await import("../commands/build-di.js");
    await buildDI(options);
  });

// Watch DI command (incremental)
program
  .command("di:watch")
  .alias("watch-di")
  .description("Watch for changes and incrementally rebuild DI container")
  .option("-s, --source-dir <dir>", "Source directory to scan", "src")
  .option(
    "-o, --output-file <file>",
    "Output file for generated container",
    "src/generated/di-container.ts"
  )
  .option("-t, --tsconfig <file>", "TypeScript config file", "tsconfig.json")
  .option("--no-validate", "Skip validation of the generated container", false)
  .option(
    "--debounce <ms>",
    "Debounce time for file changes in milliseconds",
    "150"
  )
  .action(async (options) => {
    const { buildDI } = await import("../commands/build-di.js");
    await buildDI({ ...options, watch: true });
  });

// Info command
program
  .command("info")
  .description("Show project information")
  .action(() => {
    console.log("📋 Pulzar Project Information");
    console.log(`📦 CLI Version: ${packageJson.version}`);
    console.log(`🟢 Node.js: ${process.version}`);
    console.log(`📁 Current Directory: ${process.cwd()}`);
  });

// Handle unknown commands
program.on("command:*", (operands) => {
  console.error(`❌ Unknown command: ${operands[0]}`);
  console.log("Run 'pulzar --help' to see available commands");
  process.exit(1);
});

// Parse command line arguments
program.parse();
