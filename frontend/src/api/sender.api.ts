import apiClient from './client';

export interface Sender {
  id: string;
  email: string;
  hourlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

interface GetSendersResponse {
  senders: Sender[];
}

interface CreateSenderResponse {
  message: string;
  sender: Sender;
}

export interface CreateSenderInput {
  userId: string;
  email: string;
  etherealUser: string;
  etherealPassword: string;
  hourlyLimit?: number;
}

export async function getSenders(): Promise<Sender[]> {
  const response = await apiClient.get<GetSendersResponse>('/sender');

  return response.data.senders;
}

export async function createSender(
  input: CreateSenderInput,
): Promise<Sender> {
  const response = await apiClient.post<CreateSenderResponse>(
    '/sender',
    input,
  );

  return response.data.sender;
}