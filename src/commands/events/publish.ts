import { logger } from "../../utils/logger";

interface PublishOptions {
  adapter?: string;
  subject: string;
  data?: string;
  headers?: string;
  count?: number;
  interval?: number;
  schema?: string;
}

export async function eventPublishCommand(
  options: PublishOptions
): Promise<void> {
  try {
    logger.info("📤 Publishing Test Event");

    if (!options.subject) {
      logger.error("❌ Subject is required");
      process.exit(1);
    }

    // Try to load event bus from core
    const { createEventBus } = await import("../../../../core/src/events/bus");

    // Create event bus with specified adapter
    const eventBus = createEventBus({
      adapter: (options.adapter as any) || "memory",
      observability: {
        metrics: true,
        tracing: true,
        logging: true,
        healthChecks: true,
      },
    });

    // Connect
    await eventBus.connect();

    // Parse data
    let eventData: any = {
      message: "Test event",
      timestamp: new Date().toISOString(),
    };
    if (options.data) {
      try {
        eventData = JSON.parse(options.data);
      } catch (error) {
        logger.warn("Invalid JSON data, using as string", {
          data: options.data,
        });
        eventData = {
          message: options.data,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Parse headers
    let headers: Record<string, any> = {};
    if (options.headers) {
      try {
        headers = JSON.parse(options.headers);
      } catch (error) {
        logger.warn("Invalid JSON headers, ignoring", {
          headers: options.headers,
        });
      }
    }

    const count = options.count || 1;
    const interval = options.interval || 0;

    logger.info(`Publishing ${count} event(s) to "${options.subject}"`);

    for (let i = 0; i < count; i++) {
      try {
        const publishData =
          count > 1 ? { ...eventData, sequence: i + 1 } : eventData;

        await eventBus.publish(options.subject, publishData, {
          headers,
          schema: options.schema,
          metadata: {
            source: "pulzar-cli",
            version: "1.0.0",
            testEvent: true,
          },
        });

        console.log(`✅ Published event ${i + 1}/${count}`);

        // Wait between events if interval specified
        if (interval > 0 && i < count - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      } catch (error) {
        logger.error(`❌ Failed to publish event ${i + 1}`, { error });
      }
    }

    // Show final stats
    const stats = await eventBus.getStats();
    console.log(`\n📊 Final Stats:`);
    console.log(`  Published: ${stats.published}`);
    console.log(`  Failed: ${stats.failed}`);

    await eventBus.disconnect();
    logger.info("✅ Event publishing completed");
  } catch (error) {
    logger.error("❌ Failed to publish events", { error });
    process.exit(1);
  }
}

export default eventPublishCommand;
