import prisma from "../config/prisma.js";


interface CreateCampaignInput {
  userId: string;
  subject: string;
  body: string;
  startTime: Date;
  delayMs?: number;
  hourlyLimit?: number;
}

// ========================================
// CREATE CAMPAIGN
// ========================================

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

// ========================================
// UPDATE CAMPAIGN STATUS
// ========================================

export async function updateCampaignStatus(
  campaignId: string,
) {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },

    select: {
      id: true,
      status: true,

      emails: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!campaign) {
    return null;
  }

  const emails = campaign.emails;

  // ----------------------------------------
  // No emails yet
  // ----------------------------------------

  if (emails.length === 0) {
    return campaign;
  }

  // ----------------------------------------
  // Check whether any emails are still pending
  // ----------------------------------------

  const hasPendingEmails = emails.some(
    (email) =>
      email.status === "SCHEDULED" ||
      email.status === "PROCESSING",
  );

  if (hasPendingEmails) {
    // Campaign is still running.

    if (campaign.status !== "ACTIVE") {
      return prisma.campaign.update({
        where: {
          id: campaignId,
        },

        data: {
          status: "ACTIVE",
        },
      });
    }

    return campaign;
  }

  // ----------------------------------------
  // All emails are finished
  //
  // At this point every email is either:
  //
  // SENT
  // FAILED
  //
  // Therefore the campaign is completed.
  // ----------------------------------------

  if (campaign.status !== "COMPLETED") {
    return prisma.campaign.update({
      where: {
        id: campaignId,
      },

      data: {
        status: "COMPLETED",
      },
    });
  }

  return campaign;
}

// ========================================
// GET CAMPAIGNS
// ========================================

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

// ========================================
// GET SINGLE CAMPAIGN
// ========================================

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

  // ----------------------------------------
  // Verify ownership
  // ----------------------------------------

  if (campaign.userId !== userId) {
    throw new Error(
      "Campaign does not belong to authenticated user",
    );
  }

  // ----------------------------------------
  // Calculate email statistics
  // ----------------------------------------

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