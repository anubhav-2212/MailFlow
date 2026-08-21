import "dotenv/config";

import jwt, {
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not configured");
}

const secret: string = jwtSecret;

export interface AuthTokenPayload {
  userId: string;
}

export function createAuthToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: "7d",
  };

  return jwt.sign(
    {
      userId,
    },
    secret,
    options,
  );
}

export function verifyAuthToken(
  token: string,
): AuthTokenPayload {
  const decoded = jwt.verify(
    token,
    secret,
  );

  if (
    typeof decoded === "string" ||
    !("userId" in decoded)
  ) {
    throw new Error("Invalid authentication token");
  }

  const payload = decoded as JwtPayload & {
    userId: string;
  };

  if (typeof payload.userId !== "string") {
    throw new Error("Invalid authentication token");
  }

  return {
    userId: payload.userId,
  };
}