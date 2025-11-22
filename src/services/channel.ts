import { Bot } from "grammy";
import { promises as fs } from "fs";
import { join } from "path";
import logger from "../utils/logger";
import {
  cleanContentLine,
  isDateHeaderLine,
  buildPostContent,
} from "../utils/formatters";
import { SECTION_HEADERS } from "../constants/emojis";
import {
  ChannelPostResult,
  ChannelContent,
  ContentType,
  SectionType,
} from "../types/channel";
import { getTodayDateString } from "../utils/date";

export class ChannelService {
  private bot: Bot;
  private channelId: string;
  private storageFile: string;

  constructor(bot: Bot, privateChannelId: string) {
    this.bot = bot;
    this.channelId = privateChannelId;
    this.storageFile = join(process.cwd(), "data", "channel-posts.json");
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.access(join(process.cwd(), "data"));
    } catch {
      await fs.mkdir(join(process.cwd(), "data"), { recursive: true });
    }
  }

  private async loadLastPost(): Promise<{
    date: string;
    messageId: number;
  } | null> {
    try {
      const data = await fs.readFile(this.storageFile, "utf-8");
      const posts = JSON.parse(data);
      return posts.lastPost || null;
    } catch (error) {
      logger.info("No existing post data found");
      return null;
    }
  }

  private async saveLastPost(date: string, messageId: number): Promise<void> {
    try {
      let posts: { lastPost: { date: string; messageId: number } | null } = {
        lastPost: null,
      };
      try {
        const data = await fs.readFile(this.storageFile, "utf-8");
        posts = JSON.parse(data);
      } catch (error) {
        // Intentionally ignore if file not found or parsing error, will be handled by outer try-catch
      }

      posts.lastPost = { date, messageId };
      await fs.writeFile(this.storageFile, JSON.stringify(posts, null, 2));
      logger.info(`Saved last post: ${date} -> ${messageId}`);
    } catch (error) {
      logger.error("Error saving last post:", error);
    }
  }

  async getOrCreateDailyPost(date?: Date): Promise<ChannelPostResult> {
    const targetDate = date || new Date();
    const dateStr = date
      ? targetDate.toISOString().split("T")[0]
      : getTodayDateString();

    try {
      const existingPost = await this.findTodayPost(targetDate);

      if (existingPost) {
        logger.info(`Found existing daily post: ${existingPost.messageId}`);
        return existingPost;
      }

      logger.info(`Creating new daily post for ${dateStr}`);
      const newPost = await this.createDailyPost(targetDate);
      return newPost;
    } catch (error) {
      logger.error("Error getting or creating daily post:", error);
      throw error;
    }
  }

  async addContentToDailyPost(
    content: string,
    contentType: ContentType,
    date?: Date
  ): Promise<ChannelPostResult> {
    try {
      const post = await this.getOrCreateDailyPost(date);
      const currentContent = await this.parsePostContent(post.content);

      switch (contentType) {
        case "task":
          currentContent.tasks.push(content);
          break;
        case "note":
          currentContent.notes.push(content);
          break;
        case "idea":
          currentContent.ideas.push(content);
          break;
      }

      const updatedContent = this.formatPostContent(currentContent, post.date);
      await this.bot.api.editMessageText(
        this.channelId,
        post.messageId,
        updatedContent,
        { parse_mode: "HTML" }
      );

      logger.info(`Added ${contentType} to daily post ${post.messageId}`);
      return { ...post, content: updatedContent };
    } catch (error) {
      logger.error("Error adding content to daily post:", error);
      throw error;
    }
  }

  private async findTodayPost(date: Date): Promise<ChannelPostResult | null> {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const lastPost = await this.loadLastPost();

      if (lastPost && lastPost.date === dateStr) {
        try {
          logger.info(
            `Found existing post for today: ${lastPost.messageId}, fetching content...`
          );

          const forwardedMessage = await this.bot.api.forwardMessage(
            this.channelId,
            this.channelId,
            lastPost.messageId
          );

          if (forwardedMessage.text) {
            await this.bot.api.deleteMessage(
              this.channelId,
              forwardedMessage.message_id
            );

            logger.info(
              `Successfully retrieved content for post ${lastPost.messageId}`
            );
            return {
              messageId: lastPost.messageId,
              date: dateStr,
              content: forwardedMessage.text,
            };
          } else {
            logger.warn(`Post ${lastPost.messageId} has no text content`);
            return null;
          }
        } catch (error) {
          logger.warn(
            `Failed to access existing post ${lastPost.messageId}, will create new one:`,
            error
          );
          return null;
        }
      }

      logger.info(`No existing post found for ${dateStr}`);
      return null;
    } catch (error) {
      logger.error("Error finding today's post:", error);
      return null;
    }
  }

  private async createDailyPost(date: Date): Promise<ChannelPostResult> {
    const dateStr = date.toISOString().split("T")[0];
    const content = this.formatPostContent(
      {
        notes: [],
        tasks: [],
        ideas: [],
      },
      dateStr
    );

    const message = await this.bot.api.sendMessage(
      this.channelId,
      content,
      { parse_mode: "HTML" }
    );

    await this.saveLastPost(dateStr, message.message_id);

    logger.info(`Created new daily post: ${message.message_id} for ${dateStr}`);

    return {
      messageId: message.message_id,
      date: dateStr,
      content,
    };
  }

  private parsePostContent(content: string): ChannelContent {
    const result: ChannelContent = {
      notes: [],
      tasks: [],
      ideas: [],
    };

    const lines = content.split("\n");
    let currentSection: SectionType | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.includes(SECTION_HEADERS.notes)) {
        currentSection = "notes";
      } else if (trimmedLine.includes(SECTION_HEADERS.tasks)) {
        currentSection = "tasks";
      } else if (trimmedLine.includes(SECTION_HEADERS.ideas)) {
        currentSection = "ideas";
      } else if (
        currentSection &&
        trimmedLine &&
        !trimmedLine.includes("📝 Заметка за") &&
        !isDateHeaderLine(trimmedLine)
      ) {
        const cleanLine = cleanContentLine(trimmedLine);

        if (cleanLine) {
          result[currentSection].push(cleanLine);
        }
      }
    }

    return result;
  }

  private formatPostContent(content: ChannelContent, date: string): string {
    return buildPostContent(content.notes, content.tasks, content.ideas, date);
  }

  private findTask(
    tasks: string[],
    taskContent: string
  ): { task: string; index: number } | null {
    const lowerTaskContent = taskContent.toLowerCase();
    let bestMatch: { task: string; index: number; score: number } | null = null;

    tasks.forEach((task, index) => {
      const lowerTask = task.toLowerCase();
      if (lowerTask.includes(lowerTaskContent)) {
        const score = lowerTaskContent.length / lowerTask.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { task, index, score };
        }
      }
    });

    if (bestMatch) {
      const foundMatch = bestMatch;
      return {
        task: (foundMatch as { task: string; index: number }).task,
        index: (foundMatch as { task: string; index: number }).index,
      };
    }
    return null;
  }

  async completeTask(
    taskContent: string,
    date?: Date
  ): Promise<{ success: boolean; task?: string }> {
    const post = await this.getOrCreateDailyPost(date);
    if (!post) return { success: false };

    const currentContent = this.parsePostContent(post.content);
    const taskToComplete = this.findTask(currentContent.tasks, taskContent);

    if (taskToComplete) {
            if (taskToComplete.task.startsWith("<s>") && taskToComplete.task.endsWith("</s>")) {
              return { success: false };
            }
            currentContent.tasks[taskToComplete.index] = `<s>${taskToComplete.task}</s>`;
            const updatedContent = this.formatPostContent(currentContent, post.date);
            await this.bot.api.editMessageText(
              this.channelId,
              post.messageId,
              updatedContent,
              { parse_mode: "HTML" }
            );
      logger.info(`Completed task: "${taskToComplete.task}"`);
      return { success: true, task: taskToComplete.task };
    }

    return { success: false };
  }

  async deleteTask(
    taskContent: string,
    date?: Date
  ): Promise<{ success: boolean; task?: string }> {
    const post = await this.getOrCreateDailyPost(date);
    if (!post) return { success: false };

    const currentContent = this.parsePostContent(post.content);
    const taskToDelete = this.findTask(currentContent.tasks, taskContent);

    if (taskToDelete) {
      currentContent.tasks.splice(taskToDelete.index, 1);
      const updatedContent = this.formatPostContent(currentContent, post.date);
      await this.bot.api.editMessageText(
        this.channelId,
        post.messageId,
        updatedContent,
        { parse_mode: "HTML" }
      );
      logger.info(`Deleted task: "${taskToDelete.task}"`);
      return { success: true, task: taskToDelete.task };
    }

    return { success: false };
  }

  async getDailyPost(date?: Date): Promise<ChannelPostResult | null> {
    const targetDate = date || new Date();
    return await this.findTodayPost(targetDate);
  }

  async clearTodayPost(): Promise<boolean> {
    try {
      const dateStr = getTodayDateString();
      const lastPost = await this.loadLastPost();

      if (lastPost && lastPost.date === dateStr) {
        await this.bot.api.deleteMessage(this.channelId, lastPost.messageId);
        await this.saveLastPost("", 0);

        logger.info(`Cleared today's post: ${lastPost.messageId}`);
        return true;
      } else {
        logger.info(`No post found for today: ${dateStr}`);
        return false;
      }
    } catch (error) {
      logger.error("Error clearing today's post:", error);
      throw error;
    }
  }
}

export function createChannelService(
  bot: Bot,
  privateChannelId: string
): ChannelService {
  return new ChannelService(bot, privateChannelId);
}
