import { HTTP_STATUS } from "../constants/api";

export class TranscriptionError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "TranscriptionError";
  }
}

export function handleTranscriptionError(
  error: any,
  statusCode?: number
): TranscriptionError {
  if (error instanceof TranscriptionError) {
    return error;
  }

  if (statusCode) {
    switch (statusCode) {
      case HTTP_STATUS.UNAUTHORIZED:
        return new TranscriptionError(
          "Invalid API key. Please check your Cloud.ru configuration.",
          statusCode
        );
      case HTTP_STATUS.RATE_LIMIT:
        return new TranscriptionError(
          "API rate limit exceeded. Please try again later.",
          statusCode
        );
      case HTTP_STATUS.BAD_REQUEST:
        return new TranscriptionError(
          "Invalid request or audio format not supported.",
          statusCode
        );
      case HTTP_STATUS.NOT_FOUND:
        return new TranscriptionError(
          "API endpoint not found. Please check the API configuration.",
          statusCode
        );
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("Invalid API key")) {
      return new TranscriptionError(
        "Invalid Cloud.ru API key. Please check your configuration."
      );
    }
    if (error.message.includes("rate limit")) {
      return new TranscriptionError(
        "Cloud.ru API rate limit exceeded. Please try again later."
      );
    }
    if (error.message.includes("audio format not supported")) {
      return new TranscriptionError(
        "Audio format not supported. Please send a valid voice message."
      );
    }
  }

  return new TranscriptionError(
    "Failed to transcribe audio. Please try again."
  );
}

export function validateTranscriptionResponse(result: any): string {
  if (!result.text) {
    throw new TranscriptionError("No transcription text received from API");
  }
  return result.text.trim();
}
