import { useEffect, useState } from 'react';
import { createCampaign } from '../../api/campaign.api';
import { createCampaignEmails } from '../../api/email-campaign.api';
import { getSenders, type Sender } from '../../api/sender.api';
import { useAuth } from '../../hooks/useAuth';

type FormValues = {
  subject: string;
  body: string;
  startTime: string;
  delayMs: string;
  hourlyLimit: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type CreateCampaignFormProps = {
  onSuccess?: () => Promise<void> | void;
};

const initialValues: FormValues = {
  subject: '',
  body: '',
  startTime: '',
  delayMs: '2000',
  hourlyLimit: '200',
};

function isFutureDateTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.subject.trim()) {
    errors.subject = 'Subject is required.';
  }

  if (!values.body.trim()) {
    errors.body = 'Body is required.';
  }

  if (!values.startTime) {
    errors.startTime = 'Start time is required.';
  } else if (!isFutureDateTime(values.startTime)) {
    errors.startTime = 'Start time must be a valid future date and time.';
  }

  const delayMs = Number(values.delayMs);

  if (!values.delayMs.trim()) {
    errors.delayMs = 'Delay is required.';
  } else if (!Number.isFinite(delayMs) || delayMs <= 0) {
    errors.delayMs = 'Delay must be a positive number.';
  }

  const hourlyLimit = Number(values.hourlyLimit);

  if (!values.hourlyLimit.trim()) {
    errors.hourlyLimit = 'Hourly limit is required.';
  } else if (!Number.isFinite(hourlyLimit) || hourlyLimit <= 0) {
    errors.hourlyLimit = 'Hourly limit must be a positive number.';
  }

  return errors;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unable to create campaign right now.';
}

export default function CreateCampaignForm({
  onSuccess,
}: CreateCampaignFormProps) {
  const { user } = useAuth();

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------
  // Lead upload state
  // --------------------------------------------------

  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // --------------------------------------------------
  // Sender state
  // --------------------------------------------------

  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [senderError, setSenderError] = useState<string | null>(null);
  const [isLoadingSenders, setIsLoadingSenders] = useState(true);

  // --------------------------------------------------
  // Load senders
  // --------------------------------------------------

  useEffect(() => {
    async function loadSenders() {
      setIsLoadingSenders(true);
      setSenderError(null);

      try {
        const result = await getSenders();
        setSenders(result);

        if (result.length === 0) {
          setSenderError(
            'No senders found. Please add a sender before creating a campaign.',
          );
        }
      } catch (error) {
        console.error('Failed to load senders:', error);
        setSenderError('Unable to load senders right now.');
      } finally {
        setIsLoadingSenders(false);
      }
    }

    void loadSenders();
  }, []);

  // --------------------------------------------------
  // Form change
  // --------------------------------------------------

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setSubmitError(null);
    setSuccessMessage(null);
  }

  // --------------------------------------------------
  // CSV / TXT upload
  // --------------------------------------------------

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setFileError(null);
    setRecipients([]);
    setSubmitError(null);

    file
      .text()
      .then((text) => {
        const matches =
          text.match(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          ) ?? [];

        const uniqueEmails = [
          ...new Set(
            matches.map((email) =>
              email.toLowerCase().trim(),
            ),
          ),
        ];

        if (uniqueEmails.length === 0) {
          setFileError(
            'No valid email addresses were found in this file.',
          );
          return;
        }

        setRecipients(uniqueEmails);
      })
      .catch(() => {
        setFileError('Unable to read the selected file.');
      });
  }

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextErrors = validate(values);

    setErrors(nextErrors);
    setSubmitError(null);
    setSuccessMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!user?.id) {
      setSubmitError(
        'You must be signed in to create a campaign.',
      );
      return;
    }

    if (!selectedSenderId) {
      setSubmitError('Please select a sender.');
      return;
    }

    if (recipients.length === 0) {
      setSubmitError(
        'Please upload a CSV or TXT file containing email addresses.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create campaign
      const campaign = await createCampaign({
        userId: user.id,
        subject: values.subject.trim(),
        body: values.body.trim(),
        startTime: new Date(
          values.startTime,
        ).toISOString(),
        delayMs: Number(values.delayMs),
        hourlyLimit: Number(values.hourlyLimit),
      });

      // 2. Create scheduled emails for the campaign
      await createCampaignEmails({
        campaignId: campaign.id,
        senderId: selectedSenderId,
        recipients,
      });

      // 3. Reset form
      setValues(initialValues);
      setErrors({});
      setRecipients([]);
      setFileName(null);
      setFileError(null);
      setSelectedSenderId('');
      setSubmitError(null);

      setSuccessMessage(
        `Campaign created successfully with ${recipients.length} email${recipients.length === 1 ? '' : 's'}.`,
      );

      await onSuccess?.();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Create campaign
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Set the campaign details, sender, recipients, and
          sending schedule.
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Subject + Start time */}

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Subject
            </span>

            <input
              type="text"
              name="subject"
              value={values.subject}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Quarterly outreach"
            />

            {errors.subject ? (
              <p className="mt-2 text-sm text-rose-600">
                {errors.subject}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Start time
            </span>

            <input
              type="datetime-local"
              name="startTime"
              value={values.startTime}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            {errors.startTime ? (
              <p className="mt-2 text-sm text-rose-600">
                {errors.startTime}
              </p>
            ) : null}
          </label>
        </div>

        {/* Body */}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Body
          </span>

          <textarea
            name="body"
            value={values.body}
            onChange={handleChange}
            rows={6}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Write the campaign message here..."
          />

          {errors.body ? (
            <p className="mt-2 text-sm text-rose-600">
              {errors.body}
            </p>
          ) : null}
        </label>

        {/* Lead upload */}

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Upload email leads
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Upload a CSV or TXT file containing email
              addresses.
            </p>
          </div>

          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={handleFileChange}
            className="mt-4 block w-full text-sm text-slate-600"
          />

          {fileName ? (
            <p className="mt-3 text-sm text-slate-600">
              File:{' '}
              <span className="font-medium text-slate-900">
                {fileName}
              </span>
            </p>
          ) : null}

          {recipients.length > 0 ? (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {recipients.length} unique email
              {recipients.length === 1 ? '' : 's'} detected.
            </p>
          ) : null}

          {fileError ? (
            <p className="mt-2 text-sm text-rose-600">
              {fileError}
            </p>
          ) : null}
        </div>

        {/* Sender */}

        <div>
          <label
            htmlFor="sender"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Sender
          </label>

          <select
            id="sender"
            value={selectedSenderId}
            onChange={(event) => {
              setSelectedSenderId(event.target.value);
              setSenderError(null);
              setSubmitError(null);
            }}
            disabled={isLoadingSenders || senders.length === 0}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {isLoadingSenders
                ? 'Loading senders...'
                : senders.length === 0
                  ? 'No senders available'
                  : 'Select a sender'}
            </option>

            {senders.map((sender) => (
              <option
                key={sender.id}
                value={sender.id}
              >
                {sender.email} — {sender.hourlyLimit}/hour
              </option>
            ))}
          </select>

          {senderError ? (
            <p className="mt-2 text-sm text-rose-600">
              {senderError}
            </p>
          ) : null}
        </div>

        {/* Delay + Hourly limit */}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Delay between emails (ms)
            </span>

            <input
              type="number"
              min="1"
              step="1"
              name="delayMs"
              value={values.delayMs}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            {errors.delayMs ? (
              <p className="mt-2 text-sm text-rose-600">
                {errors.delayMs}
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Hourly limit
            </span>

            <input
              type="number"
              min="1"
              step="1"
              name="hourlyLimit"
              value={values.hourlyLimit}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />

            {errors.hourlyLimit ? (
              <p className="mt-2 text-sm text-rose-600">
                {errors.hourlyLimit}
              </p>
            ) : null}
          </label>
        </div>

        {/* Errors */}

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        {/* Success */}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {/* Submit */}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting
              ? 'Creating campaign...'
              : 'Create campaign'}
          </button>
        </div>
      </form>
    </section>
  );
}