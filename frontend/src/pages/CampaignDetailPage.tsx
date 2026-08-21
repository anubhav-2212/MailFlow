import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getCampaign } from '../api/campaign.api';
import type { Campaign } from '../types/campaign';

import CampaignRecipients from '../components/campaigns/CampaignRecipients';

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

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setError('Campaign ID is missing.');
      setIsLoading(false);
      return;
    }

    // Narrow campaignId so TypeScript knows it is definitely a string
    const id = campaignId;

    async function loadCampaign() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getCampaign(id);
        setCampaign(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load campaign.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadCampaign();
  }, [campaignId]);

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-600">
          Loading campaign...
        </p>
      </section>
    );
  }

  if (error || !campaign) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Campaign unavailable
        </h2>

        <p className="mt-3 text-sm text-rose-700">
          {error ?? 'Campaign not found.'}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Campaign header */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Campaign
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {campaign.subject}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Configure recipients and sending details for this campaign.
            </p>
          </div>

          <span
            className={[
              'inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold',
              getStatusClasses(campaign.status),
            ].join(' ')}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Campaign information */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Campaign details
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Start time
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {formatDateTime(campaign.startTime)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Delay
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {formatDelay(campaign.delayMs)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Hourly limit
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {campaign.hourlyLimit}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Created
            </p>

            <p className="mt-1 text-sm font-medium text-slate-700">
              {formatDateTime(campaign.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Message
          </p>

          <div className="mt-2 rounded-2xl bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {campaign.body}
            </p>
          </div>
        </div>
      </section>

      {/* Recipients */}
      {campaignId ? (
        <CampaignRecipients campaignId={campaignId} />
      ) : null}
    </section>
  );
}