export const campaignStatuses = [
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];

export interface CampaignEmailCount {
  emails: number;
}

export interface Campaign {
  id: string;
  userId: string;
  subject: string;
  body: string;
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  _count?: CampaignEmailCount;
}

export interface CreateCampaignInput {
  subject: string;
  body: string;
  startTime: string;
  delayMs?: number;
  hourlyLimit?: number;
}

export interface CreateCampaignResponse {
  message: string;
  campaign: Campaign;
}

export interface GetCampaignsResponse {
  count: number;
  campaigns: Campaign[];
}
