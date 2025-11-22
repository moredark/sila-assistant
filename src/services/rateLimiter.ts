import logger from "../utils/logger";

interface RateLimitInfo {
  count: number;
  startTime: number;
}

export class RateLimiter {
  private users = new Map<string, RateLimitInfo>();
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  public check(userId: string): boolean {
    const now = Date.now();
    const userInfo = this.users.get(userId);

    if (!userInfo || now - userInfo.startTime > this.windowMs) {
      this.users.set(userId, { count: 1, startTime: now });
      logger.info(`Rate limit start for user ${userId}`);
      return true;
    }

    if (userInfo.count < this.limit) {
      userInfo.count++;
      this.users.set(userId, userInfo);
      logger.info(
        `Rate limit check for user ${userId}: count ${userInfo.count}`
      );
      return true;
    }

    logger.warn(`Rate limit exceeded for user ${userId}`);
    return false;
  }
}

const RATE_LIMIT_COUNT = 10; // Max 10 requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per 1 minute (60 seconds)

export const voiceMessageRateLimiter = new RateLimiter(
  RATE_LIMIT_COUNT,
  RATE_LIMIT_WINDOW_MS
);
