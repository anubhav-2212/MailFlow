import { Router } from "express";

import { createSenderController } from "../controllers/sender.controller.js";

export const senderRouter = Router();

senderRouter.post("/",  createSenderController);

