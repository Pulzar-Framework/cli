import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface TaskOptions {
  path: string;
  schedule?: string;
}

export async function generateTask(name: string, options: TaskOptions) {
  try {
    logger.info(`Generating task: ${name}`, { options });

    const className = `${name.charAt(0).toUpperCase() + name.slice(1)}Task`;
    const fileName = `${name.toLowerCase()}.task.ts`;
    const filePath = join(options.path, fileName);

    const schedule = options.schedule || "0 */5 * * * *"; // Every 5 minutes by default

    const taskContent = `import { Injectable, Task, Cron } from "@ignite/core";
import { logger } from "@ignite/core";

@Injectable()
export class ${className} {
  /**
   * Scheduled task
   * Schedule: ${schedule}
   */
  @Cron("${schedule}")
  async execute(): Promise<void> {
    try {
      logger.info("${className} started");
      
      // TODO: Implement your task logic here
      await this.performTask();
      
      logger.info("${className} completed successfully");
    } catch (error) {
      logger.error("${className} failed", { error });
      throw error;
    }
  }

  /**
   * Manual task execution
   */
  async run(): Promise<void> {
    await this.execute();
  }

  private async performTask(): Promise<void> {
    // TODO: Implement the actual task logic
    logger.info("Performing ${name} task...");
    
    // Example: Database cleanup, file processing, API calls, etc.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info("${name} task completed");
  }

  /**
   * Task health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: Implement health check logic
      return true;
    } catch (error) {
      logger.error("${className} health check failed", { error });
      return false;
    }
  }
}

export const ${name.toLowerCase()}Task = new ${className}();
`;

    await writeFileIfAbsent(filePath, taskContent);
    logger.info(`Task created: ${filePath}`);
    logger.info(`Task ${name} generated successfully`);
    logger.info(`Schedule: ${schedule}`);
  } catch (error) {
    logger.error(`Failed to generate task: ${name}`, { error });
    process.exit(1);
  }
}
