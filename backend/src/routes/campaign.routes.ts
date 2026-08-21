import { Router } from "express";

import {createCampaignController} from "../controllers/campaign.controller.js";

const campaignRouter = Router();

campaignRouter.post(
  "/",
  createCampaignController,
);

export default campaignRouter;