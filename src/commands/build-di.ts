import { Command } from "commander";
import * as path from "path";
import { logger } from "../utils/logger";
import { createASTCompiler } from "@pulzar/core";

export interface BuildDIOptions {
  sourceDir?: string;
  outputFile?: string;
  tsconfig?: string;
  watch?: boolean;
  validate?: boolean;
}

/**
 * Build DI container from source code
 */
export async function buildDI(options: BuildDIOptions = {}): Promise<void> {
  const startTime = performance.now();

  const config = {
    sourceDir: options.sourceDir || "src",
    outputFile: options.outputFile || "src/generated/di-container.ts",
    tsconfig: options.tsconfig || "tsconfig.json",
    watch: options.watch || false,
    validate: options.validate ?? true,
  };

  logger.info("🔨 Building DI container", {
    sourceDir: config.sourceDir,
    outputFile: config.outputFile,
    watch: config.watch,
  });

  try {
    // Create AST compiler
    const compiler = createASTCompiler(config.tsconfig, config.sourceDir);

    // Scan project for DI metadata
    await compiler.scanProject();

    // Compile to container
    const result = await compiler.compile();

    // Validate if enabled
    if (config.validate) {
      await validateCompilationResult(result);
    }

    // Save generated code
    await compiler.saveGeneratedCode(config.outputFile, result);

    const buildTime = performance.now() - startTime;

    logger.info("✅ DI container built successfully", {
      providers: result.providers.length,
      modules: result.modules.length,
      outputFile: config.outputFile,
      buildTime: `${buildTime.toFixed(2)}ms`,
    });

    // Setup watch mode if requested
    if (config.watch) {
      await setupWatchMode(compiler, config);
    }
  } catch (error) {
    logger.error("❌ Failed to build DI container", { error });
    process.exit(1);
  }
}

/**
 * Validate compilation result
 */
async function validateCompilationResult(result: any): Promise<void> {
  const errors: string[] = [];

  // Check for missing dependencies
  for (const provider of result.providers) {
    for (const dep of provider.dependencies) {
      const depExists = result.providers.some((p: any) => p.token === dep);
      if (!depExists) {
        errors.push(
          `Missing dependency '${dep}' for provider '${provider.token}'`
        );
      }
    }
  }

  // Check for circular dependencies
  const visited = new Set();
  const visiting = new Set();

  function checkCircular(token: string, path: string[] = []): boolean {
    if (visiting.has(token)) {
      errors.push(
        `Circular dependency detected: ${path.concat(token).join(" -> ")}`
      );
      return true;
    }
    if (visited.has(token)) return false;

    visiting.add(token);
    const provider = result.providers.find((p: any) => p.token === token);

    if (provider) {
      for (const dep of provider.dependencies) {
        if (checkCircular(dep, path.concat(token))) {
          return true;
        }
      }
    }

    visiting.delete(token);
    visited.add(token);
    return false;
  }

  for (const provider of result.providers) {
    checkCircular(provider.token);
  }

  if (errors.length > 0) {
    logger.error("❌ DI validation failed", { errors });
    throw new Error(`DI validation failed: ${errors.join(", ")}`);
  }

  logger.info("✅ DI validation passed");
}

/**
 * Setup incremental watch mode for auto-rebuilding
 */
async function setupWatchMode(compiler: any, config: any): Promise<void> {
  const chokidar = await import("chokidar");
  const fs = await import("fs/promises");

  // Track file changes for incremental builds
  const fileHashes = new Map<string, string>();
  const lastBuildTime = new Map<string, number>();

  const watcher = chokidar.watch(path.join(config.sourceDir, "**/*.ts"), {
    ignored: [
      "**/*.d.ts",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/node_modules/**",
      config.outputFile,
    ],
    persistent: true,
    ignoreInitial: false, // Process existing files
  });

  logger.info("👀 Setting up incremental watch mode...", {
    pattern: path.join(config.sourceDir, "**/*.ts"),
  });

  // Initialize file hashes
  await initializeFileHashes();

  async function initializeFileHashes(): Promise<void> {
    try {
      const files = await getSourceFiles(config.sourceDir);
      for (const filePath of files) {
        const hash = await getFileHash(filePath);
        fileHashes.set(filePath, hash);
        lastBuildTime.set(filePath, Date.now());
      }
      logger.info("📄 Initialized file tracking", { files: files.length });
    } catch (error) {
      logger.warn("Failed to initialize file hashes", { error });
    }
  }

  async function getSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (
            entry.isDirectory() &&
            !entry.name.startsWith(".") &&
            entry.name !== "node_modules"
          ) {
            await scanDir(fullPath);
          } else if (
            entry.isFile() &&
            entry.name.endsWith(".ts") &&
            !entry.name.endsWith(".d.ts")
          ) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory might not exist, skip
      }
    }

    await scanDir(dir);
    return files;
  }

  async function getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const crypto = await import("crypto");
      return crypto.createHash("md5").update(content).digest("hex");
    } catch {
      return "";
    }
  }

  async function hasFileChanged(filePath: string): Promise<boolean> {
    const currentHash = await getFileHash(filePath);
    const lastHash = fileHashes.get(filePath);

    if (currentHash !== lastHash) {
      fileHashes.set(filePath, currentHash);
      return true;
    }

    return false;
  }

  async function incrementalRebuild(changedFiles: string[]): Promise<void> {
    const startTime = performance.now();

    try {
      // Only rescan changed files and their dependencies
      logger.info("🔄 Incremental rebuild started", {
        changedFiles: changedFiles.length,
        files: changedFiles.map((f) => path.relative(process.cwd(), f)),
      });

      // Determine what needs to be rebuilt
      const affectedFiles = await findAffectedFiles(changedFiles);

      if (affectedFiles.length === 0) {
        logger.info("✨ No changes detected, skipping rebuild");
        return;
      }

      // Incremental scan only affected files
      await compiler.incrementalScan(affectedFiles);
      const result = await compiler.compile();
      await compiler.saveGeneratedCode(config.outputFile, result);

      const buildTime = performance.now() - startTime;

      logger.info("✅ Incremental rebuild completed", {
        providers: result.providers.length,
        modules: result.modules.length,
        affectedFiles: affectedFiles.length,
        buildTime: `${buildTime.toFixed(2)}ms`,
      });

      // Update build times
      changedFiles.forEach((file) => {
        lastBuildTime.set(file, Date.now());
      });
    } catch (error) {
      logger.error("❌ Incremental rebuild failed", {
        error,
        changedFiles: changedFiles.length,
      });
    }
  }

  async function findAffectedFiles(changedFiles: string[]): Promise<string[]> {
    const affected = new Set(changedFiles);

    // Find files that import the changed files
    const allFiles = await getSourceFiles(config.sourceDir);

    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, "utf-8");

        // Simple import detection (could be improved with AST)
        for (const changedFile of changedFiles) {
          const relativePath = path
            .relative(path.dirname(file), changedFile)
            .replace(/\.ts$/, "");
          const normalizedPath = relativePath.replace(/\\/g, "/");

          if (
            content.includes(`from '${normalizedPath}'`) ||
            content.includes(`from "./${normalizedPath}"`) ||
            content.includes(`import('${normalizedPath}')`)
          ) {
            affected.add(file);
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return Array.from(affected);
  }

  // Debounce rapid file changes
  let rebuildTimeout: NodeJS.Timeout | null = null;
  const pendingChanges = new Set<string>();

  const debouncedRebuild = (filePath: string) => {
    pendingChanges.add(filePath);

    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
    }

    rebuildTimeout = setTimeout(async () => {
      const changedFiles = Array.from(pendingChanges);
      pendingChanges.clear();

      // Filter to only files that actually changed
      const actualChanges: string[] = [];
      for (const file of changedFiles) {
        if (await hasFileChanged(file)) {
          actualChanges.push(file);
        }
      }

      if (actualChanges.length > 0) {
        await incrementalRebuild(actualChanges);
      }

      rebuildTimeout = null;
    }, 150); // 150ms debounce
  };

  watcher.on("change", debouncedRebuild);
  watcher.on("add", debouncedRebuild);
  watcher.on("unlink", (filePath) => {
    fileHashes.delete(filePath);
    lastBuildTime.delete(filePath);
    debouncedRebuild(filePath);
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    logger.info("🛑 Stopping incremental watch mode...");
    if (rebuildTimeout) {
      clearTimeout(rebuildTimeout);
    }
    watcher.close();
    process.exit(0);
  });

  logger.info("👀 Incremental watch mode active", {
    debounce: "150ms",
    tracking: fileHashes.size,
  });
}

/**
 * Commander.js command setup
 */
export function createBuildDICommand(): Command {
  return new Command("build-di")
    .description("Build dependency injection container from source code")
    .option("-s, --source-dir <dir>", "Source directory to scan", "src")
    .option(
      "-o, --output-file <file>",
      "Output file for generated container",
      "src/generated/di-container.ts"
    )
    .option("-t, --tsconfig <file>", "TypeScript config file", "tsconfig.json")
    .option("-w, --watch", "Watch for changes and rebuild automatically", false)
    .option(
      "--no-validate",
      "Skip validation of the generated container",
      false
    )
    .action(async (options) => {
      await buildDI(options);
    });
}

/**
 * Dedicated watch command for better CLI experience
 */
export function createWatchDICommand(): Command {
  return new Command("di:watch")
    .alias("watch-di")
    .description("Watch for changes and incrementally rebuild DI container")
    .option("-s, --source-dir <dir>", "Source directory to scan", "src")
    .option(
      "-o, --output-file <file>",
      "Output file for generated container",
      "src/generated/di-container.ts"
    )
    .option("-t, --tsconfig <file>", "TypeScript config file", "tsconfig.json")
    .option(
      "--no-validate",
      "Skip validation of the generated container",
      false
    )
    .option(
      "--debounce <ms>",
      "Debounce time for file changes in milliseconds",
      "150"
    )
    .action(async (options) => {
      // Force watch mode
      await buildDI({ ...options, watch: true });
    });
}
