export interface ChannelPostResult {
  messageId: number;
  date: string;
  content: string;
}

export type ContentType = "task" | "note" | "idea";
export type SectionType = "notes" | "tasks" | "ideas";

export interface ChannelContent {
  notes: string[];
  tasks: string[];
  ideas: string[];
}
