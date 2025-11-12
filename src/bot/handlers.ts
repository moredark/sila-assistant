import {
  getUserConfig,
  setUserConfig,
  setUserPrivateChannelId,
  setWaitingForChannelId,
} from "../services/userConfig";
import { Bot, Context } from "grammy";
import logger from "../utils/logger";
import { transcribeAudio } from "../services/transcription";
import { aiService } from "../services/ai";
import { createChannelService } from "../services/channel";
import { BOT_MESSAGES } from "../constants/messages";
import {
  downloadVoiceFile,
  getContentTypeFromAction,
  formatSuccessMessage,
  formatErrorMessage,
} from "../utils/bot";

export function setupHandlers(bot: Bot) {
  bot.command("start", async (ctx: Context) => {
    const userId = String(ctx.from?.id);
    const userConfig = await getUserConfig(userId);

    if (userConfig.privateChannelId) {
      await ctx.reply(BOT_MESSAGES.WELCOME_BACK);
    } else {
      await ctx.reply(BOT_MESSAGES.ASK_PRIVATE_CHANNEL_ID);
    }

    logger.info(
      `User ${ctx.from?.id} (@${ctx.from?.username}) started the bot`
    );
  });

  bot.command("help", async (ctx: Context) => {
    await ctx.reply(BOT_MESSAGES.HELP, { parse_mode: "Markdown" });
  });

  bot.command("status", async (ctx: Context) => {
    await ctx.reply(BOT_MESSAGES.STATUS, { parse_mode: "Markdown" });
  });

  bot.command("debug", async (ctx: Context) => {
    const userId = String(ctx.from?.id);

    try {
      const userConfig = await getUserConfig(userId);
      const configInfo = `🔍 Debug Information:
- User ID: ${userId}
- Private Channel ID: ${userConfig.privateChannelId || "Not set"}
- Waiting for Channel ID: ${userConfig.waitingForChannelId || false}

To test:
1. Add bot to a private channel as admin
2. The bot should automatically detect the channel
3. Try sending a voice message

If automatic detection doesn't work:
- Use /setchannel <channel_id>`;

      await ctx.reply(configInfo);
    } catch (error) {
      logger.error(`Debug command error for user ${userId}:`, error);
      await ctx.reply(`❌ Error retrieving debug info: ${error}`);
    }
  });

  bot.command("setchannel", async (ctx: Context) => {
    const userId = String(ctx.from?.id);
    const channelId = ctx.message?.text?.split(" ")[1];

    if (!channelId) {
      await ctx.reply(
        "❗ Использование: /setchannel <channel_id>\n\n" +
          "Как получить channel_id:\n" +
          "1. Добавьте бота в приватный канал\n" +
          "2. Назначьте его администратором\n" +
          "3. Напишите @userinfobot в канале\n" +
          "4. Или проверьте логи бота при добавлении"
      );
      return;
    }

    try {
      // Validate channel ID format
      if (!channelId.match(/^-?\d+$/)) {
        await ctx.reply(
          "❌ Неверный формат channel_id. Используйте только числа."
        );
        return;
      }

      logger.info(`[CMD] Setting channel for user ${userId}: ${channelId}`);

      // Save channel configuration
      await setUserPrivateChannelId(userId, channelId);
      await setWaitingForChannelId(userId, false);

      logger.info(`[CMD] Configuration saved, verifying...`);

      // Verify the save worked by reading it back
      const savedConfig = await getUserConfig(userId);
      logger.info(`[CMD] Verification read:`, savedConfig);

      if (savedConfig.privateChannelId === channelId) {
        logger.info(`[CMD] Manual channel setup successful for user ${userId}`);
        await ctx.reply(
          `✅ Channel ID установлен: ${channelId}\n\n` +
            `Теперь вы можете отправлять голосовые сообщения для создания задач!`
        );
      } else {
        logger.error(`[CMD] Verification failed - channel not saved properly`);
        await ctx.reply(
          `❌ Ошибка: Channel ID не был сохранен. Проверьте логи бота.`
        );
      }
    } catch (error) {
      logger.error(`Error setting manual channel for user ${userId}:`, error);
      await ctx.reply(`❌ Ошибка при сохранении channel_id: ${error}`);
    }
  });

  bot.command("removechannel", async (ctx: Context) => {
    const userId = String(ctx.from?.id);

    try {
      // Remove the channel configuration
      await setUserConfig(userId, {
        privateChannelId: undefined,
        waitingForChannelId: true,
      });

      logger.info(`[CMD] Removed channel configuration for user ${userId}`);

      await ctx.reply(
        `✅ Канал удален из конфигурации\n\n` +
          `Теперь вам нужно будет заново настроить канал, отправив боту:\n` +
          `/setchannel <channel_id>`
      );
    } catch (error) {
      logger.error(`Error removing channel for user ${userId}:`, error);
      await ctx.reply(`❌ Ошибка при удалении канала: ${error}`);
    }
  });

  bot.command("clear", async (ctx: Context) => {
    const userId = String(ctx.from?.id);
    const userConfig = await getUserConfig(userId);

    if (!userConfig.privateChannelId) {
      await ctx.reply(BOT_MESSAGES.ASK_PRIVATE_CHANNEL_ID);
      setWaitingForChannelId(userId, true);
      return;
    }

    const channelService = createChannelService(
      bot,
      userConfig.privateChannelId
    );

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
    const userId = String(ctx.from?.id);
    logger.info(`Voice message from userId: ${userId}`);

    let userConfig;
    try {
      userConfig = await getUserConfig(userId);
      logger.info(`Retrieved userConfig: ${JSON.stringify(userConfig)}`);
    } catch (error) {
      logger.error(`Error getting user config for user ${userId}:`, error);
      await ctx.reply(
        "❌ Ошибка при получении конфигурации пользователя. Попробуйте /start"
      );
      return;
    }

    if (!userConfig.privateChannelId) {
      logger.info(
        `No privateChannelId found for user ${userId}, asking user to configure`
      );
      await ctx.reply(BOT_MESSAGES.ASK_PRIVATE_CHANNEL_ID);
      await setWaitingForChannelId(userId, true);
      return;
    }

    logger.info(`Using privateChannelId: ${userConfig.privateChannelId}`);

    const channelService = createChannelService(
      bot,
      userConfig.privateChannelId
    );

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

  bot.on("my_chat_member", async (ctx: Context) => {
    const chat = ctx.chat;
    const newChatMember = ctx.myChatMember?.new_chat_member;
    const oldChatMember = ctx.myChatMember?.old_chat_member;

    logger.info(`my_chat_member event detected:`);
    logger.info(`- Chat ID: ${chat?.id}, Type: ${chat?.type}`);
    logger.info(`- New member status: ${newChatMember?.status}`);
    logger.info(`- Old member status: ${oldChatMember?.status}`);
    logger.info(`- Bot ID: ${ctx.me.id}, Added by: ${ctx.from?.id}`);

    // Check if the bot was added to a channel as administrator
    if (chat?.type === "channel" && newChatMember?.status === "administrator") {
      const userId = String(ctx.from?.id || chat?.id);
      const channelId = String(chat.id);

      logger.info(
        `Bot added to channel ${channelId} by user ${userId}. Saving configuration...`
      );

      try {
        // Save the channel ID
        await setUserPrivateChannelId(userId, channelId);
        await setWaitingForChannelId(userId, false);

        // Try to send confirmation message
        try {
          await ctx.api.sendMessage(
            userId,
            BOT_MESSAGES.PRIVATE_CHANNEL_ID_SAVED
          );
          logger.info(`Confirmation message sent to user ${userId}`);
        } catch (msgError) {
          logger.warn(
            `Could not send confirmation message to user ${userId}:`,
            msgError
          );
        }

        logger.info(
          `Bot successfully added to channel ${channelId} by user ${userId}. Configuration saved.`
        );
      } catch (error) {
        logger.error(
          `Failed to save channel configuration for user ${userId}:`,
          error
        );
      }
    } else if (
      chat?.type === "channel" &&
      newChatMember?.status === "member" &&
      oldChatMember?.status === "left"
    ) {
      // Bot was re-added as regular member, not admin
      const userId = String(ctx.from?.id || chat?.id);
      const channelId = String(chat.id);

      logger.info(
        `Bot added to channel ${channelId} as regular member (not admin). Requesting admin privileges...`
      );

      try {
        await ctx.api.sendMessage(
          userId,
          "🤖 Бот добавлен в канал, но не как администратор.\n\n" +
            "Для работы бота необходимо:\n" +
            "1. Удалить бота из канала\n" +
            "2. Добавить его снова с правами администратора\n\n" +
            "Или вручную назначьте его администратором в настройках канала."
        );
      } catch (error) {
        logger.warn(`Could not send admin request message:`, error);
      }
    }
  });

  bot.on("message:text", async (ctx: Context) => {
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
