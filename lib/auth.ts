import jwt, { SignOptions } from "jsonwebtoken";

export interface TokenPayload {
  userId: number;
  email: string;
}

/**
 * 获取JWT密钥（统一入口）
 * 所有JWT操作必须使用此函数获取密钥
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET environment variable must be set with at least 32 characters"
    );
  }
  return secret;
}

/**
 * 导出供其他模块使用（避免弱默认值）
 */
export function getSecret(): string {
  return getJwtSecret();
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function signToken(payload: TokenPayload, expiresIn: string = "7d"): string {
  const options: SignOptions = { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, getJwtSecret(), options);
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
