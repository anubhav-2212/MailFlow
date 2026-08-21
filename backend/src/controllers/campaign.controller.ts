import type { Request, Response } from "express";

import {
  createCampaign,
  getCampaigns,
  getCampaignById,
} from "../services/campaign.service.js";

// ------------------------------------
// Create Campaign
// ------------------------------------

export async function createCampaignController(
  req: Request,
  res: Response,
) {
  try {
    const {
      userId,
      subject,
      body,
      startTime,
      delayMs,
      hourlyLimit,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (!subject) {
      return res.status(400).json({
        message: "subject is required",
      });
    }

    if (!body) {
      return res.status(400).json({
        message: "body is required",
      });
    }

    if (!startTime) {
      return res.status(400).json({
        message: "startTime is required",
      });
    }

    const campaign = await createCampaign({
      userId,
      subject,
      body,
      startTime: new Date(startTime),
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
  req: Request,
  res: Response,
) {
  try {
    const { userId } = req.query;

    if (typeof userId !== "string") {
      return res.status(400).json({
        message: "userId query parameter is required",
      });
    }

    const campaigns = await getCampaigns(userId);

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
  req: Request<{ campaignId: string }>,
  res: Response,
) {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(400).json({
        message: "campaignId is required",
      });
    }

    const result = await getCampaignById(
      campaignId,
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

    return res.status(500).json({
      message: "Failed to fetch campaign",
    });
  }
}