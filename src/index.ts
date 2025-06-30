import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get version from package.json
const packagePath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

export const cli = "pulzar";
export const version = packageJson.version;

// CLI utilities and types
export interface CLIOptions {
  template?: string;
  database?: string;
  port?: string;
  watch?: boolean;
  edge?: boolean;
  output?: string;
  coverage?: boolean;
  skipInstall?: boolean;
  host?: string;
  minify?: boolean;
}

export interface ProjectTemplate {
  name: string;
  description: string;
  files: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}

// Export version info
export const getVersion = () => version;
export const getCLIName = () => cli;

// Export logger from utils
export { logger } from "./utils/logger.js";

// Export command interfaces
export * from "./commands/new.js";
export * from "./commands/dev.js";
export * from "./commands/build.js";
export * from "./commands/build-di.js";
