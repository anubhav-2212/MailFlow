import type { Request, Response } from "express";

import { createSender } from "../services/sender.service.js";

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

    // Validation
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