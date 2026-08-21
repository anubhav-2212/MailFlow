import prisma from "../config/prisma.js";

interface CreateCampaignInput {
  userId: string;
  subject: string;
  body: string;
  startTime: Date;
  delayMs?: number;
  hourlyLimit?: number;
}

export async function createCampaign(
  input: CreateCampaignInput,
) {
  const campaign = await prisma.campaign.create({
    data: {
      userId: input.userId,
      subject: input.subject,
      body: input.body,
      startTime: input.startTime,
      delayMs: input.delayMs ?? 2000,
      hourlyLimit: input.hourlyLimit ?? 200,
    },
  });

  return campaign;
}