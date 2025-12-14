/**
 * FormSuccess 表单成功提示组件
 * 用于显示操作成功消息，提供积极的视觉反馈
 */

import React from 'react';

interface FormSuccessProps {
  message?: string;
  className?: string;
}

export default function FormSuccess({ message, className = '' }: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/**
 * 使用示例：
 *
 * 1. 表单提交成功：
 * <FormSuccess message="注册成功！请检查邮箱验证" />
 *
 * 2. 保存成功：
 * <FormSuccess message="设置已保存" />
 *
 * 3. 条件显示：
 * {success && <FormSuccess message={success} />}
 */
