/**
 * 简单的内存速率限制器
 * 生产环境建议使用 Redis 实现
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// 清理过期记录的定时器
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

export function checkRateLimit(
  identifier: string, // IP或用户ID
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

// 中间件风格的速率限制检查
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
