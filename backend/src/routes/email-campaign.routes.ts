import { Router } from "express";

import {
  createCampaignEmailsController,
  getScheduledEmailsController,
  getSentEmailsController,
} from "../controllers/email-campaign.controller.js";

const emailcampaignRouter = Router();

// Create campaign emails
emailcampaignRouter.post(
  "/:campaignId/emails",
  createCampaignEmailsController,
);

// Get scheduled emails
emailcampaignRouter.get(
  "/scheduled",
  getScheduledEmailsController,
);

// Get sent/failed emails
emailcampaignRouter.get(
  "/sent",
  getSentEmailsController,
);

export default emailcampaignRouter;