import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "安全资源分享网",
  description: "专业的安全资源分享平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
