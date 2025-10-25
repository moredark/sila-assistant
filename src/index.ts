import { Bot } from "grammy";
import { config } from "./config";
import logger from "./utils/logger";
import { setupHandlers } from "./bot/handlers";
import { startServer } from "./server";

async function main() {
  try {
    logger.info("Starting Telegram bot for Obsidian voice notes...");

    // Start the Fastify server
    await startServer();

    // Initialize Telegram bot
    const bot = new Bot(config.telegram.botToken);

    // Set up bot handlers
    setupHandlers(bot);

    // Start the bot
    await bot.start({
      drop_pending_updates: true,
    });

    logger.info("Bot and server started successfully!");
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

main().catch((error) => {
  logger.error("Unhandled error in main:", error);
  process.exit(1);
});
