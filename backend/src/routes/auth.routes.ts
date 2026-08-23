import { Router, type Request, type Response } from "express";
import passport from "../config/passport.js";
import { createAuthToken } from "../config/auth.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import prisma from "../config/prisma.js";

const authRouter = Router();

// ========================================
// Start Google OAuth
// ========================================

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// ========================================
// Google OAuth callback
// ========================================

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/auth/login-failed",
  }),
  (req: Request, res: Response) => {
    const user = req.user as {
      id: string;
      email: string;
      name: string;
      avatar: string | null;
    };

    const token = createAuthToken(user.id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl =
      process.env.FRONTEND_URL ?? "http://localhost:5173";

    return res.redirect(`${frontendUrl}/dashboard`);
  },
);

// ========================================
// Get current authenticated user
// ========================================

authRouter.get(
  "/me",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.userId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.status(200).json({
        user,
      });
    } catch (error) {
      console.error("getCurrentUser error:", error);

      return res.status(500).json({
        message: "Failed to fetch authenticated user",
      });
    }
  },
);

// ========================================
// Logout
// ========================================

authRouter.post(
  "/logout",
  (_req: Request, res: Response) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  },
);

// ========================================
// OAuth failure
// ========================================

authRouter.get(
  "/login-failed",
  (_req: Request, res: Response) => {
    return res.status(401).json({
      message: "Google authentication failed",
    });
  },
);

export default authRouter;