import { logger } from "../utils/logger";

export interface BuildOptions {
  out: string;
  edge: boolean;
  minify: boolean;
}

export async function buildCommand(options: BuildOptions) {
  try {
    logger.info("Starting build process...", { options });

    // 1. Check if pulzar.config.ts exists
    const configPath = await findConfigFile();
    if (!configPath) {
      logger.error("No pulzar.config.ts found. Run 'pulzar init' first.");
      process.exit(1);
    }

    logger.info("Found configuration file", { path: configPath });

    // 2. Load configuration
    const config = await loadConfig(configPath);

    // 3. Setup output directory
    await setupOutputDirectory(options.out);

    // 4. Build TypeScript files
    await buildTypeScript(config, options);

    // 5. Generate DI container if needed
    await generateDIContainer(config);

    // 6. Bundle with esbuild if specified
    if (options.edge || config.edge) {
      await buildForEdge(config, options);
    } else {
      await bundleApplication(config, options);
    }

    // 7. Copy static files
    await copyStaticFiles(config, options.out);

    // 8. Generate package.json for output
    await generateOutputPackageJson(config, options);

    logger.info("Build completed successfully", {
      outputDir: options.out,
      edge: options.edge,
      minified: options.minify,
    });
  } catch (error) {
    logger.error("Build failed", { error });
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
    // Dynamic import of config file
    const config = await import(process.cwd() + "/" + configPath);
    return config.default || config;
  } catch (error) {
    logger.error("Failed to load configuration", { configPath, error });
    return {
      entry: "src/index.ts",
      outDir: "dist",
      target: "node",
      minify: false,
      bundle: true,
    };
  }
}

async function setupOutputDirectory(outDir: string): Promise<void> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    const absoluteOut = path.resolve(outDir);

    // Create output directory
    await fs.mkdir(absoluteOut, { recursive: true });

    // Clean existing files
    const files = await fs.readdir(absoluteOut);
    for (const file of files) {
      const filePath = path.join(absoluteOut, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
    }

    logger.info("Output directory prepared", { path: absoluteOut });
  } catch (error) {
    logger.error("Failed to setup output directory", { outDir, error });
    throw error;
  }
}

async function buildTypeScript(
  config: any,
  options: BuildOptions
): Promise<void> {
  try {
    // Try to use esbuild for fast compilation
    const esbuild = await tryImport("esbuild");

    if (esbuild) {
      const buildOptions = {
        entryPoints: [config.entry || "src/index.ts"],
        outdir: options.out,
        platform: config.target === "edge" ? "neutral" : "node",
        target: config.target === "edge" ? "es2022" : "node18",
        format: "esm" as const,
        bundle: config.bundle !== false,
        minify: options.minify,
        sourcemap: !options.minify,
        external: config.external || [],
        define: {
          "process.env.NODE_ENV": `"${process.env.NODE_ENV || "production"}"`,
        },
      };

      const result = await esbuild.build(buildOptions);

      if (result.errors.length > 0) {
        throw new Error(
          `Build errors: ${result.errors.map((e: any) => e.text).join(", ")}`
        );
      }

      logger.info("TypeScript compilation completed", {
        entryPoints: buildOptions.entryPoints.length,
        platform: buildOptions.platform,
      });
    } else {
      // Fallback to tsc if esbuild not available
      logger.warn("esbuild not available, using tsc fallback");
      await buildWithTSC(config, options);
    }
  } catch (error) {
    logger.error("TypeScript compilation failed", { error });
    throw error;
  }
}

async function buildWithTSC(config: any, options: BuildOptions): Promise<void> {
  const { spawn } = await import("child_process");
  const path = await import("path");

  return new Promise((resolve, reject) => {
    const tscPath = path.join(process.cwd(), "node_modules", ".bin", "tsc");
    const args = [
      "--outDir",
      options.out,
      "--target",
      "ES2022",
      "--module",
      "ESNext",
      "--moduleResolution",
      "node",
      "--esModuleInterop",
      "--allowSyntheticDefaultImports",
      "--strict",
      "--skipLibCheck",
    ];

    const tsc = spawn(tscPath, args, { stdio: "inherit" });

    tsc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`tsc exited with code ${code}`));
      }
    });

    tsc.on("error", reject);
  });
}

async function generateDIContainer(config: any): Promise<void> {
  try {
    // Import and run DI build command
    const { buildDI } = await import("./build-di");
    await buildDI({
      sourceDir: config.src || "src",
      outputFile: config.diOut || "src/generated/di-container.ts",
      watch: false,
    });

    logger.info("DI container generated");
  } catch (error) {
    logger.warn("Failed to generate DI container", { error });
    // Non-fatal error
  }
}

async function buildForEdge(config: any, options: BuildOptions): Promise<void> {
  logger.info("Building for edge runtime...");

  // Edge-specific optimizations
  const esbuild = await tryImport("esbuild");

  if (esbuild) {
    await esbuild.build({
      entryPoints: [config.entry || "src/index.ts"],
      outfile: `${options.out}/index.js`,
      platform: "neutral",
      target: "es2022",
      format: "esm",
      bundle: true,
      minify: true,
      treeShaking: true,
      external: [],
      define: {
        "process.env.NODE_ENV": '"production"',
        "process.env.EDGE_RUNTIME": '"1"',
      },
      banner: {
        js: "// Pulzar Edge Runtime Build",
      },
    });

    logger.info("Edge runtime build completed");
  } else {
    logger.warn("esbuild required for edge builds");
  }
}

async function bundleApplication(
  config: any,
  options: BuildOptions
): Promise<void> {
  if (!config.bundle) {
    logger.info("Bundling disabled, skipping...");
    return;
  }

  logger.info("Bundling application...");
  // Application bundling logic would go here
}

async function copyStaticFiles(config: any, outDir: string): Promise<void> {
  const staticDirs = config.static || ["public", "assets"];
  const fs = await import("fs/promises");
  const path = await import("path");

  for (const staticDir of staticDirs) {
    try {
      await fs.access(staticDir);
      const dest = path.join(outDir, path.basename(staticDir));
      await fs.cp(staticDir, dest, { recursive: true });
      logger.info("Static files copied", { from: staticDir, to: dest });
    } catch {
      // Static directory doesn't exist, skip
    }
  }
}

async function generateOutputPackageJson(
  config: any,
  options: BuildOptions
): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");

  try {
    // Read existing package.json
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"));

    // Create output package.json
    const outputPackage = {
      name: packageJson.name,
      version: packageJson.version,
      type: "module",
      main: "index.js",
      dependencies: config.bundleDependencies ? {} : packageJson.dependencies,
      engines: packageJson.engines,
    };

    await fs.writeFile(
      path.join(options.out, "package.json"),
      JSON.stringify(outputPackage, null, 2)
    );

    logger.info("Output package.json generated");
  } catch (error) {
    logger.warn("Failed to generate output package.json", { error });
  }
}

async function tryImport(moduleName: string): Promise<any> {
  try {
    return await import(moduleName);
  } catch {
    return null;
  }
}
