import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 安全HTTP头配置
  const securityHeaders = {
    // 防止点击劫持
    "X-Frame-Options": "DENY",
    // XSS保护
    "X-XSS-Protection": "1; mode=block",
    // 防止MIME类型嗅探
    "X-Content-Type-Options": "nosniff",
    // 引用者策略
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // 权限策略
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    // 内容安全策略
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com",
      "script-src-elem 'self' 'unsafe-inline' https://js.hcaptcha.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://newsassets.hcaptcha.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://newsassets.hcaptcha.com",
      "connect-src 'self' https://api.pingxx.com https://hcaptcha.com https://newsassets.hcaptcha.com https://sentry.hcaptcha.com https://www.googletagmanager.com https://www.google-analytics.com",
      "frame-src https://hcaptcha.com https://newsassets.hcaptcha.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
    // HTTPS严格传输安全（生产环境）
    ...(process.env.NODE_ENV === "production" && {
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    }),
  };

  // 设置安全头
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  // API路由的额外安全措施
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // 禁用缓存敏感API响应
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    // 匹配所有路径，但排除静态文件
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
