import type { Request, Response } from "express";

import {
  createCampaignEmails,
  getScheduledEmails,
  getSentEmails,
} from "../services/email/email-campaign.service.js";


// ========================================
// CREATE CAMPAIGN EMAILS
// ========================================

export async function createCampaignEmailsController(
  req: Request<{ campaignId: string }>,
  res: Response,
) {
  try {
    const { campaignId } = req.params;

    const {
      senderId,
      recipients,
    } = req.body;

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
      message ===
      "Sender does not belong to campaign owner"
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
  _req: Request,
  res: Response,
) {
  try {

    const emails = await getScheduledEmails();

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
  _req: Request,
  res: Response,
) {
  try {

    const emails = await getSentEmails();

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