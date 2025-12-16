"use client";

import { useState, useEffect, Suspense } from "react";
import Footer from '@/components/Footer';
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
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
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [showFreeOnly, setShowFreeOnly] = useState(
    searchParams.get("freeOnly") === "true"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // 新增：错误状态
  const [categoriesError, setCategoriesError] = useState(""); // 新增：分类加载错误

  // 同步筛选条件到URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    if (showFreeOnly) params.set("freeOnly", "true");
    if (page > 1) params.set("page", page.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `/resources?${queryString}` : "/resources";

    // 使用 replace 而不是 push，避免污染浏览器历史
    router.replace(newUrl, { scroll: false });
  }, [selectedCategory, searchQuery, showFreeOnly, page, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesError("");
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          setCategoriesError("加载分类失败");
          return;
        }
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategoriesError("网络错误，请检查您的连接");
      }
    };
    fetchCategories();
  }, []);

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append("category", selectedCategory);
        if (searchQuery) params.append("search", searchQuery);
        if (showFreeOnly) params.append("freeOnly", "true"); // 新增：免积分筛选
        params.append("page", page.toString());

        const response = await fetch(`/api/resources?${params}`);
        if (!response.ok) {
          setError("加载资源失败，请稍后重试");
          return;
        }
        const data = await response.json();
        setResources(data.resources);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
        setError("网络错误，请检查您的连接");
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
      <Header />

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
              {categoriesError && (
                <div className="w-full mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
                  <span>{categoriesError}</span>
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                  >
                    重试
                  </button>
                </div>
              )}
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
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
            <p className="text-gray-600 mb-6">
              请检查您的网络连接或稍后重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              重新加载
            </button>
          </div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-4">暂无资源</p>
            <p className="text-gray-400 text-sm">
              {selectedCategory || searchQuery
                ? "尝试调整搜索条件或查看其他分类"
                : "管理员还没有上传任何资源"}
            </p>
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
      </main>      <Footer />
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
