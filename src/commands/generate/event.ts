import { logger } from "../../utils/logger";
import { writeFileIfAbsent } from "../../utils/file-utils";
import { join } from "path";

export interface EventOptions {
  path: string;
}

export async function generateEvent(name: string, options: EventOptions) {
  try {
    logger.info(`Generating event handler: ${name}`, { options });

    const className = `${name.charAt(0).toUpperCase() + name.slice(1)}Handler`;
    const fileName = `${name.toLowerCase()}.handler.ts`;
    const filePath = join(options.path, fileName);

    const eventContent = `import { Injectable, EventHandler, On } from "@ignite/core";
import { logger } from "@ignite/core";

export interface ${name.charAt(0).toUpperCase() + name.slice(1)}Event {
  id: string;
  data: any;
  timestamp: string;
  userId?: string;
}

@Injectable()
export class ${className} {
  /**
   * Handle ${name} event
   */
  @On("${name.toLowerCase()}")
  async handle(event: ${
    name.charAt(0).toUpperCase() + name.slice(1)
  }Event): Promise<void> {
    try {
      logger.info("Handling ${name} event", { eventId: event.id });
      
      // TODO: Implement event handling logic
      await this.processEvent(event);
      
      logger.info("${name} event processed successfully", { eventId: event.id });
    } catch (error) {
      logger.error("Failed to handle ${name} event", { 
        eventId: event.id, 
        error 
      });
      throw error;
    }
  }

  private async processEvent(event: ${
    name.charAt(0).toUpperCase() + name.slice(1)
  }Event): Promise<void> {
    // TODO: Implement your event processing logic here
    logger.debug("Processing ${name} event", { event });
    
    // Example: Send notifications, update database, call external APIs, etc.
    await this.performBusinessLogic(event);
  }

  private async performBusinessLogic(event: ${
    name.charAt(0).toUpperCase() + name.slice(1)
  }Event): Promise<void> {
    // TODO: Implement business logic
    console.log(\`Processing event: \${event.id}\`);
  }

  /**
   * Handle event errors
   */
  @On("${name.toLowerCase()}.error")
  async handleError(error: any): Promise<void> {
    logger.error("${name} event error", { error });
    
    // TODO: Implement error handling logic
    // Example: Send to dead letter queue, notify administrators, etc.
  }
}

export const ${name.toLowerCase()}Handler = new ${className}();
`;

    await writeFileIfAbsent(filePath, eventContent);
    logger.info(`Event handler created: ${filePath}`);
    logger.info(`Event handler ${name} generated successfully`);
  } catch (error) {
    logger.error(`Failed to generate event handler: ${name}`, { error });
    process.exit(1);
  }
}
