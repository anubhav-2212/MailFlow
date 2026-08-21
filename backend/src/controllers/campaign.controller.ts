import type { Response } from "express";

import {
  createCampaign,
  getCampaigns,
  getCampaignById,
} from "../services/campaign.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// ------------------------------------
// Create Campaign
// ------------------------------------

export async function createCampaignController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const {
      subject,
      body,
      startTime,
      delayMs,
      hourlyLimit,
    } = req.body;

    if (!subject?.trim()) {
      return res.status(400).json({
        message: "subject is required",
      });
    }

    if (!body?.trim()) {
      return res.status(400).json({
        message: "body is required",
      });
    }

    if (!startTime) {
      return res.status(400).json({
        message: "startTime is required",
      });
    }

    const parsedStartTime = new Date(startTime);

    if (Number.isNaN(parsedStartTime.getTime())) {
      return res.status(400).json({
        message: "startTime must be a valid date",
      });
    }

    if (parsedStartTime.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "startTime must be in the future",
      });
    }

    const campaign = await createCampaign({
      userId: req.userId,
      subject: subject.trim(),
      body: body.trim(),
      startTime: parsedStartTime,
      delayMs,
      hourlyLimit,
    });

    return res.status(201).json({
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error(
      "createCampaignController error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to create campaign",
    });
  }
}

// ------------------------------------
// Get Campaigns
// ------------------------------------

export async function getCampaignsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const campaigns = await getCampaigns(req.userId);

    return res.status(200).json({
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error(
      "getCampaignsController error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch campaigns",
    });
  }
}

// ------------------------------------
// Get Single Campaign
// ------------------------------------

export async function getCampaignController(
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

    const result = await getCampaignById(
      campaignId,
      req.userId,
    );

    return res.status(200).json(result);
    
  } catch (error) {
    console.error(
      "getCampaignController error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Campaign not found"
    ) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "Campaign does not belong to authenticated user"
    ) {
      return res.status(403).json({
        message:
          "You do not have access to this campaign",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch campaign",
    });
  }
}