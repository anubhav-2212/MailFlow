import { useState } from 'react';
import { createCampaign } from '../../api/campaign.api';
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
  console.log("AUTH USER:", user);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError(null);
    setSuccessMessage(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!user?.id) {
      setSubmitError('You must be signed in to create a campaign.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCampaign({
        userId: user.id,
        subject: values.subject.trim(),
        body: values.body.trim(),
        startTime: new Date(values.startTime).toISOString(),
        delayMs: Number(values.delayMs),
        hourlyLimit: Number(values.hourlyLimit),
      });

      setValues(initialValues);
      setErrors({});
      setSuccessMessage('Campaign created successfully.');

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
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">Create campaign</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set the campaign details and sending schedule. Recipients will be added later.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Subject</span>
            <input
              type="text"
              name="subject"
              value={values.subject}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              placeholder="Quarterly outreach"
            />
            {errors.subject ? (
              <p className="mt-2 text-sm text-rose-600">{errors.subject}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Start time</span>
            <input
              type="datetime-local"
              name="startTime"
              value={values.startTime}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            {errors.startTime ? (
              <p className="mt-2 text-sm text-rose-600">{errors.startTime}</p>
            ) : null}
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Body</span>
          <textarea
            name="body"
            value={values.body}
            onChange={handleChange}
            rows={6}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Write the campaign message here..."
          />
          {errors.body ? <p className="mt-2 text-sm text-rose-600">{errors.body}</p> : null}
        </label>

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
              <p className="mt-2 text-sm text-rose-600">{errors.delayMs}</p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Hourly limit</span>
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
              <p className="mt-2 text-sm text-rose-600">{errors.hourlyLimit}</p>
            ) : null}
          </label>
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Creating campaign...' : 'Create campaign'}
          </button>
        </div>
      </form>
    </section>
  );
}
