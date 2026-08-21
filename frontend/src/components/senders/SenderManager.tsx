import { useEffect, useState } from 'react';
import {
  createSender,
  getSenders,
  type Sender,
} from '../../api/sender.api';
import { useAuth } from '../../hooks/useAuth';

type SenderManagerProps = {
  onSenderCreated?: (sender: Sender) => void;
};

export default function SenderManager({
  onSenderCreated,
}: SenderManagerProps) {
  const { user } = useAuth();

  const [senders, setSenders] = useState<Sender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [email, setEmail] = useState('');
  const [etherealUser, setEtherealUser] = useState('');
  const [etherealPassword, setEtherealPassword] = useState('');
  const [hourlyLimit, setHourlyLimit] = useState('200');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadSenders() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSenders();
      setSenders(result);
    } catch {
      setError('Unable to load senders right now.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSenders();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!user?.id) {
      setError('You must be signed in to add a sender.');
      return;
    }

    if (!email.trim()) {
      setError('Sender email is required.');
      return;
    }

    if (!etherealUser.trim()) {
      setError('Ethereal username is required.');
      return;
    }

    if (!etherealPassword.trim()) {
      setError('Ethereal password is required.');
      return;
    }

    const limit = Number(hourlyLimit);

    if (!Number.isFinite(limit) || limit <= 0) {
      setError('Hourly limit must be a positive number.');
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const sender = await createSender({
        userId: user.id,
        email: email.trim(),
        etherealUser: etherealUser.trim(),
        etherealPassword: etherealPassword.trim(),
        hourlyLimit: limit,
      });

      setSenders((current) => [sender, ...current]);

      setEmail('');
      setEtherealUser('');
      setEtherealPassword('');
      setHourlyLimit('200');

      setSuccess('Sender added successfully.');

      onSenderCreated?.(sender);
    } catch {
      setError('Unable to create sender right now.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Add sender */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Add sender
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Connect an email sender for your campaigns.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Sender email
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sender@example.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Hourly limit
              </span>

              <input
                type="number"
                min="1"
                value={hourlyLimit}
                onChange={(event) =>
                  setHourlyLimit(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ethereal username
              </span>

              <input
                type="text"
                value={etherealUser}
                onChange={(event) =>
                  setEtherealUser(event.target.value)
                }
                placeholder="Ethereal SMTP username"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Ethereal password
              </span>

              <input
                type="password"
                value={etherealPassword}
                onChange={(event) =>
                  setEtherealPassword(event.target.value)
                }
                placeholder="Ethereal SMTP password"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isCreating ? 'Adding sender...' : 'Add sender'}
            </button>
          </div>
        </form>
      </div>

      {/* Sender list */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Your senders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Senders available for your campaigns.
          </p>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">
              Loading senders...
            </p>
          </div>
        ) : senders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-slate-950">
              No senders yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add your first sender above to start sending campaigns.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="px-4 py-3 sm:px-6">
                    Email
                  </th>

                  <th className="px-4 py-3 sm:px-6">
                    Hourly limit
                  </th>

                  <th className="px-4 py-3 sm:px-6">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {senders.map((sender) => (
                  <tr key={sender.id}>
                    <td className="px-4 py-4 sm:px-6">
                      <p className="font-medium text-slate-950">
                        {sender.email}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                      {sender.hourlyLimit}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600 sm:px-6">
                      {new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'medium',
                      }).format(new Date(sender.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}