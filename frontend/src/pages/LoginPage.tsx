import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

/** Official Google "G" logo colours as an inline SVG — no icon library needed. */
function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="w-5 h-5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  function handleLogin() {
    setRedirecting(true);
    login(); // redirects browser; state remains true until navigation completes
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">

      {/* Subtle radial glow behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl px-8 py-10 flex flex-col items-center gap-8">

        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            {/* Simple inbox/mail icon built with SVG — no library */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-white"
              aria-hidden="true"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ReachInbox
            </h1>
            <p className="mt-1 text-sm text-white/50 font-medium tracking-wide uppercase">
              Email Outreach Platform
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-white/10" />

        {/* Copy */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-white/90">
            Welcome back
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Sign in to manage your email campaigns,<br />
            track engagement, and grow your reach.
          </p>
        </div>

        {/* Google OAuth button */}
        <button
          id="google-login-btn"
          onClick={handleLogin}
          disabled={redirecting}
          className="
            group relative w-full flex items-center justify-center gap-3
            rounded-xl border border-white/15 bg-white/10
            px-5 py-3 text-sm font-medium text-white
            transition-all duration-200
            hover:bg-white/15 hover:border-white/25 hover:shadow-lg hover:shadow-indigo-500/10
            active:scale-[0.98]
            disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]
          "
          aria-label="Continue with Google"
        >
          {redirecting ? (
            /* Spinner */
            <svg
              className="h-5 w-5 animate-spin text-white/70"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <GoogleIcon />
          )}
          <span>
            {redirecting ? 'Redirecting…' : 'Continue with Google'}
          </span>
        </button>

        {/* Footer note */}
        <p className="text-center text-xs text-white/30 leading-relaxed">
          By continuing you agree to our{' '}
          <span className="text-white/50 underline underline-offset-2 cursor-pointer hover:text-white/80 transition-colors">
            Terms of Service
          </span>{' '}
          and{' '}
          <span className="text-white/50 underline underline-offset-2 cursor-pointer hover:text-white/80 transition-colors">
            Privacy Policy
          </span>.
        </p>
      </div>
    </div>
  );
}
