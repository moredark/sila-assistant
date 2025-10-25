export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}
