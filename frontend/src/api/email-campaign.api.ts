import apiClient from './client';

export interface CampaignEmail {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED';
  attempts: number;
  error: string | null;
  sequenceNumber: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateCampaignEmailsResponse {
  message: string;
  count: number;
  emails: CampaignEmail[];
}

export interface CreateCampaignEmailsInput {
  campaignId: string;
  senderId: string;
  recipients: string[];
}

export async function createCampaignEmails(
  input: CreateCampaignEmailsInput,
): Promise<CreateCampaignEmailsResponse> {
  const response =
    await apiClient.post<CreateCampaignEmailsResponse>(
      `/email-campaign/${input.campaignId}/emails`,
      {
        senderId: input.senderId,
        recipients: input.recipients,
      },
    );

  return response.data;
}