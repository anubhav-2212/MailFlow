import { Router } from "express";

import {createCampaignEmailsController,} from "../controllers/email-campaign.controller.js";

const emailcampaignRouter = Router();

emailcampaignRouter.post("/:campaignId/emails",createCampaignEmailsController,);

export default emailcampaignRouter;