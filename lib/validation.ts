import { z } from "zod";

// 登录验证
export const loginSchema = z.object({
  email: z
    .string()
    .email("邮箱格式不正确")
    .max(255, "邮箱过长"),
  password: z
    .string()
    .min(1, "密码不能为空")
    .max(128, "密码过长"),
});

// 注册验证
export const registerSchema = z.object({
  email: z
    .string()
    .email("邮箱格式不正确")
    .max(255, "邮箱过长"),
  password: z
    .string()
    .min(6, "密码至少需要6个字符")
    .max(128, "密码过长")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "密码必须包含字母和数字"
    ),
  name: z
    .string()
    .max(100, "名称过长")
    .optional(),
});

// 资源下载验证
export const downloadSchema = z.object({
  resourceId: z
    .number()
    .int("资源ID必须是整数")
    .positive("资源ID必须是正数"),
});

// 支付初始化验证
export const paymentInitSchema = z.object({
  points: z
    .number()
    .int("积分必须是整数")
    .positive("积分必须是正数"),
  amount: z
    .number()
    .min(0.01, "金额最小为0.01元")
    .max(999999, "金额最大为999999元"),
  paymentMethod: z.enum(["wechat", "alipay"], {
    message: "不支持的支付方式",
  }),
});

// 资源搜索验证
export const resourceSearchSchema = z.object({
  category: z.string().max(100).optional(),
  search: z
    .string()
    .max(200, "搜索关键词过长")
    .optional(),
  page: z
    .string()
    .regex(/^\d+$/, "页码必须是数字")
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
});

// 资源导入验证
export const resourceImportSchema = z.object({
  resources: z
    .array(
      z.object({
        title: z.string().min(1, "标题不能为空").max(500, "标题过长"),
        category: z.string().max(100).optional(),
        description: z.string().max(5000).optional(),
        link: z.string().url("链接格式不正确"),
        password: z.string().max(50).optional(),
        source: z.string().max(50).optional(),
        pointsCost: z.number().int().min(0).max(10000).optional(),
      })
    )
    .min(1, "至少需要一条资源")
    .max(1000, "单次最多导入1000条资源"),
  importType: z.string().max(50).optional(),
});

// 验证函数封装
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // zod v4 使用 issues 而非 errors
  const issues = result.error.issues || [];
  const firstIssue = issues[0];
  return { success: false, error: firstIssue?.message || "输入验证失败" };
}

// XSS清理函数
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
