import Redis from 'ioredis';
import { config } from './index';
import logger from '../utils/logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }
  return redisClient;
};

export const cacheData = async (key: string, data: any, ttl: number = 300): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    logger.error('Redis cache set error:', error);
  }
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis cache get error:', error);
    return null;
  }
};

export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    logger.error('Redis cache invalidate error:', error);
  }
};
