import Redis from "ioredis";
import { config } from "../config";

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

export async function connectRedisSafe(): Promise<void> {
  try {
    if (redis.status === "end" || redis.status === "wait") {
      await redis.connect();
    }
  } catch {
    // Redis is optional for local development.
  }
}
