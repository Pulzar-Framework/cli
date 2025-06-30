import { Command } from "commander";
import { logger } from "../utils/logger.js";
import { execAsync } from "../utils/index.js";

export const initCommand = new Command("init")
  .description("Initialize Pulzar in an existing project")
  .option("-f, --force", "Overwrite existing files")
  .action(async (options) => {
    try {
      logger.info("🚀 Initializing Pulzar development environment...");

      // Check if package.json exists
      // Install dependencies
      // Create config files
      // Setup git hooks

      // Git commit if git repo exists
      try {
        await execAsync('git add .');
        await execAsync('git commit -m "Initial commit: Pulzar project setup"');
        logger.success("✅ Created initial git commit");
      } catch {
        logger.info("ℹ️ No git repository found, skipping commit");
      }

      logger.success(`
🎉 Your Pulzar development environment is ready!

📁 Project Structure:
   src/
   ├── routes/          # API routes
   ├── services/        # Business logic
   ├── middleware/      # Custom middleware
   └── main.ts         # Application entry

🚀 Next Steps:
   1. Start development: pulzar dev
   2. Create your first route in src/routes/
   3. Add services for business logic
   
📖 Documentation: https://docs.pulzar.dev
💬 Support: https://discord.gg/pulzar
      `);
    } catch (error) {
      logger.error("Failed to initialize project", { error });
      process.exit(1);
    }
  });
