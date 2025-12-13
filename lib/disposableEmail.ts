/**
 * 一次性邮箱黑名单
 * 防止用户使用临时邮箱创建多个账户实施"薅羊毛"
 */

// 常见的一次性邮箱服务提供商
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // 广泛使用的临时邮箱服务
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "throwaway.email",
  "mailinator.com",
  "maildrop.cc",
  "temp-mail.io",
  "trashmail.com",
  "yopmail.com",
  "fakeinbox.com",
  "sharklasers.com",

  // 中文临时邮箱服务
  "clicknow.io",
  "tmpemail.com",
  "temporary-mail.net",
  "privateemail.com",
  "mytrashmail.com",
  "spam4.me",
  "grr.la",
  "guerrillamail.info",
  "guerrillamailblock.com",
  "guemail.com",
  "emailondeck.com",
  "mailnesia.com",
  "temp-mail.to",
  "tempm.com",

  // 10分钟邮箱及相关
  "temp10minutemail.com",
  "tempemaildisposable.com",
  "disposablemail.com",
  "disposable.email",

  // 开发测试邮箱（也应该被限制）
  "example.com",
  "test.com",
  "localhost.com",
  "127.0.0.1",
]);

/**
 * 检查邮箱是否来自一次性邮箱服务
 * @param email 邮箱地址
 * @returns 是否为一次性邮箱
 */
export function isDisposableEmail(email: string): boolean {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const domain = normalizedEmail.split("@")[1];

    if (!domain) return false;

    // 检查完全域名匹配
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      return true;
    }

    // 检查子域名（例如 subdomain.tempmail.com）
    const domainParts = domain.split(".");
    for (let i = 1; i < domainParts.length; i++) {
      const subDomain = domainParts.slice(i).join(".");
      if (DISPOSABLE_EMAIL_DOMAINS.has(subDomain)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking disposable email:", error);
    return false;
  }
}

/**
 * 获取邮箱域名
 */
export function getEmailDomain(email: string): string | null {
  try {
    const parts = email.toLowerCase().trim().split("@");
    return parts.length === 2 ? parts[1] : null;
  } catch (error) {
    return null;
  }
}

/**
 * 添加邮箱到黑名单
 */
export function addToDisposableList(domain: string): void {
  DISPOSABLE_EMAIL_DOMAINS.add(domain.toLowerCase().trim());
}

/**
 * 从黑名单移除邮箱
 */
export function removeFromDisposableList(domain: string): boolean {
  return DISPOSABLE_EMAIL_DOMAINS.delete(domain.toLowerCase().trim());
}

/**
 * 获取黑名单大小
 */
export function getDisposableListSize(): number {
  return DISPOSABLE_EMAIL_DOMAINS.size;
}
