import dotenv from "dotenv";

dotenv.config();

export interface Config {
  telegram: {
    botToken: string;
  };
  cloudru: {
    apiKey: string;
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
  server: {
    port: parseInt(getEnvWithDefault("PORT", "3000"), 10),
    host: getEnvWithDefault("HOST", "localhost"),
  },
  logging: {
    level: getEnvWithDefault("LOG_LEVEL", "info"),
  },
};

export default config;
