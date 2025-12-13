import { NextRequest, NextResponse } from "next/server";

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET;
const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify";

/**
 * 验证hCaptcha令牌
 */
export async function verifyHCaptcha(token: string): Promise<boolean> {
  if (!HCAPTCHA_SECRET) {
    console.warn("HCAPTCHA_SECRET not configured, skipping verification");
    return true; // 如果未配置，允许通过
  }

  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error("hCaptcha verification request failed:", response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("hCaptcha verification error:", error);
    return false;
  }
}

/**
 * GET /api/hcaptcha/verify
 * 前端调用此端点来验证hCaptcha令牌
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: "缺少验证令牌" },
        { status: 400 }
      );
    }

    const isValid = await verifyHCaptcha(token);

    if (!isValid) {
      return NextResponse.json(
        { message: "验证失败，请重试" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "验证成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("hCaptcha verification error:", error);
    return NextResponse.json(
      { message: "验证过程出错" },
      { status: 500 }
    );
  }
}
