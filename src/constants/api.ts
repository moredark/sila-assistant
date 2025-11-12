export const CLOUDRU_API = {
  BASE_URL: "https://foundation-models.api.cloud.ru",
  ENDPOINTS: {
    TRANSCRIPTION: "/v1/audio/transcriptions",
    ALTERNATIVE_TRANSCRIPTION: [
      "/v1/audio/transcribe",
      "https://api.cloud.ru/v1/audio/transcriptions",
      "https://cloud.ru/api/v1/audio/transcriptions",
    ],
  },
  MODEL: "openai/whisper-large-v3",
  DEFAULT_LANGUAGE: "ru",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  RATE_LIMIT: 429,
  BAD_REQUEST: 400,
} as const;

export const TRANSCRIPTION_CONFIG = {
  RESPONSE_FORMAT: "json",
  TEMPERATURE: 0.5,
  MAX_LOG_LENGTH: 50,
} as const;
