import { Command } from "commander";
import { logger } from "../utils/logger.js";
import { templateEngine } from "../utils/template-engine.js";

export interface NewOptions {
  template?: string;
  database?: string;
  skipInstall?: boolean;
  description?: string;
  author?: string;
}

export async function newCommand(
  projectName: string,
  options: NewOptions = {}
): Promise<void> {
  try {
    // Validate project name
    if (!projectName || projectName.trim() === "") {
      logger.error("Project name is required");
      process.exit(1);
    }

    // Sanitize project name
    const sanitizedName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (sanitizedName !== projectName) {
      logger.warn(`Project name sanitized: ${projectName} -> ${sanitizedName}`);
    }

    // Validate template
    const validTemplates = [
      "basic",
      "api",
      "fullstack",
      "microservice",
      "graphql",
    ];
    const template = options.template || "basic";

    if (!validTemplates.includes(template)) {
      logger.error(
        `Invalid template: ${template}. Valid options: ${validTemplates.join(", ")}`
      );
      process.exit(1);
    }

    // Validate database
    const validDatabases = ["postgresql", "mysql", "mongodb", "sqlite"];
    const database = options.database || "postgresql";

    if (!validDatabases.includes(database)) {
      logger.error(
        `Invalid database: ${database}. Valid options: ${validDatabases.join(", ")}`
      );
      process.exit(1);
    }

    // Check if directory already exists
    try {
      const fs = await import("fs/promises");
      await fs.access(sanitizedName);
      logger.error(`Directory ${sanitizedName} already exists`);
      process.exit(1);
    } catch {
      // Directory doesn't exist, which is good
    }

    logger.info(`Creating new Pulzar project: ${sanitizedName}`);
    logger.info(`Template: ${template}`);
    logger.info(`Database: ${database}`);

    // Create project using template engine
    const createOptions: any = {
      database,
      skipInstall: options.skipInstall || false,
    };

    if (options.description) {
      createOptions.description = options.description;
    }

    if (options.author) {
      createOptions.author = options.author;
    }

    await templateEngine.createProject(sanitizedName, template, createOptions);

    // Final success message
    logger.info("");
    logger.success("🎉 Project created successfully!");
    logger.info("");
    logger.info("Next steps:");
    logger.info(`  cd ${sanitizedName}`);
    if (options.skipInstall) {
      logger.info("  npm install");
    }
    logger.info("  npm run dev");
    logger.info("");
    logger.info("Happy coding! 🚀");
  } catch (error) {
    logger.error("Failed to create project", { error });
    process.exit(1);
  }
}

// Export command for use in CLI
export const newCommandDef = new Command("new")
  .argument("<name>", "Project name")
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
  .action(newCommand);
