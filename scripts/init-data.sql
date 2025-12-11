-- 插入分类
INSERT INTO "categories" ("name", "pointsCost", "description") VALUES
('安全课件', 5, '安全培训课件和资源'),
('事故报告', 15, '典型事故调查报告'),
('标准规范', 20, '安全生产标准和规范'),
('警示视频', 10, '安全警示教育视频'),
('安全书籍', 30, '安全管理相关书籍')
ON CONFLICT ("name") DO NOTHING;

-- 插入资源（需要先获取分类ID）
INSERT INTO "resources" ("title", "categoryId", "description", "mainLink", "password", "backupLink1", "source", "pointsCost") VALUES
('2024年生产安全事故典型案例分析', 2, '包含10起典型生产安全事故的详细分析和教训', 'https://example.com/accident-2024', '123456', 'https://backup1.com/accident-2024', 'baidu', 15),
('GB/T 45001-2024 职业健康安全管理体系', 3, '最新的职业健康安全管理体系国家标准', 'https://example.com/gb45001', 'pwd123', 'https://backup1.com/gb45001', 'quark', 20),
('安全生产管理基础知识', 1, '全面的安全生产管理基础知识培训课件', 'https://example.com/basic-safety', 'safe123', 'https://backup1.com/basic-safety', 'baidu', 5),
('煤矿事故预防与应急处置', 4, '煤矿典型事故预防和应急处置视频教材', 'https://example.com/coal-safety', 'video123', 'https://backup1.com/coal-safety', 'quark', 10),
('企业安全文化建设指南', 5, '如何在企业中建设强大的安全文化', 'https://example.com/safety-culture', 'book123', 'https://backup1.com/safety-culture', 'baidu', 30),
('建筑施工安全生产规范', 3, '建筑工程施工现场安全生产规范要求', 'https://example.com/construction-safety', 'const123', 'https://backup1.com/construction-safety', 'quark', 20),
('工业企业安全管理基础', 1, '工业企业日常安全管理实践指南', 'https://example.com/industrial-safety', 'ind123', 'https://backup1.com/industrial-safety', 'baidu', 5),
('危险化学品安全操作手册', 5, '危险化学品的安全识别和操作规程', 'https://example.com/chemical-safety', 'chem123', 'https://backup1.com/chemical-safety', 'quark', 30);
