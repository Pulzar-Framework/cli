import { logger } from "../../utils/logger";
import { promises as fs } from "fs";

export async function configValidateCommand() {
  try {
    logger.info("Validating configuration files...");

    const validations = [
      {
        file: "ignite.config.ts",
        validator: validateIgniteConfig,
      },
      {
        file: "tsconfig.json",
        validator: validateTsConfig,
      },
      {
        file: "package.json",
        validator: validatePackageJson,
      },
      {
        file: ".env",
        validator: validateEnvFile,
        optional: true,
      },
    ];

    let hasErrors = false;

    for (const validation of validations) {
      try {
        await fs.access(validation.file);
        const content = await fs.readFile(validation.file, "utf8");
        const result = await validation.validator(content);

        if (result.valid) {
          logger.info(`✓ ${validation.file} is valid`);
        } else {
          logger.error(`✗ ${validation.file} has errors:`, {
            errors: result.errors,
          });
          hasErrors = true;
        }
      } catch (error) {
        if (validation.optional) {
          logger.warn(`⚠ ${validation.file} not found (optional)`);
        } else {
          logger.error(`✗ ${validation.file} not found`);
          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      logger.error("Configuration validation failed");
      process.exit(1);
    } else {
      logger.info("All configuration files are valid");
    }
  } catch (error) {
    logger.error("Failed to validate configuration", { error });
    process.exit(1);
  }
}

async function validateIgniteConfig(
  content: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Basic syntax check
  if (!content.includes("defineConfig")) {
    errors.push("Missing defineConfig import or usage");
  }

  if (!content.includes("export default")) {
    errors.push("Missing default export");
  }

  return { valid: errors.length === 0, errors };
}

async function validateTsConfig(
  content: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const config = JSON.parse(content);

    if (!config.compilerOptions) {
      errors.push("Missing compilerOptions");
    }

    if (!config.include) {
      errors.push("Missing include array");
    }
  } catch (error) {
    errors.push("Invalid JSON syntax");
  }

  return { valid: errors.length === 0, errors };
}

async function validatePackageJson(
  content: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const pkg = JSON.parse(content);

    if (!pkg.name) {
      errors.push("Missing package name");
    }

    if (!pkg.version) {
      errors.push("Missing package version");
    }

    if (!pkg.scripts) {
      errors.push("Missing scripts section");
    }
  } catch (error) {
    errors.push("Invalid JSON syntax");
  }

  return { valid: errors.length === 0, errors };
}

async function validateEnvFile(
  content: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (line && !line.startsWith("#") && !line.includes("=")) {
      errors.push(`Line ${i + 1}: Invalid environment variable format`);
    }
  }

  return { valid: errors.length === 0, errors };
}
