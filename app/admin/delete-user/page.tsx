"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DeleteRecord {
  id: number;
  deletedUserEmail: string;
  deletedAt: string;
  pointsAdded: number;
  amount: number;
  status: string;
}

export default function DeleteUserPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "id">("email");
  const [reason, setReason] = useState("");
  const [backupData, setBackupData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [deleteRecords, setDeleteRecords] = useState<DeleteRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // 页面加载时获取删除历史
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchDeleteRecords();
    }
  }, []);

  // 获取删除历史
  const fetchDeleteRecords = async () => {
    setRecordsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("未登录，请先登录");
        setMessageType("error");
        return;
      }

      const response = await fetch("/api/admin/delete-user", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDeleteRecords(data.records || []);
      } else {
        setMessage(data.message || "获取删除历史失败");
        setMessageType("error");
      }
    } catch (error) {
      console.error("获取删除历史出错:", error);
      setMessage("获取删除历史出错");
      setMessageType("error");
    } finally {
      setRecordsLoading(false);
    }
  };

  // 删除用户
  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier) {
      setMessage("请输入用户邮箱或ID");
      setMessageType("error");
      return;
    }

    // 确认删除
    const confirmDelete = window.confirm(
      `确定要删除用户吗？\n\n用户: ${identifier}\n\n此操作不可撤销！`
    );

    if (!confirmDelete) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("未登录，请先登录");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          identifier,
          identifierType,
          reason: reason || "管理员手动删除",
          backupData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}\n\n用户邮箱: ${data.deletedUser.email}\n删除时间: ${new Date(data.deletedUser.deletedAt).toLocaleString()}`);
        setMessageType("success");

        // 清空表单
        setIdentifier("");
        setReason("");
        setBackupData(false);

        // 刷新删除历史
        setTimeout(() => {
          fetchDeleteRecords();
        }, 1000);
      } else {
        setMessage(`❌ ${data.message}`);
        setMessageType("error");
      }
    } catch (error) {
      console.error("删除用户出错:", error);
      setMessage("删除用户出错，请重试");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            安全资源分享网
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              首页
            </Link>
            <Link href="/resources" className="text-gray-700 hover:text-blue-600 transition">
              资源库
            </Link>
            <Link href="/admin/points-history" className="text-gray-700 hover:text-blue-600 transition">
              积分管理
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">用户删除管理</h1>
          <p className="text-gray-500 text-sm mb-8">⚠️ 该操作将永久删除用户及其所有数据，请谨慎操作</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 删除用户表单 */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">删除用户</h2>

                <form onSubmit={handleDeleteUser} className="space-y-4">
                  {/* 标识符类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      查找方式
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="email"
                          checked={identifierType === "email"}
                          onChange={(e) => setIdentifierType(e.target.value as "email")}
                          className="mr-2"
                        />
                        <span className="text-gray-700">按邮箱</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="id"
                          checked={identifierType === "id"}
                          onChange={(e) => setIdentifierType(e.target.value as "id")}
                          className="mr-2"
                        />
                        <span className="text-gray-700">按用户ID</span>
                      </label>
                    </div>
                  </div>

                  {/* 用户标识 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {identifierType === "email" ? "用户邮箱" : "用户ID"} *
                    </label>
                    <input
                      type={identifierType === "email" ? "email" : "text"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={identifierType === "email" ? "user@example.com" : "12345"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 删除原因 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      删除原因（可选）
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="记录删除原因，用于审计追踪（如：用户请求、账户被盗、违规处理等）"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* 备份数据选项 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={backupData}
                        onChange={(e) => setBackupData(e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-800">导出备份数据</p>
                        <p className="text-sm text-gray-600">
                          启用后，删除前会导出用户的完整数据备份，包含个人信息、积分记录、下载历史等
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 消息提示 */}
                  {message && (
                    <div
                      className={`p-4 rounded-lg ${
                        messageType === "success"
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : "bg-red-50 border border-red-200 text-red-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message}</p>
                    </div>
                  )}

                  {/* 警告框 */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">⚠️</span>
                      <div>
                        <h4 className="font-bold text-red-900 mb-1">危险操作</h4>
                        <ul className="text-sm text-red-800 space-y-1">
                          <li>• 此操作不可撤销，请确保您有备份或已确认要删除</li>
                          <li>• 将删除用户的所有数据：账户、积分、下载记录等</li>
                          <li>• 建议先启用"导出备份数据"选项以防万一</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 提交按钮 */}
                  <button
                    type="submit"
                    disabled={loading || !identifier}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {loading ? "删除中..." : "🗑️ 确认删除用户"}
                  </button>
                </form>
              </div>
            </div>

            {/* 快速操作指南 */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4 sticky top-24">
                <h3 className="text-lg font-bold text-gray-800">快速指南</h3>

                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">📧 按邮箱删除</p>
                    <p className="text-xs text-gray-600">输入用户注册时的邮箱地址，系统会自动查找并删除</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">🆔 按ID删除</p>
                    <p className="text-xs text-gray-600">使用用户ID（整数），通常在积分管理中可以查看</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">📝 删除原因</p>
                    <p className="text-xs text-gray-600">记录删除原因便于日后审计追踪和合规证明</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">💾 备份数据</p>
                    <p className="text-xs text-gray-600">建议启用，以防误删或法律纠纷</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500">
                    ℹ️ 删除操作会被记录到系统审计日志中，包括操作者、时间和原因
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 删除历史表 */}
          <div className="mt-12 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">删除历史（最近100条）</h2>
                  <button
                    onClick={fetchDeleteRecords}
                    disabled={recordsLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                  >
                    {recordsLoading ? "刷新中..." : "🔄 刷新"}
                  </button>
                </div>
              </div>

              {deleteRecords.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>暂无删除记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">删除时间</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">被删除用户邮箱</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {deleteRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(record.deletedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-800">
                            {record.deletedUserEmail}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              record.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : record.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {record.status === "completed" ? "已完成" : record.status === "pending" ? "处理中" : record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 mt-16">
        <div className="container text-center">
          <p>&copy; 2025 安全资源分享网. 保留所有权利。</p>
          <p className="text-sm mt-4 space-x-4">
            <Link href="/disclaimer" className="hover:text-white transition">
              免责声明
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-white transition">
              隐私政策
            </Link>
            <span>|</span>
            <span>仅供学习交流使用</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
