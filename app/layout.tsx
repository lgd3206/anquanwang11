import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "@/lib/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "HSE Share - 安全资源分享网",
  description: "专业的安全资源分享平台，汇聚海量优质 HSE 资源",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },


  verification: {
    google: "f9FYb8VhqPzhSraCXIllZf0E5nYGlfe2r2xMes11DVQ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Baidu Search Console Verification */}
        <meta name="baidu-site-verification" content="codeva-FQ3bvSq1cS" />

        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-L26QL4QWD1"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-L26QL4QWD1');
            `,
          }}
        />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
