/**
 * 字符串相似度计算 - 使用 Levenshtein 距离
 * 返回 0-1 之间的相似度，1 表示完全相同
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // 完全相同
  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  // 计算 Levenshtein 距离
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein 距离算法
 * 计算两个字符串之间的最小编辑距离
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

/**
 * 检查资源是否为重复
 * @param title 新资源标题
 * @param link 新资源链接
 * @param existingResources 现有资源列表
 * @param titleSimilarityThreshold 标题相似度阈值 (0-1)，默认 0.8
 * @returns 重复资源信息或 null
 */
export function findDuplicate(
  title: string,
  link: string,
  existingResources: Array<{ id: number; title: string; mainLink: string; categoryId?: number; pointsCost?: number }>,
  titleSimilarityThreshold: number = 0.8
) {
  // 先检查链接是否完全相同
  const linkDuplicate = existingResources.find(
    (res) => res.mainLink && res.mainLink.toLowerCase().trim() === link.toLowerCase().trim()
  );

  if (linkDuplicate) {
    return {
      type: "link",
      duplicate: linkDuplicate,
      reason: "链接完全相同",
    };
  }

  // 再检查标题相似度
  const titleDuplicate = existingResources.find((res) => {
    const similarity = calculateSimilarity(title, res.title);
    return similarity >= titleSimilarityThreshold;
  });

  if (titleDuplicate) {
    return {
      type: "title",
      duplicate: titleDuplicate,
      reason: `标题相似度达到 ${(calculateSimilarity(title, titleDuplicate.title) * 100).toFixed(1)}%`,
    };
  }

  return null;
}

/**
 * 批量检查重复资源
 */
export function findDuplicates(
  resourcesToImport: Array<{ title: string; link: string }>,
  existingResources: Array<{ id: number; title: string; mainLink: string; categoryId?: number; pointsCost?: number }>,
  titleSimilarityThreshold: number = 0.8
) {
  const duplicates: Array<{
    resourceIndex: number;
    title: string;
    link: string;
    duplicateInfo: ReturnType<typeof findDuplicate>;
  }> = [];

  for (let i = 0; i < resourcesToImport.length; i++) {
    const resource = resourcesToImport[i];
    const duplicate = findDuplicate(
      resource.title,
      resource.link,
      existingResources,
      titleSimilarityThreshold
    );

    if (duplicate) {
      duplicates.push({
        resourceIndex: i,
        title: resource.title,
        link: resource.link,
        duplicateInfo: duplicate,
      });
    }
  }

  return duplicates;
}
