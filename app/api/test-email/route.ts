import { NextRequest, NextResponse } from "next/server";
import { getMailer } from "@/lib/email";

/**
 * GET /api/test-email
 * 测试SMTP邮件配置
 *
 * 用法：访问 /api/test-email?to=youremail@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const toEmail = searchParams.get("to");

    if (!toEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "请提供收件人邮箱：/api/test-email?to=youremail@example.com"
        },
        { status: 400 }
      );
    }

    // 检查环境变量
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      hasPassword: !!process.env.SMTP_PASS,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    };

    console.log("SMTP配置检查:", {
      ...smtpConfig,
      passwordLength: process.env.SMTP_PASS?.length || 0,
    });

    // 测试邮件发送
    const mailer = getMailer();

    const result = await mailer.sendMail({
      from: process.env.SMTP_FROM || '"安全资源分享网" <noreply@example.com>',
      to: toEmail,
      subject: "测试邮件 - SMTP配置验证",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h2 style="color: #1e40af; margin: 0 0 15px 0;">✅ SMTP配置测试成功</h2>
            <p style="color: #374151; margin: 0 0 10px 0;">
              如果您收到这封邮件，说明邮件服务器配置正确！
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
            <h3 style="color: #374151; font-size: 14px; margin: 10px 0;">配置信息：</h3>
            <ul style="color: #6b7280; font-size: 13px; line-height: 1.8;">
              <li>SMTP服务器: ${smtpConfig.host}</li>
              <li>端口: ${smtpConfig.port}</li>
              <li>发件人: ${smtpConfig.from}</li>
              <li>应用URL: ${smtpConfig.appUrl}</li>
              <li>时间: ${new Date().toLocaleString('zh-CN')}</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              这是一封自动发送的测试邮件，无需回复。
            </p>
          </div>
        </div>
      `,
      text: `
        SMTP配置测试成功

        如果您收到这封邮件，说明邮件服务器配置正确！

        配置信息：
        - SMTP服务器: ${smtpConfig.host}
        - 端口: ${smtpConfig.port}
        - 发件人: ${smtpConfig.from}
        - 应用URL: ${smtpConfig.appUrl}
        - 时间: ${new Date().toLocaleString('zh-CN')}

        这是一封自动发送的测试邮件，无需回复。
      `,
    });

    console.log("✅ 测试邮件发送成功:", result.messageId);

    return NextResponse.json({
      success: true,
      message: "测试邮件已发送！请检查收件箱（包括垃圾邮件文件夹）",
      messageId: result.messageId,
      config: smtpConfig,
    });
  } catch (error: any) {
    console.error("❌ 测试邮件发送失败:", error);

    return NextResponse.json({
      success: false,
      message: "邮件发送失败",
      error: error.message,
      code: error.code,
      command: error.command,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        hasPassword: !!process.env.SMTP_PASS,
        passwordLength: process.env.SMTP_PASS?.length || 0,
      },
    });
  }
}
