import { createClient, type RedisClientType } from 'redis';
import { REDIS_URL } from '$env/static/private';

// Redis client singleton
let redisClient: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClientType> | null = null;

/**
 * Get or create a Redis client connection
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  // If we already have a connected client, return it
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // If we're already connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // If no REDIS_URL, return null (caching disabled)
  if (!REDIS_URL) {
    console.warn('⚠️ REDIS_URL not set - caching disabled');
    return null;
  }

  isConnecting = true;

  connectionPromise = (async () => {
    try {
      redisClient = createClient({
        url: REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.error('❌ Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('🔌 Redis: Connecting...');
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis: Connected and ready');
      });

      await redisClient.connect();
      return redisClient;
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      redisClient = null;
      return null;
    } finally {
      isConnecting = false;
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STORIES_ALL: 3600,      // 1 hour - all stories list
  STORIES_DIALECT: 3600,  // 1 hour - stories by dialect
  STORY_SINGLE: 7200,     // 2 hours - individual story
  LESSONS_ALL: 3600,      // 1 hour - all lessons list
  LESSONS_DIALECT: 3600,  // 1 hour - lessons by dialect
  LESSON_SINGLE: 7200,    // 2 hours - individual lesson
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  STORIES_ALL: 'stories:all',
  STORIES_DIALECT: (dialect: string) => `stories:dialect:${dialect}`,
  STORY_SINGLE: (id: string) => `stories:id:${id}`,
  LESSONS_ALL: 'lessons:all',
  LESSONS_DIALECT: (dialect: string) => `lessons:dialect:${dialect}`,
  LESSON_SINGLE: (id: string) => `lessons:id:${id}`,
} as const;

/**
 * Get cached data from Redis
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const cached = await client.get(key);
    if (cached) {
      console.log(`🎯 Cache HIT: ${key}`);
      return JSON.parse(cached) as T;
    }
    console.log(`💨 Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error(`❌ Redis GET error for ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data in Redis with TTL
 */
export async function setCached<T>(key: string, data: T, ttlSeconds: number): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.setEx(key, ttlSeconds, JSON.stringify(data));
    console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    return true;
  } catch (error) {
    console.error(`❌ Redis SET error for ${key}:`, error);
    return false;
  }
}

/**
 * Delete a cached key
 */
export async function deleteCached(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    await client.del(key);
    console.log(`🗑️ Cache DELETE: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Redis DEL error for ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple cached keys by pattern
 */
export async function deleteCachedByPattern(pattern: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️ Cache DELETE pattern: ${pattern} (${keys.length} keys)`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Redis DEL pattern error for ${pattern}:`, error);
    return false;
  }
}

/**
 * Invalidate all story caches (call when a story is created/updated/deleted)
 */
export async function invalidateStoryCaches(storyId?: string, dialect?: string): Promise<void> {
  // Always invalidate the "all stories" cache
  await deleteCached(CACHE_KEYS.STORIES_ALL);
  
  // If dialect provided, invalidate dialect-specific cache
  if (dialect) {
    await deleteCached(CACHE_KEYS.STORIES_DIALECT(dialect));
  } else {
    // Invalidate all dialect caches
    await deleteCachedByPattern('stories:dialect:*');
  }
  
  // If storyId provided, invalidate the specific story cache
  if (storyId) {
    await deleteCached(CACHE_KEYS.STORY_SINGLE(storyId));
  }
}

/**
 * Invalidate all lesson caches (call when a lesson is created/updated/deleted)
 */
export async function invalidateLessonCaches(lessonId?: string, dialect?: string): Promise<void> {
  // Always invalidate the "all lessons" cache
  await deleteCached(CACHE_KEYS.LESSONS_ALL);
  
  // If dialect provided, invalidate dialect-specific cache
  if (dialect) {
    await deleteCached(CACHE_KEYS.LESSONS_DIALECT(dialect));
  } else {
    // Invalidate all dialect caches
    await deleteCachedByPattern('lessons:dialect:*');
  }
  
  // If lessonId provided, invalidate the specific lesson cache
  if (lessonId) {
    await deleteCached(CACHE_KEYS.LESSON_SINGLE(lessonId));
  }
}

