# reachInbox-Assignment

## Backend worker

The backend now includes a BullMQ email worker at `backend/src/workers/email.worker.ts`.

- Queue: `email-sending`
- Job payload: `{ emailId: string }`
- Concurrency: `EMAIL_WORKER_CONCURRENCY`
- Current behavior: fetch the email record from PostgreSQL and safely transition `SCHEDULED` to `PROCESSING`

Start it from the backend package with `npm run dev:worker` or `npm run start:worker`.
