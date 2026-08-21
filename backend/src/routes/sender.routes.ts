import { Router } from "express";

import {
  createSenderController,
  getSendersController,
} from "../controllers/sender.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

export const senderRouter = Router();

senderRouter.post(
  "/",
  requireAuth,
  createSenderController,
);

senderRouter.get(
  "/",
  requireAuth,
  getSendersController,
);