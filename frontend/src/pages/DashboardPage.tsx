import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

// ---------------------------------------------------------------------------
// Sidebar nav items – structured for future sections
// ---------------------------------------------------------------------------
type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  soon?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M22 3L11 13" /><path d="M22 3L15 21l-4-8-8-4 19-6z" />
      </svg>
    ),
    soon: true,
  },
  {
    id: 'scheduled',
    label: 'Scheduled',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    soon: true,
  },
  {
    id: 'sent',
    label: 'Sent Emails',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
    soon: true,
  },
];

// ---------------------------------------------------------------------------
// Placeholder stat card
// ---------------------------------------------------------------------------
function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-2 hover:border-indigo-500/40 hover:bg-white/8 transition-all duration-200">
      <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-bold text-white">—</span>
      <span className="text-xs text-white/30">{value} · {sub}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar with fallback initials
// ---------------------------------------------------------------------------
function UserAvatar({ avatar, name, size = 'md' }: { avatar: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
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
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-semibold text-white ring-2 ring-white/10`}>
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    // Do NOT call navigate() here.
    // logout() sets user=null in AuthContext; PrivateRoute immediately
    // renders <Navigate to="/login" replace /> on the next render cycle.
    // Calling navigate() after that would update state on an unmounted component.
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-white">

      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/8 bg-white/[0.02] px-4 py-6">

        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white" aria-hidden="true">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">ReachInbox</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => !item.soon && setActiveSection(item.id)}
                disabled={item.soon}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium w-full text-left
                  transition-all duration-150
                  ${isActive
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent'
                  }
                  ${item.soon ? 'cursor-default opacity-50' : ''}
                `}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70 transition-colors'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User panel */}
        <div className="mt-4 rounded-xl border border-white/8 bg-white/4 p-3 flex items-center gap-3">
          <UserAvatar avatar={user?.avatar ?? null} name={user?.name ?? ''} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{user?.name}</p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white" aria-hidden="true">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
            </div>
            <span className="font-bold text-base">ReachInbox</span>
          </div>

          {/* Section title (desktop) */}
          <h1 className="hidden md:block text-base font-semibold text-white/80 capitalize">
            {NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Overview'}
          </h1>

          {/* Right: user + logout */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2.5">
              <UserAvatar avatar={user?.avatar ?? null} name={user?.name ?? ''} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-medium text-white/90">{user?.name}</p>
                <p className="text-xs text-white/40">{user?.email}</p>
              </div>
            </div>

            <button
              id="logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              className="
                flex items-center gap-2 rounded-lg border border-white/10 bg-white/5
                px-3 py-2 text-sm font-medium text-white/70
                hover:text-white hover:bg-white/10 hover:border-white/20
                active:scale-[0.97] transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]
              "
              aria-label="Sign out"
            >
              {loggingOut ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
              <span className="hidden sm:inline">{loggingOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6 space-y-8">

          {/* Welcome banner */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent p-6 flex items-center gap-5">
            <UserAvatar avatar={user?.avatar ?? null} name={user?.name ?? ''} size="lg" />
            <div>
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-widest mb-1">Welcome back</p>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-sm text-white/50 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Stat cards — placeholders for future data */}
          <section aria-label="Summary statistics">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">At a glance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Campaigns" value="Campaigns" sub="coming soon" />
              <StatCard label="Scheduled" value="Scheduled emails" sub="coming soon" />
              <StatCard label="Sent" value="Sent emails" sub="coming soon" />
            </div>
          </section>

          {/* Coming soon sections */}
          {['Campaigns', 'Scheduled Emails', 'Sent Emails'].map((section) => (
            <section key={section} aria-label={section}>
              <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">{section}</h3>
              <div className="rounded-2xl border border-white/8 border-dashed bg-white/[0.02] flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white/20" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-sm text-white/25 font-medium">{section} will appear here</p>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
