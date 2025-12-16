"use client";

import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface AppLayoutProps {
  children: ReactNode;
  showSearch?: boolean; // 是否在Header显示搜索框（仅首页）
}

export default function AppLayout({ children, showSearch = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showSearch={showSearch} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
