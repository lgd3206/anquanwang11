"use client";

import React from "react";

interface SearchHighlightProps {
  text: string;
  searchQuery?: string;
  className?: string;
}

export default function SearchHighlight({
  text,
  searchQuery,
  className = "",
}: SearchHighlightProps) {
  if (!searchQuery || !text) {
    return <span className={className}>{text}</span>;
  }

  // 将搜索查询分割为多个关键词（空格分隔）
  const keywords = searchQuery
    .split(/\s+/)
    .filter((k) => k.length > 0)
    .map((k) => k.toLowerCase());

  if (keywords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // 构建正则表达式以匹配所有关键词（忽略大小写）
  // 转义特殊字符防止正则表达式错误
  const escapedKeywords = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const regex = new RegExp(`(${escapedKeywords.join("|")})`, "gi");

  // 分割文本并高亮匹配部分
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isHighlighted = regex.test(part);
        // 重置regex.lastIndex因为split会改变它
        regex.lastIndex = 0;

        // 检查这部分是否应该被高亮
        const shouldHighlight = keywords.some(
          (keyword) => part.toLowerCase() === keyword
        );

        if (shouldHighlight) {
          return (
            <mark
              key={index}
              className="bg-yellow-200 text-gray-900 px-0.5 rounded font-semibold"
            >
              {part}
            </mark>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
