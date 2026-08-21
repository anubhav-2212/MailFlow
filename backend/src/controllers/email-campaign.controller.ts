import type { Response } from "express";

import {
  createCampaignEmails,
  getScheduledEmails,
  getSentEmails,
} from "../services/email/email-campaign.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// ========================================
// CREATE CAMPAIGN EMAILS
// ========================================

export async function createCampaignEmailsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const campaignId = req.params.campaignId;

if (typeof campaignId !== "string") {
  return res.status(400).json({
    message: "Invalid campaign ID",
  });
}

    const { senderId, recipients } = req.body;

    if (!senderId) {
      return res.status(400).json({
        message: "senderId is required",
      });
    }

    if (!Array.isArray(recipients)) {
      return res.status(400).json({
        message: "recipients must be an array",
      });
    }

    const emails = await createCampaignEmails({
      campaignId,
      senderId,
      recipients,
      userId: req.userId,
    });

    return res.status(201).json({
      message: "Campaign emails created successfully",
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error(
      "createCampaignEmailsController error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create campaign emails";

    if (
      message === "Campaign not found" ||
      message === "Sender not found"
    ) {
      return res.status(404).json({
        message,
      });
    }

    if (
      message === "Campaign does not belong to authenticated user" ||
      message === "Sender does not belong to authenticated user" ||
      message === "Sender does not belong to campaign owner"
    ) {
      return res.status(403).json({
        message,
      });
    }

    return res.status(500).json({
      message,
    });
  }
}

// ========================================
// GET SCHEDULED EMAILS
// ========================================

export async function getScheduledEmailsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const emails = await getScheduledEmails(req.userId);

    return res.status(200).json({
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error(
      "getScheduledEmailsController error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch scheduled emails",
    });
  }
}

// ========================================
// GET SENT EMAILS
// ========================================

export async function getSentEmailsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const emails = await getSentEmails(req.userId);

    return res.status(200).json({
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error(
      "getSentEmailsController error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch sent emails",
    });
  }
}