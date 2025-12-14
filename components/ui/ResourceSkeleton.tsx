/**
 * ResourceSkeleton 骨架屏组件
 * 用于在资源列表加载时显示占位符，改善用户体验
 */

import React from 'react';

interface ResourceSkeletonProps {
  count?: number;
}

export default function ResourceSkeleton({ count = 5 }: ResourceSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse"
          role="status"
          aria-label="资源加载中"
        >
          {/* 标题骨架 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 w-20 bg-gray-300 rounded ml-4"></div>
          </div>

          {/* 描述骨架 */}
          <div className="mb-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>

          {/* 标签和按钮骨架 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
            </div>
            <div className="h-10 w-24 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * 使用示例：
 *
 * {loading ? (
 *   <ResourceSkeleton count={5} />
 * ) : (
 *   resources.map(resource => <ResourceCard key={resource.id} {...resource} />)
 * )}
 */
