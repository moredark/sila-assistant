import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { config } from "../config";
import logger from "../utils/logger";
import { PRIORITY_EMOJIS } from "../constants/emojis";

const chatModel = new ChatOpenAI({
  openAIApiKey: config.cloudru.apiKey,
  modelName: "GigaChat/GigaChat-2-Max",
  temperature: 0.5,
  maxTokens: 2500,
  presencePenalty: 0,
  topP: 0.95,
  configuration: {
    baseURL: "https://foundation-models.api.cloud.ru/v1",
  },
});

export interface TaskAnalysis {
  isTask: boolean;
  action: "add" | "edit" | "delete" | "complete" | "note" | "idea";
  content: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
  confidence: number;
}

export class AIService {
  /**
   * Analyze transcribed text to determine if it's a task and extract relevant information
   */
  async analyzeText(text: string): Promise<TaskAnalysis> {
    try {
      logger.info(`Analyzing text: "${text.substring(0, 100)}..."`);

      const systemPrompt = `Вы - ИИ-ассистент, который анализирует голосовые транскрипции и извлекает задачи, заметки и идеи.

Ваша задача:
1. Определить, представляет ли текст задачу, заметку или идею
2. Определить действие (добавить, редактировать, удалить, выполнить)
3. Извлечь основное содержание
4. Назначить приоритет, если упомянут
5. Извлечь любые теги или категории

Отвечайте в формате JSON:
{
  "isTask": boolean,
  "action": "add" | "edit" | "delete" | "complete" | "note" | "idea",
  "content": "очищенное содержание текста",
  "priority": "low" | "medium" | "high" | null,
  "tags": ["тег1", "тег2"] | [],
  "confidence": 0.0-1.0
}

Примеры:
- "Добавить уборку в мой список дел" → {"isTask": true, "action": "add", "content": "Сделать уборку", "priority": null, "tags": [], "confidence": 0.9}
- "Не забыть купить молоко" → {"isTask": true, "action": "add", "content": "Купить молоко", "priority": null, "tags": ["покупки"], "confidence": 0.8}
- "Позвонить маме завтра" → {"isTask": true, "action": "add", "content": "Позвонить маме завтра", "priority": "medium", "tags": ["семья"], "confidence": 0.9}
- "Заметка: встреча в 3 часа" → {"isTask": false, "action": "note", "content": "Встреча в 3 часа", "priority": null, "tags": [], "confidence": 0.8}
- "У меня есть идея для проекта" → {"isTask": false, "action": "idea", "content": "У меня есть идея для проекта", "priority": null, "tags": [], "confidence": 0.7}`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(text),
      ];

      const response = await chatModel.call(messages);
      const responseText = response.content as string;

      // Parse JSON response
      const analysis = JSON.parse(responseText) as TaskAnalysis;

      // Validate and sanitize the response
      const sanitizedAnalysis: TaskAnalysis = {
        isTask: Boolean(analysis.isTask),
        action: analysis.action || "add",
        content: this.cleanContent(analysis.content || text),
        priority: analysis.priority || undefined,
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
        confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
      };

      logger.info(`Analysis result:`, sanitizedAnalysis);
      return sanitizedAnalysis;
    } catch (error) {
      logger.error("Error analyzing text:", error);

      // Fallback analysis
      return {
        isTask: this.isLikelyTask(text),
        action: "add",
        content: this.cleanContent(text),
        confidence: 0.5,
      };
    }
  }

  /**
   * Simple heuristic to determine if text is likely a task
   */
  private isLikelyTask(text: string): boolean {
    const taskIndicators = [
      "добавить",
      "сделать",
      "создать",
      "позвонить",
      "купить",
      "отправить",
      "написать",
      "закончить",
      "завершить",
      "начать",
      "запомнить",
      "не забыть",
      "нужно",
      "должен",
      "следует",
      "должен",
      "задача",
      "сделка",
      "todo",
      "task",
      "add",
      "do",
      "make",
      "call",
      "buy",
      "send",
      "write",
      "finish",
      "complete",
      "start",
      "remember",
      "don't forget",
      "need to",
      "have to",
      "should",
      "must",
    ];

    const lowerText = text.toLowerCase();
    return taskIndicators.some((indicator) => lowerText.includes(indicator));
  }

  /**
   * Clean and format the content
   */
  private cleanContent(content: string): string {
    // Remove common filler words and phrases
    const fillerWords = [
      "um",
      "uh",
      "like",
      "you know",
      "I mean",
      "actually",
      "basically",
      "literally",
      "so",
      "well",
      "anyway",
      "ээ",
      "мм",
      "как бы",
      "знаешь",
      "то есть",
      "на самом деле",
      "в общем",
      "буквально",
      "короче",
      "в общем-то",
      "так сказать",
    ];

    let cleaned = content.trim();

    // Remove filler words (case insensitive)
    fillerWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      cleaned = cleaned.replace(regex, "");
    });

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  /**
   * Format task as Markdown
   */
  formatTaskAsMarkdown(analysis: TaskAnalysis): string {
    let markdown = "";

    if (analysis.isTask) {
      // Task format
      let taskLine = `${analysis.content}`;

      if (analysis.priority) {
        taskLine = `${PRIORITY_EMOJIS[analysis.priority]} ${taskLine}`;
      }

      // Add tags
      if (analysis.tags && analysis.tags.length > 0) {
        taskLine += ` #${analysis.tags.join(" #")}`;
      }

      markdown = taskLine;
    } else if (analysis.action === "note") {
      markdown = `${analysis.content}`;
    } else if (analysis.action === "idea") {
      markdown = `${analysis.content}`;
    } else {
      markdown = `${analysis.content}`;
    }

    return markdown;
  }
}

// Export singleton instance
export const aiService = new AIService();
