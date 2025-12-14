import nodemailer, { Transporter } from 'nodemailer';

// 邮件发送配置
const emailConfig = {
  // 使用 Ethereal (测试)
  // service: 'gmail',
  // auth: {
  //   user: process.env.EMAIL_USER,
  //   pass: process.env.EMAIL_PASSWORD,
  // }

  // 本地开发使用 Ethereal Email
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // false for 587, true for 465
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'test',
  },
};

let transporter: Transporter | null = null;

/**
 * 获取邮件发送器实例
 */
export function getMailer(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

/**
 * 发送邮箱验证邮件
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  appUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hseshare.com'
): Promise<boolean> {
  try {
    const verificationUrl = `${appUrl}/api/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const mailer = getMailer();

    const result = await mailer.sendMail({
      from: process.env.SMTP_FROM || '"安全资源分享网" <noreply@example.com>',
      to: email,
      subject: '邮箱验证 - 安全资源分享网',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #1e40af; margin: 0 0 20px 0;">邮箱验证</h2>
            <p style="color: #333; margin: 0 0 15px 0;">
              感谢您注册安全资源分享网！请点击下方链接验证您的邮箱地址。
            </p>
            <p style="color: #333; margin: 0 0 20px 0;">
              该链接有效期为 24 小时。
            </p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 0 0 20px 0;">
              验证邮箱
            </a>
            <p style="color: #666; margin: 0 0 15px 0;">
              或者复制以下链接在浏览器中打开：
            </p>
            <p style="color: #0066cc; word-break: break-all; margin: 0 0 20px 0;">
              ${verificationUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; margin: 0;">
              如果您没有注册此账户，请忽略此邮件。
            </p>
          </div>
        </div>
      `,
      text: `
        邮箱验证 - 安全资源分享网

        感谢您注册安全资源分享网！请访问下方链接验证您的邮箱地址。

        ${verificationUrl}

        该链接有效期为 24 小时。

        如果您没有注册此账户，请忽略此邮件。
      `,
    });

    console.log('邮件发送成功:', result.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}

/**
 * 发送积分赠送通知邮件
 */
export async function sendBonusEmail(
  email: string,
  bonusPoints: number,
  appUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://www.hseshare.com'
): Promise<boolean> {
  try {
    const mailer = getMailer();

    const result = await mailer.sendMail({
      from: process.env.SMTP_FROM || '"安全资源分享网" <noreply@example.com>',
      to: email,
      subject: '邮箱验证成功 - 积分到账',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #16a34a; margin: 0 0 20px 0;">✅ 邮箱验证成功</h2>
            <p style="color: #333; margin: 0 0 15px 0;">
              恭喜！您的邮箱已验证成功，我们已为您的账户赠送 <strong>${bonusPoints} 积分</strong>。
            </p>
            <p style="color: #333; margin: 0 0 20px 0;">
              您现在可以在资源库中下载资源。每次下载都会消耗相应的积分。
            </p>
            <a href="${appUrl}/resources" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 0 0 20px 0;">
              浏览资源
            </a>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px; margin: 0;">
              如有任何问题，请联系客服支持。
            </p>
          </div>
        </div>
      `,
      text: `
        邮箱验证成功 - 积分到账

        恭喜！您的邮箱已验证成功，我们已为您的账户赠送 ${bonusPoints} 积分。

        您现在可以在资源库中下载资源。每次下载都会消耗相应的积分。

        浏览资源: ${appUrl}/resources

        如有任何问题，请联系客服支持。
      `,
    });

    console.log('邮件发送成功:', result.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}
