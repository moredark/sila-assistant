import { Context } from "grammy";
import { config } from "../config";

export async function downloadVoiceFile(ctx: Context): Promise<Buffer> {
  const voiceFile = await ctx.getFile();
  const fileUrl = await ctx.api.getFile(voiceFile.file_id);
  const response = await fetch(
    `https://api.telegram.org/file/bot${config.telegram.botToken}/${fileUrl.file_path}`
  );
  return Buffer.from(await response.arrayBuffer());
}

export function getContentTypeFromAction(
  action: string
): "task" | "note" | "idea" {
  switch (action) {
    case "note":
      return "note";
    case "idea":
      return "idea";
    default:
      return "task";
  }
}

export function formatSuccessMessage(
  contentType: "task" | "note" | "idea",
  markdownTask: string,
  confidence: number
): string {
  const contentTypeNames = {
    task: "Задача",
    note: "Заметка",
    idea: "Идея",
  };

  const contentTypeText = contentTypeNames[contentType];
  return (
    `✅ ${contentTypeText} добавлена в канал!\n\n` +
    `📝 Содержимое: ${markdownTask}\n` +
    `🎯 Уверенность: ${Math.round(confidence * 100)}%`
  );
}

export function formatErrorMessage(error: unknown): string {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";
  return (
    `❌ Извините, произошла ошибка при обработке вашего голосового сообщения.\n\n` +
    `Ошибка: ${errorMessage}\n\n` +
    `Пожалуйста, попробуйте еще раз или обратитесь в поддержку, если проблема продолжается.`
  );
}
