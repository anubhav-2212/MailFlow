import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../config/auth.js";

export interface AuthenticatedRequest
  extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const payload = verifyAuthToken(token);

    req.userId = payload.userId;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
}