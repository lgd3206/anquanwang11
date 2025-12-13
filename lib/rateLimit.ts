/**
 * 速率限制器 - 支持Redis持久化
 * 优先使用Redis（通过Upstash），如果不可用则降级到内存实现
 */

import { Redis } from "@upstash/redis";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// 内存存储备用方案
const rateLimitStore = new Map<string, RateLimitRecord>();

// 初始化Redis客户端（可选）
let redis: Redis | null = null;

// 尝试初始化Redis连接
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.warn("Redis initialization failed, falling back to in-memory storage:", error);
    redis = null;
  }
}

// 清理过期内存记录的定时器
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 窗口内最大请求数
}

// 预定义的限制配置
export const RATE_LIMITS = {
  // 登录：每分钟最多5次
  login: { windowMs: 60000, maxRequests: 5 },
  // 注册：每小时最多3次
  register: { windowMs: 3600000, maxRequests: 3 },
  // API通用：每分钟100次
  api: { windowMs: 60000, maxRequests: 100 },
  // 下载：每分钟20次
  download: { windowMs: 60000, maxRequests: 20 },
  // 支付：每分钟10次
  payment: { windowMs: 60000, maxRequests: 10 },
} as const;

/**
 * 检查是否超过限额（支持Redis）
 */
export async function checkRateLimitAsync(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const config = RATE_LIMITS[limitType];
  const key = `rate-limit:${limitType}:${identifier}`;
  const now = Date.now();
  const resetTime = now + config.windowMs;

  try {
    // 优先使用Redis
    if (redis) {
      // 获取当前计数
      const countStr = await redis.get(key);
      const count = countStr ? parseInt(countStr as string) : 0;

      // 获取过期时间
      const ttl = await redis.ttl(key);

      if (ttl === -1) {
        // key存在但无过期时间，设置过期时间
        await redis.expire(key, Math.ceil(config.windowMs / 1000));
      } else if (ttl === -2 || ttl === null) {
        // key不存在，创建新的
        await redis.setex(key, Math.ceil(config.windowMs / 1000), "1");
        return { allowed: true };
      }

      if (count >= config.maxRequests) {
        const ttlSeconds = await redis.ttl(key);
        return { allowed: false, retryAfter: ttlSeconds || Math.ceil(config.windowMs / 1000) };
      }

      // 增加计数
      await redis.incr(key);
      return { allowed: true };
    }
  } catch (error) {
    console.error("Redis rate limit check failed, falling back to memory:", error);
    // 降级到内存实现
  }

  // 内存实现备用方案
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    // 新记录或已过期
    rateLimitStore.set(key, {
      count: 1,
      resetTime: resetTime,
    });
    return { allowed: true };
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

/**
 * 同步版本 - 仅使用内存存储（为了向后兼容）
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[limitType];
  const key = `${limitType}:${identifier}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    // 新记录或已过期
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true };
  }

  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// 获取客户端IP
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

/**
 * 中间件风格的速率限制检查 - 异步版本（推荐）
 */
export async function withRateLimitAsync(
  request: Request,
  limitType: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; response?: Response }> {
  const ip = getClientIp(request);
  const result = await checkRateLimitAsync(ip, limitType);

  if (!result.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          message: "请求过于频繁，请稍后再试",
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfter || 60),
          },
        }
      ),
    };
  }

  return { allowed: true };
}

/**
 * 中间件风格的速率限制检查 - 同步版本（向后兼容）
 */
export function withRateLimit(
  request: Request,
  limitType: keyof typeof RATE_LIMITS
): { allowed: boolean; response?: Response } {
  const ip = getClientIp(request);
  const result = checkRateLimit(ip, limitType);

  if (!result.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          message: "请求过于频繁，请稍后再试",
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfter || 60),
          },
        }
      ),
    };
  }

  return { allowed: true };
}
