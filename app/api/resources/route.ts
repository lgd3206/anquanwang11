import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const freeOnly = searchParams.get("freeOnly") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt"; // 排序方式
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 12;
    const skip = (page - 1) * limit;

    // 使用三元组搜索或传统搜索
    let resources: any[];
    let total: number;

    if (search && search.trim().length > 0) {
      // 当有搜索词时，使用三元组搜索（如果searchText字段存在）
      try {
        // 首先检查searchText字段是否存在
        const searchTextCheck = await prisma.resource.findFirst({
          select: { id: true },
        });

        if (searchTextCheck) {
          // 构建基础过滤条件
          let whereClause = '';
          if (category) {
            whereClause += `AND r."categoryId" = (SELECT id FROM categories WHERE name = '${category.replace(/'/g, "''")}')`;
          }
          if (freeOnly) {
            whereClause += ` AND r."pointsCost" = 0`;
          }

          // 根据排序方式选择查询
          let orderByClause = 'similarity DESC, r."createdAt" DESC';
          if (sortBy === 'createdAt') {
            orderByClause = 'r."createdAt" DESC';
          } else if (sortBy === 'downloads') {
            orderByClause = 'r.downloads DESC, similarity DESC';
          } else if (sortBy === 'pointsCost') {
            orderByClause = 'r."pointsCost" ASC, similarity DESC';
          }

          // 三元组相似度搜索查询
          const searchQuery = search.trim();
          const rawResources = await prisma.$queryRawUnsafe<
            Array<{
              id: number;
              title: string;
              description: string | null;
              pointsCost: number;
              downloads: number;
              isNew: boolean;
              createdAt: Date;
              updatedAt: Date;
              source: string | null;
              categoryId: number;
              similarity: number | null;
              categoryName: string | null;
              categoryPointsCost: number | null;
              categoryDescription: string | null;
            }>
          >(`
            SELECT
              r.id,
              r.title,
              r.description,
              r."pointsCost",
              r.downloads,
              r."isNew",
              r."createdAt",
              r."updatedAt",
              r.source,
              r."categoryId",
              ROUND(CAST(similarity(r."searchText", $1) AS numeric), 3) as similarity,
              c.id as "categoryId",
              c.name as "categoryName",
              c."pointsCost" as "categoryPointsCost",
              c.description as "categoryDescription"
            FROM resources r
            LEFT JOIN categories c ON r."categoryId" = c.id
            WHERE r."searchText" % $1
            ${whereClause}
            ORDER BY ${orderByClause}
            LIMIT $2 OFFSET $3
          `, searchQuery, limit, skip);

          // 获取总数用于相似搜索
          const countResult = await prisma.$queryRawUnsafe<
            Array<{ count: bigint }>
          >(`
            SELECT COUNT(*) as count
            FROM resources r
            ${category ? `JOIN categories c ON r."categoryId" = c.id` : ''}
            WHERE r."searchText" % $1
            ${whereClause}
          `, searchQuery);

          total = Number(countResult[0]?.count || 0);

          // 格式化资源数据
          resources = (rawResources as any[]).map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            pointsCost: r.pointsCost,
            downloads: r.downloads,
            isNew: r.isNew,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            source: r.source,
            similarity: r.similarity, // 返回相似度分数
            category: {
              id: r.categoryId,
              name: r.categoryName,
              pointsCost: r.categoryPointsCost,
              description: r.categoryDescription,
            },
          }));
        } else {
          throw new Error('searchText field not available');
        }
      } catch (error) {
        // 如果三元组搜索失败，降级到传统搜索
        console.log('Trigram search fallback:', error);
        const where: any = {};
        if (category) {
          where.category = {
            name: category,
          };
        }
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
        if (freeOnly) {
          where.pointsCost = 0;
        }

        resources = await prisma.resource.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            pointsCost: true,
            downloads: true,
            isNew: true,
            createdAt: true,
            updatedAt: true,
            source: true,
            category: {
              select: {
                id: true,
                name: true,
                pointsCost: true,
                description: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: sortBy === 'downloads' ? { downloads: 'desc' } : sortBy === 'pointsCost' ? { pointsCost: 'asc' } : { createdAt: 'desc' },
        });

        total = await prisma.resource.count({
          where: {
            ...(category ? { category: { name: category } } : {}),
            ...((search) ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            } : {}),
            ...(freeOnly ? { pointsCost: 0 } : {}),
          },
        });
      }
    } else {
      // 无搜索词时使用常规查询
      const where: any = {};
      if (category) {
        where.category = {
          name: category,
        };
      }
      if (freeOnly) {
        where.pointsCost = 0;
      }

      // 根据sortBy选择排序方式
      let orderBy: any = { createdAt: "desc" };
      if (sortBy === "downloads") {
        orderBy = { downloads: "desc" };
      } else if (sortBy === "pointsCost") {
        orderBy = { pointsCost: "asc" };
      }

      resources = await prisma.resource.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          pointsCost: true,
          downloads: true,
          isNew: true,
          createdAt: true,
          updatedAt: true,
          source: true,
          category: {
            select: {
              id: true,
              name: true,
              pointsCost: true,
              description: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      });

      total = await prisma.resource.count({ where });
    }

    return NextResponse.json({
      resources,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      searchQuery: search, // 返回搜索词用于前端高亮
    });
  } catch (error) {
    console.error("Get resources error:", error);
    return NextResponse.json(
      { message: "获取资源失败" },
      { status: 500 }
    );
  }
}
