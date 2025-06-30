import { logger } from "../../utils/logger";

export async function pluginListCommand() {
  try {
    logger.info("Listing installed plugins...");

    // In a real implementation, this would:
    // 1. Read ignite.config.ts
    // 2. List configured plugins
    // 3. Show plugin status and versions

    const plugins = [
      { name: "prisma", version: "1.0.0", status: "active" },
      { name: "redis", version: "1.2.0", status: "active" },
      { name: "auth", version: "2.0.0", status: "inactive" },
    ];

    console.log("\nInstalled Plugins:");
    console.log("==================");

    if (plugins.length === 0) {
      console.log("No plugins installed");
    } else {
      plugins.forEach((plugin) => {
        const status = plugin.status === "active" ? "✓" : "✗";
        console.log(
          `${status} ${plugin.name}@${plugin.version} (${plugin.status})`
        );
      });
    }

    console.log("\nTo add a plugin: ignite plugin:add <name>");
    console.log("To remove a plugin: ignite plugin:remove <name>");
  } catch (error) {
    logger.error("Failed to list plugins", { error });
    process.exit(1);
  }
}
