import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../hooks/useAuth';
import { getCampaigns } from '../api/campaign.api';
import {
  getScheduledEmails,
  type ScheduledEmail,
} from '../api/scheduled-email.api';
import {
  getSentEmails,
  type SentEmail,
} from '../api/sent-email.api';

function UserAvatar({
  avatar,
  name,
  size = 'md',
}: {
  avatar: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'lg'
      ? 'h-14 w-14 text-xl'
      : size === 'md'
        ? 'h-10 w-10 text-sm'
        : 'h-8 w-8 text-xs';

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-slate-950 font-semibold text-white`}
    >
      {initials}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusClasses(
  status: ScheduledEmail['status'] | SentEmail['status'],
) {
  switch (status) {
    case 'SCHEDULED':
      return 'border-amber-200 bg-amber-50 text-amber-700';

    case 'PROCESSING':
      return 'border-blue-200 bg-blue-50 text-blue-700';

    case 'SENT':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';

    case 'FAILED':
      return 'border-rose-200 bg-rose-50 text-rose-700';

    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [campaignCount, setCampaignCount] = useState(0);
  const [scheduledEmails, setScheduledEmails] = useState<
    ScheduledEmail[]
  >([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        campaignsResult,
        scheduledResult,
        sentResult,
      ] = await Promise.all([
        getCampaigns(user.id),
        getScheduledEmails(),
        getSentEmails(),
      ]);

      setCampaignCount(campaignsResult.length);
      setScheduledEmails(scheduledResult);
      setSentEmails(sentResult);
    } catch (error) {
      console.error(
        'Failed to load dashboard:',
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load dashboard data.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const sentCount = sentEmails.filter(
    (email) => email.status === 'SENT',
  ).length;

  const failedCount = sentEmails.filter(
    (email) => email.status === 'FAILED',
  ).length;

  const recentScheduledEmails =
    scheduledEmails.slice(0, 5);

  const recentSentEmails =
    sentEmails.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome */}

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar
            avatar={user?.avatar ?? null}
            name={user?.name ?? ''}
            size="lg"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Welcome back
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {user?.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {user?.email}
            </p>
          </div>
        </div>
      </section>

      {/* Error */}

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-rose-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="w-fit rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        </section>
      ) : null}

      {/* Statistics */}

      <section aria-label="Dashboard statistics">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Overview
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Email activity
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Campaigns"
            value={isLoading ? 0 : campaignCount}
            description="Total campaigns"
            icon="◉"
          />

          <StatCard
            label="Scheduled"
            value={
              isLoading
                ? 0
                : scheduledEmails.length
            }
            description="Waiting to be sent"
            icon="◷"
          />

          <StatCard
            label="Sent"
            value={isLoading ? 0 : sentCount}
            description="Successfully delivered"
            icon="✓"
          />

          <StatCard
            label="Failed"
            value={isLoading ? 0 : failedCount}
            description="Failed email attempts"
            icon="!"
          />
        </div>
      </section>

      {/* Recent scheduled */}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Scheduler
            </p>

            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
              Upcoming emails
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm text-slate-500">
              Loading scheduled emails...
            </p>
          </div>
        ) : recentScheduledEmails.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              No scheduled emails
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Your upcoming emails will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-3">
                      Recipient
                    </th>

                    <th className="px-5 py-3">
                      Subject
                    </th>

                    <th className="px-5 py-3">
                      Scheduled
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentScheduledEmails.map(
                    (email) => (
                      <tr key={email.id}>
                        <td className="px-5 py-4 text-sm font-medium text-slate-950">
                          {email.recipient}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {email.subject}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(
                            email.scheduledAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                              getStatusClasses(
                                email.status,
                              ),
                            ].join(' ')}
                          >
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Recent sent */}

      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            History
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Recent sent emails
          </h2>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm text-slate-500">
              Loading sent emails...
            </p>
          </div>
        ) : recentSentEmails.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              No sent emails yet
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Sent email history will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-5 py-3">
                      Recipient
                    </th>

                    <th className="px-5 py-3">
                      Subject
                    </th>

                    <th className="px-5 py-3">
                      Sent
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentSentEmails.map(
                    (email) => (
                      <tr key={email.id}>
                        <td className="px-5 py-4 text-sm font-medium text-slate-950">
                          {email.recipient}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {email.subject}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(
                            email.sentAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                              getStatusClasses(
                                email.status,
                              ),
                            ].join(' ')}
                          >
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}