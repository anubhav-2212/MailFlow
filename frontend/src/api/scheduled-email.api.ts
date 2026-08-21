import apiClient from './client';

export interface ScheduledEmail {
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

interface GetScheduledEmailsResponse {
  count: number;
  emails: ScheduledEmail[];
}

export async function getScheduledEmails(): Promise<ScheduledEmail[]> {
  const response =
    await apiClient.get<GetScheduledEmailsResponse>(
      '/email-campaign/scheduled',
    );

  return response.data.emails;
}