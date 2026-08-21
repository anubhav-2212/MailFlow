import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CreateCampaignForm from '../components/campaigns/CreateCampaignForm';
import { getCampaigns } from '../api/campaign.api';
import { useAuth } from '../hooks/useAuth';
import type { Campaign } from '../types/campaign';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDelay(delayMs: number) {
  if (delayMs < 1000) {
    return `${delayMs} ms`;
  }

  const seconds = delayMs / 1000;

  if (Number.isInteger(seconds)) {
    return `${seconds} sec`;
  }

  return `${seconds.toFixed(1)} sec`;
}

function getStatusClasses(status: Campaign['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';

    case 'PAUSED':
      return 'border-amber-200 bg-amber-50 text-amber-700';

    case 'COMPLETED':
      return 'border-sky-200 bg-sky-50 text-sky-700';

    case 'CANCELLED':
      return 'border-rose-200 bg-rose-50 text-rose-700';

    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userId = user?.id ?? null;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    if (!userId) {
      setCampaigns([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCampaigns(userId);
      setCampaigns(result);
    } catch {
      setError('Unable to load campaigns right now.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Campaigns
          </h1>

          <p className="text-sm text-slate-500">
            Create campaigns and review their schedule, status, and sending limits.
          </p>
        </div>

        {!isLoading ? (
          <p className="text-sm text-slate-500">
            {campaigns.length} campaign{campaigns.length === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>

      <CreateCampaignForm onSuccess={loadCampaigns} />

      {isLoading ? (
        <section className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">
            Loading campaigns...
          </p>
        </section>
      ) : null}

      {!isLoading && error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Campaign list unavailable
          </h2>

          <p className="mt-3 text-sm text-rose-700">
            {error}
          </p>
        </section>
      ) : null}

      {!isLoading && !error && campaigns.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            No campaigns yet
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Your campaigns will appear here after you create the first one.
          </p>
        </section>
      ) : null}

      {!isLoading && !error && campaigns.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 sm:px-6">Subject</th>
                  <th className="px-4 py-3 sm:px-6">Status</th>
                  <th className="px-4 py-3 sm:px-6">Start time</th>
                  <th className="px-4 py-3 sm:px-6">Delay</th>
                  <th className="px-4 py-3 sm:px-6">Hourly limit</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    onClick={() =>
                      navigate(`/dashboard/campaigns/${campaign.id}`)
                    }
                    className="cursor-pointer align-top transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <div className="min-w-[12rem]">
                        <p className="font-medium text-slate-950">
                          {campaign.subject}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={[
                          'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                          getStatusClasses(campaign.status),
                        ].join(' ')}
                      >
                        {campaign.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                      {formatDateTime(campaign.startTime)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                      {formatDelay(campaign.delayMs)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                      {campaign.hourlyLimit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}