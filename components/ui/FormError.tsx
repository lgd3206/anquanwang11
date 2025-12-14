/**
 * FormError 表单错误提示组件
 * 用于显示表单验证错误，提供清晰的视觉反馈
 */

import React from 'react';

interface FormErrorProps {
  message?: string;
  className?: string;
}

export default function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm ${className}`}
      role="alert"
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
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
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
 * 1. 表单整体错误：
 * <FormError message={error} />
 *
 * 2. 字段级错误：
 * <input type="email" />
 * <FormError message={emailError} />
 *
 * 3. 多个错误：
 * {errors.map((error, index) => (
 *   <FormError key={index} message={error} />
 * ))}
 */
