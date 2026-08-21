import apiClient from './client';

export interface SentEmail {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: 'SENT' | 'FAILED';
  attempts: number;
  error: string | null;
  sequenceNumber: number;
  createdAt: string;
  updatedAt: string;
}

interface GetSentEmailsResponse {
  count: number;
  emails: SentEmail[];
}

export async function getSentEmails(): Promise<SentEmail[]> {
  const response =
    await apiClient.get<GetSentEmailsResponse>(
      '/email-campaign/sent',
    );

  return response.data.emails;
}