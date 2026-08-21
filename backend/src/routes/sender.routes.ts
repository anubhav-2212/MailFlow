import { Router } from "express";

import {
  createSenderController,
  getSendersController,
} from "../controllers/sender.controller.js";

export const senderRouter = Router();

senderRouter.post("/", createSenderController);

senderRouter.get("/", getSendersController);