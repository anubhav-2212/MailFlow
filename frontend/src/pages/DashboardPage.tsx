import { useAuth } from '../hooks/useAuth';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
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
      ? 'w-14 h-14 text-xl'
      : size === 'md'
      ? 'w-10 h-10 text-sm'
      : 'w-8 h-8 text-xs';

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/10`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-semibold text-white ring-2 ring-white/10`}
    >
      {initials}
    </div>
  );
}

function StatCard({
  label,
  sub,
}: {
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-2 hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all duration-200">
      <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-bold text-white">—</span>
      <span className="text-xs text-white/30">{sub}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard overview page (rendered inside DashboardLayout via <Outlet />)
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent p-6 flex items-center gap-5">
        <UserAvatar avatar={user?.avatar ?? null} name={user?.name ?? ''} size="lg" />
        <div>
          <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-xl font-bold text-white">{user?.name}</h1>
          <p className="text-sm text-white/50 mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* Stat cards */}
      <section aria-label="Summary statistics">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
          At a glance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Campaigns" sub="coming soon" />
          <StatCard label="Scheduled" sub="coming soon" />
          <StatCard label="Sent" sub="coming soon" />
        </div>
      </section>

      {/* Future section placeholders */}
      {(['Campaigns', 'Scheduled Emails', 'Sent Emails'] as const).map((section) => (
        <section key={section} aria-label={section}>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
            {section}
          </h2>
          <div className="rounded-2xl border border-white/8 border-dashed bg-white/[0.02] flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-white/20"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm text-white/25 font-medium">{section} will appear here</p>
          </div>
        </section>
      ))}
    </div>
  );
}
