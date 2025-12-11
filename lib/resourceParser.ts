// Resource parser for extracting information from text

export interface ParsedResource {
  title: string;
  link: string;
  password?: string;
  source?: string;
  category?: string;
}

export function parseResourceText(text: string): ParsedResource[] {
  const resources: ParsedResource[] = [];

  // Split by common separators
  const blocks = text.split(/---|\n\n(?=通过|链接:|https?:)/);

  for (const block of blocks) {
    const resource = parseBlock(block.trim());
    if (resource && resource.link) {
      resources.push(resource);
    }
  }

  return resources;
}

function parseBlock(text: string): ParsedResource | null {
  if (!text) return null;

  const resource: ParsedResource = {
    title: "",
    link: "",
  };

  // Extract link
  const linkMatch = text.match(/https?:\/\/[^\s]+/);
  if (!linkMatch) return null;
  resource.link = linkMatch[0];

  // Detect source
  if (resource.link.includes("pan.baidu.com")) {
    resource.source = "baidu";
  } else if (resource.link.includes("quark.cn")) {
    resource.source = "quark";
  }

  // Extract password
  const passwordMatch = text.match(/(?:提取码|密码|pwd)[:\s]+([a-zA-Z0-9]+)/i);
  if (passwordMatch) {
    resource.password = passwordMatch[1];
  }

  // Extract title from filename or first line
  const titleMatch = text.match(/(?:通过网盘分享的文件[：:]\s*)?([^\n]+\.(?:pptx?|pdf|xlsx?|docx?|mp4|avi|epub|mobi|zip|rar))/i);
  if (titleMatch) {
    resource.title = titleMatch[1].trim();
  } else {
    // Use first line as title
    const firstLine = text.split("\n")[0];
    resource.title = firstLine.replace(/^通过网盘分享的文件[：:]\s*/, "").trim();
  }

  // Auto-detect category based on keywords
  resource.category = detectCategory(resource.title);

  return resource;
}

function detectCategory(title: string): string {
  const lowerTitle = title.toLowerCase();

  const categoryRules: Record<string, string[]> = {
    "安全课件": ["课件", "培训", "讲座", "pptx", "ppt"],
    "事故调查报告": ["事故", "调查", "报告", "分析"],
    "标准规范": ["标准", "规范", "规程", "条例", "gb", "jgj"],
    "事故警示视频": ["视频", "mp4", "avi", "警示", "案例"],
    "安全管理书籍": ["书籍", "电子书", "epub", "mobi", "pdf"],
  };

  for (const [category, keywords] of Object.entries(categoryRules)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }

  return "安全课件"; // Default category
}

export function parseCSV(csvText: string): ParsedResource[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const resources: ParsedResource[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    const resource: ParsedResource = {
      title: values[headers.indexOf("标题")] || values[0] || "",
      link: values[headers.indexOf("链接")] || values[2] || "",
      password: values[headers.indexOf("提取码")] || values[3],
      category: values[headers.indexOf("分类")] || values[1],
    };

    if (resource.title && resource.link) {
      resources.push(resource);
    }
  }

  return resources;
}
