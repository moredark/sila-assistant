import { Bot, Context } from "grammy";
import logger from "../utils/logger";
import { transcribeAudio } from "../services/transcription";
import { aiService } from "../services/ai";
import { createChannelService } from "../services/channel";
import { BOT_MESSAGES, CONTENT_TYPE_NAMES } from "../constants/messages";
import { ContentType } from "../types/channel";
import {
  isAuthorized,
  handleUnauthorized,
  downloadVoiceFile,
  getContentTypeFromAction,
  formatSuccessMessage,
  formatErrorMessage,
} from "../utils/bot";

export function setupHandlers(bot: Bot) {
  const channelService = createChannelService(bot);

  bot.command("start", async (ctx: Context) => {
    if (!isAuthorized(ctx)) {
      await handleUnauthorized(ctx);
      return;
    }

    logger.info(
      `User ${ctx.from?.id} (@${ctx.from?.username}) started the bot`
    );
    await ctx.reply(BOT_MESSAGES.START);
  });

  bot.command("help", async (ctx: Context) => {
    if (!isAuthorized(ctx)) {
      await handleUnauthorized(ctx);
      return;
    }

    await ctx.reply(BOT_MESSAGES.HELP, { parse_mode: "Markdown" });
  });

  bot.command("status", async (ctx: Context) => {
    if (!isAuthorized(ctx)) {
      await handleUnauthorized(ctx);
      return;
    }

    await ctx.reply(BOT_MESSAGES.STATUS, { parse_mode: "Markdown" });
  });

  bot.command("clear", async (ctx: Context) => {
    if (!isAuthorized(ctx)) {
      await handleUnauthorized(ctx);
      return;
    }

    try {
      const success = await channelService.clearTodayPost();

      if (success) {
        await ctx.reply(BOT_MESSAGES.CLEAR_SUCCESS, { parse_mode: "Markdown" });
      } else {
        await ctx.reply(BOT_MESSAGES.CLEAR_NOTHING, { parse_mode: "Markdown" });
      }
    } catch (error) {
      logger.error("Error clearing today's post:", error);
      await ctx.reply(BOT_MESSAGES.CLEAR_ERROR, { parse_mode: "Markdown" });
    }
  });

  bot.on("message:voice", async (ctx: Context) => {
    if (!isAuthorized(ctx)) {
      await handleUnauthorized(ctx);
      return;
    }

    logger.info(
      `Received voice message from user ${ctx.from?.id} (@${ctx.from?.username})`
    );

    try {
      const processingMsg = await ctx.reply(BOT_MESSAGES.PROCESSING_VOICE);

      const audioBuffer = await downloadVoiceFile(ctx);

      await ctx.api.editMessageText(
        ctx.chat!.id,
        processingMsg.message_id,
        BOT_MESSAGES.TRANSCRIBING
      );

      const transcription = await transcribeAudio(audioBuffer);
      logger.info(`Transcription: "${transcription}"`);

      await ctx.api.editMessageText(
        ctx.chat!.id,
        processingMsg.message_id,
        BOT_MESSAGES.ANALYZING
      );

      const analysis = await aiService.analyzeText(transcription);

      const markdownTask = aiService.formatTaskAsMarkdown(analysis);

      await ctx.api.editMessageText(
        ctx.chat!.id,
        processingMsg.message_id,
        BOT_MESSAGES.ADDING_TO_CHANNEL
      );

      const contentType = getContentTypeFromAction(analysis.action);

      await channelService.addContentToDailyPost(markdownTask, contentType);

      const successMessage = formatSuccessMessage(
        contentType,
        markdownTask,
        analysis.confidence
      );

      await ctx.api.editMessageText(
        ctx.chat!.id,
        processingMsg.message_id,
        successMessage
      );
    } catch (error) {
      logger.error("Error processing voice message:", error);
      await ctx.reply(formatErrorMessage(error));
    }
  });

  bot.on("message:text", async (ctx: Context) => {
    if (!isAuthorized(ctx)) {
      await handleUnauthorized(ctx);
      return;
    }

    logger.info(
      `Received text message from user ${ctx.from?.id} (@${ctx.from?.username}): ${ctx.message?.text}`
    );

    await ctx.reply(BOT_MESSAGES.TEXT_NOT_SUPPORTED);
  });

  bot.catch((err) => {
    logger.error("Bot error:", err);
  });

  logger.info("Bot handlers set up successfully");
}
