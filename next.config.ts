import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          // 防止点击劫持
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // XSS保护
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // 防止MIME类型嗅探
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // 引用者策略
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 权限策略
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // 内容安全策略 - 白名单配置（允许第三方库的inline脚本）
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // script-src: 允许自身脚本 + hCaptcha + Google Analytics inline脚本
              "script-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com https://www.google-analytics.com https://www.googletagmanager.com",
              // script-src-elem: 保留unsafe-inline用于外部脚本加载
              "script-src-elem 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com https://www.google-analytics.com https://www.googletagmanager.com",
              // style-src: 允许inline样式（Next.js CSS需要）和第三方库
              "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com",
              // img-src: 允许图片从网盘加载
              "img-src 'self' data: https: https://www.google-analytics.com https://www.googletagmanager.com",
              // media-src: 允许视频和音频从网盘加载（支持百度网盘、夸克网盘等）
              "media-src 'self' https://pan.baidu.com https://d.pcs.baidu.com https://pan.quark.cn https://api.quark.cn https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://www.google-analytics.com https://www.googletagmanager.com https://ping.alipay.com",
              // frame-src: 允许iframe从网盘加载（虽然网盘通常禁止iframe，但保留以备不时之需）
              "frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://pan.baidu.com https://pan.quark.cn",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // HTTPS严格传输安全（生产环境）
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      // API路由的额外安全措施
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
