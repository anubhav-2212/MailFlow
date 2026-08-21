import { Router } from "express";
import passport from "../config/passport.js";

const authRouter = Router();

// Start Google OAuth
authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Google OAuth callback
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/auth/login-failed",
  }),
  (req, res) => {
    res.json({
      message: "Google authentication successful",
      user: req.user,
    });
  },
);

// OAuth failure
authRouter.get(
  "/login-failed",
  (_req, res) => {
    res.status(401).json({
      message: "Google authentication failed",
    });
  },
);

export default authRouter;