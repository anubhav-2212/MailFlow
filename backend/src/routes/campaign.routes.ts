import { Router } from "express";

import { createCampaignController, getCampaignsController, getCampaignController } from "../controllers/campaign.controller.js";

const campaignRouter = Router();

campaignRouter.post("/", createCampaignController);
campaignRouter.get("/", getCampaignsController);
campaignRouter.get("/:campaignId",getCampaignController);

export default campaignRouter;