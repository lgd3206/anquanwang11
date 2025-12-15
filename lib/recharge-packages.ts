/**
 * 充值套餐配置
 *
 * 这是唯一的真实价格来源，前端和后端都使用此配置
 * ⚠️ 修改价格必须同时更新前后端
 */

export interface RechargePackage {
  id: string;           // 套餐ID
  points: number;       // 积分数量
  price: number;        // 价格（元）
  badge?: string;       // 标签（推荐/热门等）
  isPopular?: boolean;  // 是否热门
}

/**
 * 充值套餐列表
 * 按价格从低到高排序
 */
export const RECHARGE_PACKAGES: RechargePackage[] = [
  {
    id: "package_50",
    points: 50,
    price: 4.9,
    badge: "试水",
  },
  {
    id: "package_100",
    points: 100,
    price: 9.9,
  },
  {
    id: "package_300",
    points: 300,
    price: 24.9,
    badge: "推荐",
    isPopular: true,
  },
  {
    id: "package_500",
    points: 500,
    price: 39.9,
  },
  {
    id: "package_1000",
    points: 1000,
    price: 69.9,
    badge: "超值",
  },
  {
    id: "package_2000",
    points: 2000,
    price: 129.9,
  },
  {
    id: "package_5000",
    points: 5000,
    price: 299.9,
    badge: "VIP",
  },
  {
    id: "package_10000",
    points: 10000,
    price: 499.9,
    badge: "至尊",
  },
];

/**
 * 根据套餐ID查找套餐
 * @param packageId 套餐ID
 * @returns 套餐信息，不存在则返回null
 */
export function getPackageById(packageId: string): RechargePackage | null {
  return RECHARGE_PACKAGES.find((pkg) => pkg.id === packageId) || null;
}

/**
 * 验证套餐ID是否有效
 * @param packageId 套餐ID
 * @returns 是否有效
 */
export function isValidPackageId(packageId: string): boolean {
  return RECHARGE_PACKAGES.some((pkg) => pkg.id === packageId);
}

/**
 * 计算首次充值奖励
 * @param points 原始积分
 * @returns 奖励积分
 */
export function calculateFirstRechargeBonus(points: number): number {
  return Math.floor(points * 0.3); // 首次充值赠送30%
}
