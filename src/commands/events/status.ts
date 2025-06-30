import { logger } from "../../utils/logger";

interface EventStatusOptions {
  adapter?: string;
  verbose?: boolean;
  format?: "table" | "json";
}

export async function eventStatusCommand(
  options: EventStatusOptions = {}
): Promise<void> {
  try {
    logger.info("🔍 Event Bus Status Check");

    // Try to load event bus from core
    const { createEventBus } = await import("../../../../core/src/events/bus");

    // Create event bus with specified adapter
    const eventBus = createEventBus({
      adapter: (options.adapter as any) || "memory",
      observability: {
        metrics: true,
        tracing: false,
        logging: true,
        healthChecks: true,
      },
    });

    // Connect to check status
    await eventBus.connect();

    // Get statistics
    const stats = await eventBus.getStats();

    // Get health status if supported
    let healthStatus;
    try {
      const adapter = (eventBus as any).adapter;
      if (adapter && adapter.healthCheck) {
        healthStatus = await adapter.healthCheck();
      }
    } catch (error) {
      logger.debug("Health check not supported", { error });
    }

    // Format output
    if (options.format === "json") {
      console.log(
        JSON.stringify(
          {
            connected: eventBus.isConnected(),
            stats,
            health: healthStatus,
          },
          null,
          2
        )
      );
    } else {
      // Table format
      console.log("\n📊 Event Bus Statistics:");
      console.log(`  Connected: ${eventBus.isConnected() ? "✅" : "❌"}`);
      console.log(`  Adapter: ${(eventBus as any).adapter?.name || "unknown"}`);
      console.log(`  Published: ${stats.published}`);
      console.log(`  Delivered: ${stats.delivered}`);
      console.log(`  Acknowledged: ${stats.acknowledged}`);
      console.log(`  Failed: ${stats.failed}`);
      console.log(`  Active Subscriptions: ${stats.activeSubscriptions}`);
      console.log(`  DLQ Size: ${stats.dlqSize}`);
      console.log(`  Queue Size: ${stats.queueSize}`);
      console.log(`  Concurrent Handlers: ${stats.concurrentHandlers}`);
      console.log(
        `  Memory Usage: ${Math.round(stats.memoryUsage / 1024 / 1024)}MB`
      );
      console.log(`  Throughput: ${stats.throughputPerSecond}/sec`);
      console.log(`  Avg Latency: ${Math.round(stats.averageLatency)}ms`);
      console.log(`  Error Rate: ${Math.round(stats.errorRate * 100)}%`);

      if (healthStatus) {
        console.log(
          `\n🏥 Health Status: ${getHealthStatusEmoji(healthStatus.status)} ${healthStatus.status.toUpperCase()}`
        );

        if (options.verbose) {
          for (const check of healthStatus.checks) {
            const emoji =
              check.status === "pass"
                ? "✅"
                : check.status === "warn"
                  ? "⚠️"
                  : "❌";
            console.log(`  ${emoji} ${check.name}: ${check.message}`);
            if (check.duration) {
              console.log(`    Duration: ${check.duration}ms`);
            }
          }
        }
      }

      if (options.verbose) {
        console.log(`\n📈 Additional Details:`);
        console.log(`  Last Activity: ${stats.lastActivity}`);
        console.log(`  Backpressure Events: ${stats.backpressureEvents}`);
        console.log(`  Schemas Registered: ${stats.schemasRegistered}`);
        console.log(
          `  Adapters Connected: ${stats.adaptersConnected.join(", ")}`
        );
      }
    }

    await eventBus.disconnect();
    logger.info("✅ Event status check completed");
  } catch (error) {
    logger.error("❌ Failed to check event status", { error });
    process.exit(1);
  }
}

function getHealthStatusEmoji(status: string): string {
  switch (status) {
    case "healthy":
      return "✅";
    case "degraded":
      return "⚠️";
    case "unhealthy":
      return "❌";
    default:
      return "❓";
  }
}

export default eventStatusCommand;
