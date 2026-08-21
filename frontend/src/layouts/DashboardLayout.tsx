import { NavLink, Outlet } from 'react-router-dom';
import DashboardHeader from '../components/dashboard/DashboardHeader';

type NavigationItem = {
  to: string;
  label: string;
  end?: boolean;
};

const navigationItems: NavigationItem[] = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/campaigns', label: 'Campaigns' },
  { to: '/dashboard/scheduled', label: 'Scheduled' },
  { to: '/dashboard/sent', label: 'Sent' },
];

function getNavLinkClass(isActive: boolean) {
  return [
    'rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
    isActive
      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');
}

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row md:p-4">
        <aside className="border-b border-slate-200 bg-white px-4 py-5 md:w-72 md:shrink-0 md:rounded-3xl md:border md:px-5 md:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
              RI
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ReachInbox</p>
              <p className="text-sm text-slate-500">Application workspace</p>
            </div>
          </div>

          <nav className="mt-6 flex gap-2 overflow-x-auto md:flex-col" aria-label="Dashboard navigation">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:pl-4">
          <div className="min-h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex min-h-full flex-col gap-6">
              <DashboardHeader />
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
