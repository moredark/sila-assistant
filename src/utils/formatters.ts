import { SECTION_HEADERS } from "../constants/emojis";
import { DAY_NAMES } from "../constants/dates";
import { HEADER_EMOJIS } from "../constants/emojis";

export function formatDateHeader(date: Date): string {
  const dateStr = date.toISOString().split("T")[0];
  return formatPostHeader(dateStr);
}

function getRandomEmoji(): string {
  return HEADER_EMOJIS[Math.floor(Math.random() * HEADER_EMOJIS.length)];
}

export function formatPostHeader(date: string): string {
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}.${month}.${year}`;
  const dateObj = new Date(`${year}-${month}-${day}`);
  const dayOfWeek = DAY_NAMES[dateObj.getDay()];
  const randomEmoji = getRandomEmoji();

  return `${randomEmoji} | ${formattedDate} | ${dayOfWeek}`;
}

export function cleanContentLine(line: string): string {
  // Remove common task markers and emojis
  let cleaned = line
    .replace(/^[-*+]\s*/, "") // Remove bullet points
    .replace(/^\[[ x]\]\s*/, "") // Remove checkbox markers
    .replace(/^\d+\.\s*/, "") // Remove numbered list markers
    .replace(/^[📝✅🔔💡]\s*/, "") // Remove common emojis
    .replace(/^-\s*/, "") // Remove dash
    .replace(/^•\s*/, "") // Remove bullet
    .trim();

  // Remove duplicate markers at the beginning
  cleaned = cleaned.replace(/^[-*+\d\.\[\]📝✅🔔💡•]+\s*/, "");

  return cleaned;
}

export function isDateHeaderLine(line: string): boolean {
  return /\d{2}\.\d{2}\.\d{4}/.test(line);
}

export function formatSectionContent(
  content: string[],
  sectionHeader: string
): string[] {
  const sections: string[] = [];

  if (content.length > 0) {
    sections.push("");
    sections.push(sectionHeader);
    content.forEach((item) => {
      sections.push(` • ${item}`);
    });
  }

  return sections;
}

export function buildPostContent(
  notes: string[],
  tasks: string[],
  ideas: string[],
  date: string
): string {
  const sections: string[] = [formatPostHeader(date)];

  sections.push(...formatSectionContent(tasks, SECTION_HEADERS.tasks));
  sections.push(...formatSectionContent(notes, SECTION_HEADERS.notes));
  sections.push(...formatSectionContent(ideas, SECTION_HEADERS.ideas));

  return sections.join("\n");
}
