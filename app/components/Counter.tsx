"use client";

import { useState, useEffect } from "react";

interface CounterProps {
  target: number;
  label: string;
  icon: string;
}

export function Counter({ target, label, icon }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 动画持续时间（毫秒）
    const duration = 2000;
    // 计数步长
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = Math.ceil(target / steps);

    let currentCount = 0;
    const interval = setInterval(() => {
      currentCount += increment;
      if (currentCount >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(currentCount);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [target]);

  // 格式化数字（添加千分位）
  const formattedCount = count.toLocaleString("zh-CN");

  return (
    <div className="text-center">
      <div className="text-5xl md:text-6xl font-bold mb-3">
        <span className="text-blue-600">{formattedCount}</span>
        <span className="text-3xl md:text-4xl text-gray-500">+</span>
      </div>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-gray-600 text-lg">{label}</p>
    </div>
  );
}
