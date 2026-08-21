import SenderManager from '../components/senders/SenderManager';

export default function SendersPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Senders
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage the email accounts used by your campaigns.
        </p>
      </div>

      <SenderManager />
    </section>
  );
}