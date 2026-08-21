import { useCallback, useEffect, useState } from 'react';
import {
  getScheduledEmails,
  type ScheduledEmail,
} from '../api/scheduled-email.api';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusClasses(status: ScheduledEmail['status']) {
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

export default function ScheduledEmailsPage() {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScheduledEmails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getScheduledEmails();
      setEmails(result);
    } catch (error) {
      console.error('Failed to load scheduled emails:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to load scheduled emails right now.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScheduledEmails();
  }, [loadScheduledEmails]);

  return (
    <section className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Email scheduler
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Scheduled Emails
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Emails waiting to be processed by the scheduler.
          </p>
        </div>

        {!isLoading ? (
          <p className="text-sm text-slate-500">
            {emails.length} email{emails.length === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>

      {/* Loading */}

      {isLoading ? (
        <section className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-600">
            Loading scheduled emails...
          </p>
        </section>
      ) : null}

      {/* Error */}

      {!isLoading && error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Scheduled emails unavailable
          </h2>

          <p className="mt-3 text-sm text-rose-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadScheduledEmails()}
            className="mt-5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
        </section>
      ) : null}

      {/* Empty */}

      {!isLoading && !error && emails.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
            ✉
          </div>

          <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
            No scheduled emails
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Emails scheduled for future delivery will appear here.
          </p>
        </section>
      ) : null}

      {/* Table */}

      {!isLoading && !error && emails.length > 0 ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 sm:px-6">
                    Email
                  </th>

                  <th className="px-4 py-3 sm:px-6">
                    Subject
                  </th>

                  <th className="px-4 py-3 sm:px-6">
                    Scheduled time
                  </th>

                  <th className="px-4 py-3 sm:px-6">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {emails.map((email) => (
                  <tr
                    key={email.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <p className="min-w-[14rem] text-sm font-medium text-slate-950">
                        {email.recipient}
                      </p>
                    </td>

                    <td className="px-4 py-4 sm:px-6">
                      <p className="min-w-[12rem] text-sm text-slate-700">
                        {email.subject}
                      </p>
                    </td>

                    <td className="px-4 py-4 sm:px-6">
                      <p className="whitespace-nowrap text-sm text-slate-600">
                        {formatDateTime(email.scheduledAt)}
                      </p>
                    </td>

                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={[
                          'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                          getStatusClasses(email.status),
                        ].join(' ')}
                      >
                        {email.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}