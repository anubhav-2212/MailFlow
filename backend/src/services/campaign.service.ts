import prisma from "../config/prisma.js";

interface CreateCampaignInput {
  userId: string;
  subject: string;
  body: string;
  startTime: Date;
  delayMs?: number;
  hourlyLimit?: number;
}
// Create Campaign

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

// Get Campaigns

export async function getCampaigns(
  userId: string,
) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      _count: {
        select: {
          emails: true,
        },
      },
    },
  });

  return campaigns;
}
// Get Single Campaign

export async function getCampaignById(
  campaignId: string,
  userId: string,
) {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },

    include: {
      emails: {
        select: {
          id: true,
          recipient: true,
          subject: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          attempts: true,
          error: true,
          sequenceNumber: true,
        },

        orderBy: {
          sequenceNumber: "asc",
        },
      },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Make sure the authenticated user owns this campaign
  if (campaign.userId !== userId) {
    throw new Error(
      "Campaign does not belong to authenticated user",
    );
  }

  // ------------------------------------
  // Calculate email statistics
  // ------------------------------------

  const stats = {
    total: campaign.emails.length,

    scheduled: campaign.emails.filter(
      (email) => email.status === "SCHEDULED",
    ).length,

    processing: campaign.emails.filter(
      (email) => email.status === "PROCESSING",
    ).length,

    sent: campaign.emails.filter(
      (email) => email.status === "SENT",
    ).length,

    failed: campaign.emails.filter(
      (email) => email.status === "FAILED",
    ).length,
  };

  return {
    campaign: {
      id: campaign.id,
      userId: campaign.userId,
      subject: campaign.subject,
      body: campaign.body,
      startTime: campaign.startTime,
      delayMs: campaign.delayMs,
      hourlyLimit: campaign.hourlyLimit,
      status: campaign.status,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    },

    stats,

    emails: campaign.emails,
  };
}
  // ------------------------------------
  // Calculate email statistics
  // ------------------------------------
