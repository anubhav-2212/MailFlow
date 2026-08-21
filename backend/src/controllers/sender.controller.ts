import type { Request, Response } from "express";

import {
  createSender,
  getSenders,
} from "../services/sender.service.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export async function createSenderController(
  req: Request,
  res: Response,
) {
  try {
    const {
      userId,
      email,
      etherealUser,
      etherealPassword,
      hourlyLimit,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    if (!email) {
      return res.status(400).json({
        message: "email is required",
      });
    }

    if (!etherealUser) {
      return res.status(400).json({
        message: "etherealUser is required",
      });
    }

    if (!etherealPassword) {
      return res.status(400).json({
        message: "etherealPassword is required",
      });
    }

    const sender = await createSender({
      userId,
      email,
      etherealUser,
      etherealPassword,
      hourlyLimit,
    });

    return res.status(201).json({
      message: "Sender created successfully",
      sender,
    });
  } catch (error) {
    console.error(
      "createSenderController error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to create sender",
    });
  }
}

export async function getSendersController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const senders = await getSenders(req.userId);

    return res.status(200).json({
      senders,
    });
  } catch (error) {
    console.error(
      "getSendersController error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch senders",
    });
  }
}