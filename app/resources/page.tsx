"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import ResourceSkeleton from "@/components/ui/ResourceSkeleton";

interface Category {
  id: number;
  name: string;
  pointsCost: number;
}

interface Resource {
  id: number;
  title: string;
  category: Category;
  description: string;
  pointsCost: number;
  downloads: number;
  isNew: boolean;
  createdAt: string;
}

function ResourcesContent() {
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [showFreeOnly, setShowFreeOnly] = useState(false); // 新增：免积分筛选
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append("category", selectedCategory);
        if (searchQuery) params.append("search", searchQuery);
        if (showFreeOnly) params.append("freeOnly", "true"); // 新增：免积分筛选
        params.append("page", page.toString());

        const response = await fetch(`/api/resources?${params}`);
        const data = await response.json();
        setResources(data.resources);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [selectedCategory, searchQuery, showFreeOnly, page]); // 添加showFreeOnly依赖

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const isNewResource = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            安全资源分享网
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              首页
            </Link>
            <Link href="/resources" className="text-blue-600 font-medium">
              资源库
            </Link>
            <Link href="/login" className="btn-primary">
              登录
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="搜索资源..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="btn-primary"
              >
                搜索
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("");
                  setShowFreeOnly(false);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === "" && !showFreeOnly
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                全部分类
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("");
                  setShowFreeOnly(true);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFreeOnly
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                🎁 免积分资源
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setShowFreeOnly(false);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ResourceSkeleton count={6} />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无资源</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {resources.map((resource) => (
                <div key={resource.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 flex-1">
                      {resource.title}
                    </h3>
                    {isNewResource(resource.createdAt) && (
                      <span className="badge-new ml-2">新</span>
                    )}
                  </div>

                  <div className="mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                      {resource.category.name}
                    </span>
                  </div>

                  {resource.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>💾 {resource.downloads} 次下载</span>
                    <span className="font-bold text-blue-600">
                      {resource.pointsCost} 点
                    </span>
                  </div>

                  <Link
                    href={`/resources/${resource.id}`}
                    className="w-full btn-primary text-center block"
                  >
                    查看详情
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 md:gap-2 mb-8 overflow-x-auto px-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 whitespace-nowrap text-sm md:text-base flex-shrink-0"
                >
                  上一页
                </button>

                {/* 第一页 */}
                {page > 3 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="px-3 md:px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-100 text-sm md:text-base flex-shrink-0"
                    >
                      1
                    </button>
                    {page > 4 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </>
                )}

                {/* 当前页附近的页码 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // 移动端：显示当前页和前后各1页
                    // 桌面端：显示当前页和前后各2页
                    const range = window.innerWidth < 768 ? 1 : 2;
                    return p >= page - range && p <= page + range;
                  })
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base flex-shrink-0 ${
                        page === p
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                {/* 最后一页 */}
                {page < totalPages - 2 && (
                  <>
                    {page < totalPages - 3 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="px-3 md:px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-100 text-sm md:text-base flex-shrink-0"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 whitespace-nowrap text-sm md:text-base flex-shrink-0"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-16">
        <div className="container text-center">
          <p>&copy; 2025 安全资源分享网. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResourcesContent />
    </Suspense>
  );
}
