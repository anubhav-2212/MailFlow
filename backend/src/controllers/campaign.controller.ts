import type { Request, Response } from "express";

import {
  createCampaign,
} from "../services/campaign.service.js";

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

    const campaign =
      await createCampaign({
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