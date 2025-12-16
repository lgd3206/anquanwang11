import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient单例实例
 *
 * 在生产环境中避免重复创建PrismaClient实例，以防止连接数溢出
 * 在开发环境中使用全局变量缓存以支持Hot Module Replacement (HMR)
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
