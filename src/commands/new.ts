import { Command } from "commander";
import { logger } from "../utils/logger.js";

export const newCommand = new Command("new")
  .argument("<name>", "Project name")
  .description("Create a new Pulzar project")
  .option("-t, --template <template>", "Project template", "basic")
  .option("--skip-install", "Skip dependency installation")
  .action(async (name: string, options) => {
    logger.info(`Creating new Pulzar project: ${name}`);
    
    // Project creation logic will be implemented here
    logger.success(`✅ Created ${name} successfully!`);
    logger.info(`📁 Navigate to: cd ${name}`);
    logger.info(`🚀 Start development: pulzar dev`);
  });
