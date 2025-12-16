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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [duplicates, setDuplicates] = useState<Array<{
    index: number;
    title: string;
    link: string;
    existingId: number;
    existingTitle: string;
    duplicateType: "link" | "title";
    reason: string;
  }> | null>(null);

  // 页面加载时检查登录和管理员权限
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        // 未登录，跳转到登录页（不设置 checking=false，保持 loading 状态）
        router.push("/login");
        setTimeout(() => alert("请先登录"), 100);
        return;
      }

      // 通过调用只读的管理员检查接口来验证权限（不污染数据库）
      try {
        const response = await fetch("/api/admin/check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 403) {
          router.push("/dashboard");
          setTimeout(() => alert("无权限访问此页面"), 100);
          return;
        }

        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          setTimeout(() => alert("登录已过期，请重新登录"), 100);
          return;
        }

        const data = await response.json();
        if (!data.isAdmin) {
          router.push("/dashboard");
          setTimeout(() => alert("无权限访问此页面"), 100);
          return;
        }

        // 权限验证通过，显示页面内容
        setIsAuthorized(true);
        setChecking(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
        setTimeout(() => alert("验证失败，请重新登录"), 100);
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

      // 为每个资源设置默认积分（根据分类）
      resources = resources.map((resource) => {
        const pointsRange = getPointsRange(resource.category || "安全课件");
        return {
          ...resource,
          pointsCost: resource.pointsCost || pointsRange.default,
        };
      });

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

      // 检查是否有重复资源
      if (data.hasDuplicates && data.duplicates) {
        setDuplicates(data.duplicates);
        setMessage(
          `⚠️ 检测到 ${data.duplicateCount} 个重复资源，请查证后重新导入`
        );
        setLoading(false);
        return;
      }

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
      setDuplicates(null);
    } catch (error) {
      setMessage(`导入过程中出错: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateResource = (index: number, field: string, value: any) => {
    setParsedResources(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // 一次性更新多个字段，避免状态竞态问题
  const updateResourceMultiple = (index: number, updates: Record<string, any>) => {
    setParsedResources(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  // 分类对应的推荐积分范围
  const getPointsRange = (category: string) => {
    const ranges: { [key: string]: { min: number; max: number; default: number } } = {
      "安全课件": { min: 5, max: 20, default: 10 },
      "标准规范": { min: 1, max: 15, default: 5 },
      "事故调查报告": { min: 1, max: 10, default: 5 },
      "事故警示视频": { min: 3, max: 20, default: 10 },
      "安全书籍": { min: 10, max: 60, default: 30 },
      "制度规程": { min: 1, max: 20, default: 5 },
      "检查表": { min: 1, max: 10, default: 3 },
      "注安": { min: 10, max: 50, default: 20 },
      "消防": { min: 5, max: 30, default: 15 },
      "HAZOP/SIL/LOPA": { min: 5, max: 30, default: 15 },
    };
    return ranges[category] || { min: 1, max: 50, default: 10 };
  };

  // 验证中或未授权时显示 loading
  if (checking || !isAuthorized) {
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
                    message.includes("失败") || message.includes("错误") || message.includes("检测到")
                      ? message.includes("检测到")
                        ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* 重复资源警告 */}
              {duplicates && duplicates.length > 0 && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-bold text-red-800 mb-3">
                    ⚠️ 检测到 {duplicates.length} 个重复资源
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-red-700">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-2 py-2 text-left">序号</th>
                          <th className="px-2 py-2 text-left">新资源标题</th>
                          <th className="px-2 py-2 text-left">重复类型</th>
                          <th className="px-2 py-2 text-left">已有资源</th>
                          <th className="px-2 py-2 text-left">原因</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-200">
                        {duplicates.map((dup, idx) => (
                          <tr key={idx} className="hover:bg-red-100">
                            <td className="px-2 py-2">{dup.index + 1}</td>
                            <td className="px-2 py-2 truncate max-w-xs">{dup.title}</td>
                            <td className="px-2 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                dup.duplicateType === "link"
                                  ? "bg-red-200 text-red-900"
                                  : "bg-orange-200 text-orange-900"
                              }`}>
                                {dup.duplicateType === "link" ? "链接重复" : "标题相似"}
                              </span>
                            </td>
                            <td className="px-2 py-2 truncate max-w-xs">{dup.existingTitle}</td>
                            <td className="px-2 py-2">{dup.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-sm text-red-700">
                    请删除重复资源或修改其标题/链接后重新导入
                  </p>
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
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          const pointsRange = getPointsRange(newCategory);
                          // 一次性更新分类和积分，避免状态竞态
                          updateResourceMultiple(index, {
                            category: newCategory,
                            pointsCost: pointsRange.default
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">选择分类...</option>
                        <option value="安全课件">安全课件</option>
                        <option value="标准规范">标准规范</option>
                        <option value="事故调查报告">事故调查报告</option>
                        <option value="事故警示视频">事故警示视频</option>
                        <option value="安全书籍">安全书籍</option>
                        <option value="制度规程">制度规程</option>
                        <option value="检查表">检查表</option>
                        <option value="注安">注安</option>
                        <option value="消防">消防</option>
                        <option value="HAZOP/SIL/LOPA">HAZOP/SIL/LOPA</option>
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        消耗积分
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={resource.pointsCost || getPointsRange(resource.category || "安全课件").default}
                          onChange={(e) =>
                            updateResource(index, "pointsCost", parseInt(e.target.value) || 0)
                          }
                          min={getPointsRange(resource.category || "安全课件").min}
                          max={getPointsRange(resource.category || "安全课件").max}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">
                          推荐范围：{getPointsRange(resource.category || "安全课件").min}-
                          {getPointsRange(resource.category || "安全课件").max} 点
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        根据资料价值设置合适的积分。当前分类"{resource.category || "安全课件"}"推荐默认值：
                        {getPointsRange(resource.category || "安全课件").default} 点
                      </p>
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
