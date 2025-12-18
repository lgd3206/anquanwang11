-- AddPreviewFeature
-- 为Resource表添加预览相关字段

-- 添加预览相关字段到resources表
ALTER TABLE "resources" ADD COLUMN "fileType" TEXT;
ALTER TABLE "resources" ADD COLUMN "fileSize" TEXT;
ALTER TABLE "resources" ADD COLUMN "previewable" BOOLEAN NOT NULL DEFAULT true;

-- 创建previews表
CREATE TABLE "previews" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "resourceId" INTEGER NOT NULL,
    "previewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "previews_pkey" PRIMARY KEY ("id")
);

-- 创建索引
CREATE INDEX "previews_resourceId_idx" ON "previews"("resourceId");
CREATE INDEX "previews_userId_idx" ON "previews"("userId");

-- 添加外键约束
ALTER TABLE "previews" ADD CONSTRAINT "previews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "previews" ADD CONSTRAINT "previews_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 根据标题自动识别文件类型（可选）
UPDATE "resources" SET "fileType" = 'pdf' WHERE "title" ILIKE '%.pdf%';
UPDATE "resources" SET "fileType" = 'doc' WHERE "title" ILIKE '%.doc%' OR "title" ILIKE '%.docx%';
UPDATE "resources" SET "fileType" = 'xls' WHERE "title" ILIKE '%.xls%' OR "title" ILIKE '%.xlsx%';
UPDATE "resources" SET "fileType" = 'ppt' WHERE "title" ILIKE '%.ppt%' OR "title" ILIKE '%.pptx%';
UPDATE "resources" SET "fileType" = 'image' WHERE "title" ILIKE '%.jpg%' OR "title" ILIKE '%.png%' OR "title" ILIKE '%.gif%';
UPDATE "resources" SET "fileType" = 'video' WHERE "title" ILIKE '%.mp4%' OR "title" ILIKE '%.avi%' OR "title" ILIKE '%.mov%';
