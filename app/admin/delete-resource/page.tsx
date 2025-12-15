"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Resource {
  id: number;
  title: string;
  category: { name: string };
  description: string;
  mainLink: string;
  pointsCost: number;
  downloads: number;
  createdAt: string;
}

export default function DeleteResourcePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchType, setSearchType] = useState<"id" | "title">("id");
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // 权限检查
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        alert("请先登录");
        return;
      }

      try {
        // 调用管理员检查API
        const response = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          alert("登录已过期，请重新登录");
          return;
        }

        const data = await response.json();

        if (!data.isAdmin) {
          router.push("/dashboard");
          alert("无权限访问此页面");
          return;
        }

        setIsAuthorized(true);
        setChecking(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
        alert("验证失败，请重新登录");
      }
    };

    checkAuth();
  }, [router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage("请输入搜索内容");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setResources([]);

    try {
      const token = localStorage.getItem("token");
      let url = "/api/resources?limit=100";

      if (searchType === "id") {
        url = `/api/resources/${searchQuery}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setResources([data.resource]);
        } else {
          setMessage("未找到该资源");
          setMessageType("error");
        }
      } else {
        url = `/api/resources?search=${encodeURIComponent(searchQuery)}&limit=100`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.resources.length === 0) {
            setMessage("未找到匹配的资源");
            setMessageType("error");
          } else {
            setResources(data.resources);
          }
        } else {
          setMessage("搜索失败");
          setMessageType("error");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setMessage("搜索失败，请重试");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId: number, title: string) => {
    const confirm = window.confirm(
      `确定要删除资源 "${title}"（ID: ${resourceId}）吗？\n\n此操作不可撤销！`
    );

    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage(`成功删除资源：${title}`);
        setMessageType("success");
        setResources(resources.filter((r) => r.id !== resourceId));
      } else {
        const data = await response.json();
        setMessage(data.message || "删除失败");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("删除失败，请重试");
      setMessageType("error");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-gray-600">验证权限中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">删除资源</h1>
          <p className="text-gray-600 mb-6">
            ⚠️ 谨慎操作：删除操作不可撤销
          </p>

          {/* 搜索表单 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索方式
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="id"
                      checked={searchType === "id"}
                      onChange={(e) => setSearchType(e.target.value as "id")}
                      className="mr-2"
                    />
                    按资源ID
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="title"
                      checked={searchType === "title"}
                      onChange={(e) => setSearchType(e.target.value as "title")}
                      className="mr-2"
                    />
                    按标题搜索
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {searchType === "id" ? "资源ID" : "资源标题"}
                </label>
                <div className="flex gap-4">
                  <input
                    type={searchType === "id" ? "number" : "text"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === "id"
                        ? "输入资源ID，例如：262"
                        : "输入资源标题关键词，例如：test"
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? "搜索中..." : "搜索"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 消息提示 */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                messageType === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* 资源列表 */}
          {resources.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800">
                搜索结果（{resources.length} 个资源）
              </h2>
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {resource.title}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          {resource.category.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        ID: {resource.id} | 积分: {resource.pointsCost} | 下载次数:{" "}
                        {resource.downloads}
                      </p>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          描述: {resource.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        创建时间:{" "}
                        {new Date(resource.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(resource.id, resource.title)}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap"
                    >
                      删除
                    </button>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 break-all">
                      链接: {resource.mainLink}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 返回按钮 */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-secondary"
            >
              返回个人中心
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
