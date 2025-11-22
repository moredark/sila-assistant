import dotenv from "dotenv";

dotenv.config();

export interface Config {
  telegram: {
    botToken: string;
  };
  cloudru: {
    apiKey: string;
  };
  obsidian: {
    vaultPath: string;
    dailyNotesFolder: string;
  };
  git: {
    repoUrl: string;
    branch: string;
    authorName: string;
    authorEmail: string;
  };
  server: {
    port: number;
    host: string;
  };
  logging: {
    level: string;
  };
}

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

const getEnvWithDefault = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

export const config: Config = {
  telegram: {
    botToken: getRequiredEnv("TELEGRAM_BOT_TOKEN"),
  },
  cloudru: {
    apiKey: getRequiredEnv("API_KEY"),
  },
  obsidian: {
    vaultPath: getRequiredEnv("OBSIDIAN_VAULT_PATH"),
    dailyNotesFolder: getEnvWithDefault(
      "OBSIDIAN_DAILY_NOTES_FOLDER",
      "daily-notes"
    ),
  },
  git: {
    repoUrl: getRequiredEnv("GIT_REPO_URL"),
    branch: getEnvWithDefault("GIT_BRANCH", "main"),
    authorName: getEnvWithDefault("GIT_AUTHOR_NAME", "Telegram Bot"),
    authorEmail: getEnvWithDefault("GIT_AUTHOR_EMAIL", "bot@example.com"),
  },
  server: {
    port: parseInt(getEnvWithDefault("PORT", "3000"), 10),
    host: getEnvWithDefault("HOST", "localhost"),
  },
  logging: {
    level: getEnvWithDefault("LOG_LEVEL", "info"),
  },
};

export default config;
