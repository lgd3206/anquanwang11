import crypto from 'crypto';

/**
 * Ping++ 支付工具函数
 * 用于与 Ping++ API 交互
 */

// Ping++ API 配置
const PING_API_KEY = process.env.PING_API_KEY || '';
const PING_APP_ID = process.env.PING_APP_ID || '';
const PING_API_URL = process.env.PING_API_URL || 'https://api.pingxx.com';
const PING_WEBHOOK_KEY = process.env.PING_WEBHOOK_KEY || '';

// API 调用基础类
class PingxxClient {
  private apiKey: string;
  private appId: string;
  private baseUrl: string;

  constructor(apiKey: string, appId: string, baseUrl: string = PING_API_URL) {
    this.apiKey = apiKey;
    this.appId = appId;
    this.baseUrl = baseUrl;
  }

  private getAuthHeader(): string {
    // Ping++ 使用 Basic Auth，格式为 base64(apiKey:)
    return 'Basic ' + Buffer.from(`${this.apiKey}:`).toString('base64');
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'safety-resources/1.0.0',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(data)) {
        params.append(key, String(value));
      }
      options.body = params.toString();
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          `Ping++ API Error: ${result.error?.message || response.statusText}`
        );
      }

      return result;
    } catch (error) {
      console.error('Ping++ API request failed:', error);
      throw error;
    }
  }

  /**
   * 创建支付订单 (Charge)
   * @param amount 金额（分）
   * @param currency 币种，默认 cny
   * @param channel 支付渠道：wechat / alipay / bfb
   * @param orderId 商户订单号
   * @param description 订单描述
   * @returns Charge 对象
   */
  async createCharge(
    amount: number,
    channel: 'wechat' | 'alipay' | 'bfb',
    orderId: string,
    description: string,
    clientIp?: string
  ): Promise<any> {
    const data: Record<string, any> = {
      amount,
      app: { id: this.appId },
      channel,
      order_no: orderId,
      currency: 'cny',
      subject: '安全资源分享网 - 积分充值',
      body: description,
    };

    if (clientIp) {
      data.client_ip = clientIp;
    }

    return this.makeRequest('POST', '/v1/charges', data);
  }

  /**
   * 查询支付订单状态
   * @param chargeId Ping++ 返回的支付 ID
   * @returns Charge 对象
   */
  async queryCharge(chargeId: string): Promise<any> {
    return this.makeRequest('GET', `/v1/charges/${chargeId}`);
  }

  /**
   * 申请退款
   * @param chargeId 支付 ID
   * @param amount 退款金额（分），为空则全额退款
   * @param description 退款原因
   * @returns Refund 对象
   */
  async refund(
    chargeId: string,
    amount?: number,
    description?: string
  ): Promise<any> {
    const data: Record<string, any> = {};

    if (amount) {
      data.amount = amount;
    }

    if (description) {
      data.description = description;
    }

    return this.makeRequest('POST', `/v1/charges/${chargeId}/refunds`, data);
  }

  /**
   * 验证 Webhook 签名（使用时间安全比较防止计时攻击）
   * @param data Raw body 数据
   * @param signature 签名（HTTP 头 X-Pingplusplus-Signature）
   * @returns 签名是否有效
   */
  verifySignature(data: string, signature: string): boolean {
    if (!PING_WEBHOOK_KEY) {
      console.warn("PING_WEBHOOK_KEY not configured");
      return false;
    }

    const computedSignature = crypto
      .createHmac('sha256', PING_WEBHOOK_KEY)
      .update(data, 'utf8')
      .digest('hex');

    // 使用时间安全比较防止计时攻击
    if (computedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  }
}

// 导出单例
const pingxxClient = new PingxxClient(PING_API_KEY, PING_APP_ID);

export default pingxxClient;

/**
 * 格式化金额：人民币 → 分
 * 例如：10 元 → 1000 分
 */
export function formatAmountToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

/**
 * 格式化金额：分 → 人民币
 * 例如：1000 分 → 10 元
 */
export function formatAmountToYuan(cents: number): number {
  return cents / 100;
}

/**
 * 生成唯一的订单号
 * 格式：TXN_时间戳_随机数
 */
export function generateOrderId(): string {
  return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 验证支付金额是否有效
 * Ping++ 最小 0.01 元，最大 999,999 元
 */
export function isValidAmount(yuan: number): boolean {
  return yuan >= 0.01 && yuan <= 999999;
}
