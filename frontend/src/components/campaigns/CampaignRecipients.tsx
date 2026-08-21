import { useEffect, useState } from 'react';
import { createCampaignEmails } from '../../api/email-campaign.api';
import { getSenders, type Sender } from '../../api/sender.api';
import { useAuth } from '../../hooks/useAuth';

type CampaignRecipientsProps = {
  campaignId: string;
  onSuccess?: () => void;
};

export default function CampaignRecipients({
  campaignId,
  onSuccess,
}: CampaignRecipientsProps) {
  const { user } = useAuth();

  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState('');

  const [recipients, setRecipients] = useState('');
  const [isLoadingSenders, setIsLoadingSenders] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadSenders() {
      setIsLoadingSenders(true);

      try {
        const result = await getSenders();
        setSenders(result);

        if (result.length > 0) {
          setSenderId(result[0].id);
        }
      } catch {
        setError('Unable to load senders.');
      } finally {
        setIsLoadingSenders(false);
      }
    }

    void loadSenders();
  }, []);

  function parseRecipients() {
    return recipients
      .split(/[\n,]+/)
      .map((email) => email.trim())
      .filter(Boolean);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!user?.id) {
      setError('You must be signed in.');
      return;
    }

    if (!senderId) {
      setError('Please select a sender.');
      return;
    }

    const emailList = parseRecipients();

    if (emailList.length === 0) {
      setError('Add at least one recipient.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCampaignEmails({
        campaignId,
        senderId,
        recipients: emailList,
      });

      setRecipients('');

      setSuccess(
        `${result.count} recipient${
          result.count === 1 ? '' : 's'
        } added successfully.`,
      );

      onSuccess?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to add recipients.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Add recipients
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a sender and add the people who should receive this campaign.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-5 sm:p-6"
      >
        {/* Sender */}
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Sender
          </span>

          <select
            value={senderId}
            onChange={(event) => setSenderId(event.target.value)}
            disabled={isLoadingSenders || senders.length === 0}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {isLoadingSenders ? (
              <option value="">Loading senders...</option>
            ) : senders.length === 0 ? (
              <option value="">No senders available</option>
            ) : (
              <>
                <option value="">Select a sender</option>

                {senders.map((sender) => (
                  <option
                    key={sender.id}
                    value={sender.id}
                  >
                    {sender.email}
                  </option>
                ))}
              </>
            )}
          </select>
        </label>

        {/* Recipients */}
        <label className="block">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Recipients
            </span>

            <span className="text-xs text-slate-400">
              One email per line
            </span>
          </div>

          <textarea
            value={recipients}
            onChange={(event) => {
              setRecipients(event.target.value);
              setError(null);
              setSuccess(null);
            }}
            rows={8}
            placeholder={`john@example.com
jane@example.com
alex@example.com`}
            className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          <p className="mt-2 text-xs text-slate-400">
            You can also separate email addresses using commas.
          </p>
        </label>

        {/* Messages */}
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

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingSenders ||
              senders.length === 0
            }
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting
              ? 'Adding recipients...'
              : 'Add recipients'}
          </button>
        </div>
      </form>
    </section>
  );
}