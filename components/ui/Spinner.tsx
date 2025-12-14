/**
 * Spinner 加载动画组件
 * 用于替代纯文本的"加载中..."提示，提供更好的视觉反馈
 */

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-blue-600 border-t-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="加载中"
    >
      <span className="sr-only">加载中...</span>
    </div>
  );
}

/**
 * 使用示例：
 *
 * 1. 按钮加载状态：
 * <button disabled={loading}>
 *   {loading ? (
 *     <><Spinner size="sm" /> 加载中...</>
 *   ) : (
 *     "提交"
 *   )}
 * </button>
 *
 * 2. 页面加载状态：
 * {loading && (
 *   <div className="flex justify-center items-center py-8">
 *     <Spinner size="lg" />
 *   </div>
 * )}
 */
