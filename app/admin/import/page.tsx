"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseResourceText, parseCSV, ParsedResource } from "@/lib/resourceParser";

export default function ImportPage() {
  const router = useRouter();
  const [importType, setImportType] = useState<"text" | "csv">("text");
  const [inputData, setInputData] = useState("");
  const [parsedResources, setParsedResources] = useState<ParsedResource[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");

  // 页面加载时检查登录和管理员权限
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("请先登录");
        router.push("/login");
        return;
      }

      // 通过调用管理员API来验证权限
      try {
        const response = await fetch("/api/resources/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resources: [{ title: "test", link: "https://example.com", password: "test" }],
            importType: "text",
          }),
        });

        if (response.status === 403) {
          alert("无权限访问此页面");
          router.push("/dashboard");
          return;
        }

        if (response.status === 401) {
          alert("登录已过期，请重新登录");
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error("Auth check error:", error);
        alert("验证失败，请重新登录");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleParse = () => {
    try {
      let resources: ParsedResource[] = [];

      if (importType === "text") {
        resources = parseResourceText(inputData);
      } else {
        resources = parseCSV(inputData);
      }

      if (resources.length === 0) {
        setMessage("未能解析出任何资源，请检查格式");
        return;
      }

      setParsedResources(resources);
      setShowPreview(true);
      setMessage(`成功解析 ${resources.length} 条资源`);
    } catch (error) {
      setMessage(`解析失败: ${error}`);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("请先登录");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/resources/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resources: parsedResources,
          importType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`导入失败: ${data.message}`);
        return;
      }

      setMessage(
        `导入成功！成功: ${data.successCount}, 失败: ${data.failedCount}`
      );
      setInputData("");
      setParsedResources([]);
      setShowPreview(false);
    } catch (error) {
      setMessage(`导入过程中出错: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateResource = (index: number, field: string, value: any) => {
    const updated = [...parsedResources];
    updated[index] = { ...updated[index], [field]: value };
    setParsedResources(updated);
  };

  // 加载中显示
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">验证权限中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-blue-600">资源导入管理</h1>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">导入资源</h2>

              {/* Import Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  导入方式
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="text"
                      checked={importType === "text"}
                      onChange={(e) => setImportType(e.target.value as "text")}
                      className="mr-2"
                    />
                    <span>文本粘贴</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={importType === "csv"}
                      onChange={(e) => setImportType(e.target.value as "csv")}
                      className="mr-2"
                    />
                    <span>CSV文件</span>
                  </label>
                </div>
              </div>

              {/* Input Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {importType === "text" ? "粘贴资源信息" : "粘贴CSV内容"}
                </label>
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder={
                    importType === "text"
                      ? "通过网盘分享的文件：2025消防宣传月消防安全知识培训 2025-11-7 92035 2.pptx\n链接: https://pan.baidu.com/s/1AcJvBQg8mLSV07jp-J-XtQ?pwd=5678 提取码: 5678"
                      : "标题,分类,链接,提取码\n2025消防宣传月,安全课件,https://pan.baidu.com/s/1xxx,5678"
                  }
                  className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`mb-4 px-4 py-3 rounded-lg ${
                    message.includes("失败") || message.includes("错误")
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleParse}
                  className="btn-primary"
                >
                  解析资源
                </button>
                {showPreview && (
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? "导入中..." : "确认导入"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">预览 ({parsedResources.length})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {parsedResources.map((resource, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                >
                  <p className="font-medium text-gray-800 truncate">
                    {resource.title}
                  </p>
                  <p className="text-gray-600 text-xs truncate">
                    {resource.category}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Section */}
        {showPreview && parsedResources.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">编辑资源信息</h2>
            <div className="space-y-6">
              {parsedResources.map((resource, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        标题
                      </label>
                      <input
                        type="text"
                        value={resource.title}
                        onChange={(e) =>
                          updateResource(index, "title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        分类
                      </label>
                      <select
                        value={resource.category || ""}
                        onChange={(e) =>
                          updateResource(index, "category", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="安全课件">安全课件</option>
                        <option value="事故调查报告">事故调查报告</option>
                        <option value="标准规范">标准规范</option>
                        <option value="事故警示视频">事故警示视频</option>
                        <option value="安全管理书籍">安全管理书籍</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        链接
                      </label>
                      <input
                        type="text"
                        value={resource.link}
                        onChange={(e) =>
                          updateResource(index, "link", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        提取码
                      </label>
                      <input
                        type="text"
                        value={resource.password || ""}
                        onChange={(e) =>
                          updateResource(index, "password", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
