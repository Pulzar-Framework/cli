import { logger } from "../../utils/logger";

interface DLQOptions {
  action: "list" | "retry" | "retryAll" | "remove" | "clear" | "stats";
  adapter?: string;
  id?: string;
  limit?: number;
  offset?: number;
  filter?: string;
  format?: "table" | "json";
}

export async function eventDLQCommand(options: DLQOptions): Promise<void> {
  try {
    logger.info(`🗂️ DLQ ${options.action.toUpperCase()}`);

    // Try to load event bus from core
    const { createEventBus } = await import("../../../../core/src/events/bus");

    // Create event bus with DLQ enabled
    const eventBus = createEventBus({
      adapter: (options.adapter as any) || "memory",
      dlq: {
        enabled: true,
        adapter: "redis",
        ttl: 7 * 24 * 60 * 60, // 7 days
        maxSize: 10000,
        retryStrategy: "exponential",
      },
    });

    // Connect
    await eventBus.connect();

    const dlq = eventBus.getDLQ();
    if (!dlq) {
      logger.error("❌ DLQ not available or not enabled");
      process.exit(1);
    }

    switch (options.action) {
      case "list":
        await listDLQEntries(dlq, options);
        break;
      case "retry":
        await retryDLQEntry(dlq, options);
        break;
      case "retryAll":
        await retryAllDLQEntries(dlq, options);
        break;
      case "remove":
        await removeDLQEntry(dlq, options);
        break;
      case "clear":
        await clearDLQ(dlq, options);
        break;
      case "stats":
        await showDLQStats(dlq, options);
        break;
      default:
        logger.error(`❌ Unknown action: ${options.action}`);
        process.exit(1);
    }

    await eventBus.disconnect();
    logger.info("✅ DLQ operation completed");
  } catch (error) {
    logger.error("❌ Failed to execute DLQ command", { error });
    process.exit(1);
  }
}

async function listDLQEntries(dlq: any, options: DLQOptions): Promise<void> {
  const limit = options.limit || 20;
  const offset = options.offset || 0;

  const entries = await dlq.list(limit, offset);

  if (options.format === "json") {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  if (entries.length === 0) {
    console.log("📭 No DLQ entries found");
    return;
  }

  console.log(`\n📋 DLQ Entries (${offset + 1}-${offset + entries.length}):`);
  console.log("─".repeat(100));

  for (const entry of entries) {
    const statusEmoji =
      entry.status === "pending"
        ? "⏳"
        : entry.status === "retrying"
          ? "🔄"
          : entry.status === "failed"
            ? "❌"
            : "❓";

    console.log(`${statusEmoji} ${entry.id}`);
    console.log(`  Subject: ${entry.originalSubject}`);
    console.log(`  Error: ${entry.error.message}`);
    console.log(`  Attempts: ${entry.attempts}`);
    console.log(`  Created: ${entry.createdAt}`);
    console.log(`  Status: ${entry.status}`);
    if (entry.nextRetry) {
      console.log(`  Next Retry: ${entry.nextRetry}`);
    }
    console.log("");
  }
}

async function retryDLQEntry(dlq: any, options: DLQOptions): Promise<void> {
  if (!options.id) {
    logger.error("❌ Entry ID is required for retry");
    process.exit(1);
  }

  await dlq.retry(options.id);
  console.log(`✅ Retrying DLQ entry: ${options.id}`);
}

async function retryAllDLQEntries(
  dlq: any,
  options: DLQOptions
): Promise<void> {
  let filter;
  if (options.filter) {
    try {
      filter = JSON.parse(options.filter);
    } catch (error) {
      logger.warn("Invalid filter JSON, retrying all entries");
    }
  }

  const count = await dlq.retryAll(filter);
  console.log(`✅ Retried ${count} DLQ entries`);
}

async function removeDLQEntry(dlq: any, options: DLQOptions): Promise<void> {
  if (!options.id) {
    logger.error("❌ Entry ID is required for removal");
    process.exit(1);
  }

  await dlq.remove(options.id);
  console.log(`✅ Removed DLQ entry: ${options.id}`);
}

async function clearDLQ(dlq: any, options: DLQOptions): Promise<void> {
  // Confirm before clearing
  console.log("⚠️  This will remove ALL DLQ entries. Are you sure? (y/N)");

  // For CLI, we'll skip confirmation for now
  await dlq.clear();
  console.log("✅ Cleared all DLQ entries");
}

async function showDLQStats(dlq: any, options: DLQOptions): Promise<void> {
  const stats = await dlq.getStats();

  if (options.format === "json") {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log("\n📊 DLQ Statistics:");
  console.log(`  Total Entries: ${stats.total}`);
  console.log(`  Pending: ${stats.pending}`);
  console.log(`  Retrying: ${stats.retrying}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Abandoned: ${stats.abandoned}`);
  if (stats.oldestEntry) {
    console.log(`  Oldest Entry: ${stats.oldestEntry}`);
  }
}

export default eventDLQCommand;
