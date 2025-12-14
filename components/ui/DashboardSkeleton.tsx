/**
 * DashboardSkeleton 用户中心骨架屏组件
 * 用于Dashboard页面数据加载时显示占位符
 */

import React from 'react';

interface DashboardSkeletonProps {
  type?: 'profile' | 'table';
}

export default function DashboardSkeleton({ type = 'profile' }: DashboardSkeletonProps) {
  if (type === 'profile') {
    // 用户信息卡片骨架
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
        {/* 标题骨架 */}
        <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>

        {/* 用户信息骨架 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-300 rounded w-48"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-5 bg-blue-300 rounded w-20"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-300 rounded w-40"></div>
          </div>
        </div>

        {/* 操作按钮骨架 */}
        <div className="flex gap-3 mt-6">
          <div className="h-10 bg-gray-300 rounded w-24"></div>
          <div className="h-10 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    );
  }

  // 表格骨架
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 w-16 bg-blue-300 rounded"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 使用示例：
 *
 * 1. 用户信息加载：
 * {loading ? (
 *   <DashboardSkeleton type="profile" />
 * ) : (
 *   <UserProfileCard user={user} />
 * )}
 *
 * 2. 表格数据加载：
 * {downloadsLoading ? (
 *   <DashboardSkeleton type="table" />
 * ) : (
 *   <DownloadsList downloads={downloads} />
 * )}
 */
