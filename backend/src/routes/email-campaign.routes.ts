import { Router } from "express";

import {
  createCampaignEmailsController,
  getScheduledEmailsController,
  getSentEmailsController,
} from "../controllers/email-campaign.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const emailcampaignRouter = Router();

// Create campaign emails
emailcampaignRouter.post(
  "/:campaignId/emails",
  requireAuth,
  createCampaignEmailsController,
);

emailcampaignRouter.get(
  "/scheduled",
  requireAuth,
  getScheduledEmailsController,
);

emailcampaignRouter.get(
  "/sent",
  requireAuth,
  getSentEmailsController,
);

export default emailcampaignRouter;