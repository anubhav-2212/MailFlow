import type { Request, Response } from "express";

import {createCampaignEmails} from "../services/email/email-campaign.service.js";

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