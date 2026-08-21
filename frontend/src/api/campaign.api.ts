import apiClient from './client';
import type {
  Campaign,
  CreateCampaignInput,
  CreateCampaignResponse,
  GetCampaignsResponse,
} from '../types/campaign';

export async function getCampaigns(userId: string): Promise<Campaign[]> {
  const response = await apiClient.get<GetCampaignsResponse>('/campaigns', {
    params: { userId },
  });

  return response.data.campaigns;
}

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<Campaign> {
  const response = await apiClient.post<CreateCampaignResponse>('/campaigns', input);
  return response.data.campaign;
}
