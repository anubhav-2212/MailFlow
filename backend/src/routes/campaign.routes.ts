import { Router } from "express";

import { createCampaignController, getCampaignsController, getCampaignController } from "../controllers/campaign.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const campaignRouter = Router();

campaignRouter.post("/", requireAuth, createCampaignController);
campaignRouter.get("/", requireAuth, getCampaignsController);
campaignRouter.get("/:campaignId", requireAuth, getCampaignController);

export default campaignRouter;