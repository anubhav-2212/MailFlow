🚀 ReachInbox — Full-Stack Email Job Scheduler

A production-oriented full-stack email scheduling system built for the ReachInbox Software Development Intern Assignment.

Core idea: persist email state in PostgreSQL, schedule delivery with BullMQ delayed jobs backed by Redis, enforce distributed sending limits in Redis, and deliver emails through Ethereal SMTP — without cron jobs.

✨ What This Project Does

ReachInbox lets an authenticated user:

Sign in with real Google OAuth

Create and manage email campaigns

Configure campaign start time, delay, and hourly limit

Select an email sender

Add recipients manually or through the frontend recipient workflow

Schedule individual email jobs

View scheduled emails

View sent and failed emails

Process jobs asynchronously through BullMQ workers

Enforce minimum delay between actual sends

Enforce Redis-backed hourly rate limiting

Reschedule rate-limited emails instead of dropping them

Survive API/worker restarts without rebuilding future jobs

Prevent duplicate processing through persistent email state transitions

🏗️ Architecture

                         ┌─────────────────────┐
                         │      React UI       │
                         │                     │
                         │ Google Login        │
                         │ Campaign Creation   │
                         │ Scheduled Emails    │
                         │ Sent Emails         │
                         └──────────┬──────────┘
                                    │
                                    │ HTTP + HTTP-only Cookie
                                    ▼
                         ┌─────────────────────┐
                         │    Express API      │
                         │                     │
                         │ Auth                │
                         │ Campaigns           │
                         │ Senders             │
                         │ Campaign Emails     │
                         └──────┬────────┬─────┘
                                │        │
                         PostgreSQL      │ BullMQ / Redis
                                │        │
                                ▼        ▼
                         ┌──────────┐  ┌──────────────┐
                         │Postgres  │  │    Redis     │
                         │          │  │              │
                         │ Users    │  │ Delayed Jobs │
                         │ Senders  │  │ Rate Limits  │
                         │ Campaign │  │ Send Throttle│
                         │ Emails   │  │ Locks        │
                         └──────────┘  └──────┬───────┘
                                              │
                                              ▼
                                      ┌────────────────┐
                                      │ BullMQ Worker  │
                                      │                │
                                      │ Concurrency    │
                                      │ State Claim    │
                                      │ Rate Limit     │
                                      │ Send Throttle  │
                                      │ SMTP           │
                                      └───────┬────────┘
                                              │
                                              ▼
                                      ┌────────────────┐
                                      │ Ethereal SMTP  │
                                      └────────────────┘

🧰 Tech Stack

Backend

TypeScript

Node.js

Express.js

Prisma

PostgreSQL

BullMQ

Redis

ioredis

Nodemailer

Ethereal Email

Passport.js

Google OAuth 2.0

JWT

Zod

Frontend

React

TypeScript

Tailwind CSS

Axios

React Router

Infrastructure

Docker

Docker Compose

PostgreSQL 16

Redis 7

📁 Project Structure

ReachInbox-Assignment/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── auth.ts
│   │   │   ├── passport.ts
│   │   │   ├── prisma.ts
│   │   │   └── redis.ts
│   │   │
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   ├── queue/
│   │   │   ├── email.queues.ts
│   │   │   └── queues.types.ts
│   │   ├── services/
│   │   │   ├── campaign.service.ts
│   │   │   └── email/
│   │   │       ├── email-processing.service.ts
│   │   │       ├── email-rate-limit.service.ts
│   │   │       ├── email-repository.ts
│   │   │       ├── email-throttle.service.ts
│   │   │       └── smtp.service.ts
│   │   ├── workers/
│   │   │   └── email.worker.ts
│   │   └── server.ts
│   │
│   ├── docker-compose.yml
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    └── ...

🔐 Authentication

The application uses real Google OAuth 2.0.

Flow:

User
 ↓
GET /api/v1/auth/google
 ↓
Google OAuth
 ↓
Google callback
 ↓
Find/Create User in PostgreSQL
 ↓
Generate JWT
 ↓
HTTP-only auth cookie
 ↓
Redirect to /dashboard

The backend also provides:

GET  /api/v1/auth/me
POST /api/v1/auth/logout

Authentication is enforced using the requireAuth middleware.

The middleware reads the JWT from the HTTP-only auth_token cookie, verifies it, and attaches the authenticated user's ID to req.userId.

👤 User Scoping

All user-owned resources are scoped to the authenticated user.

The frontend does not decide ownership.

Browser
   ↓
HTTP-only JWT cookie
   ↓
Authentication middleware
   ↓
req.userId
   ↓
Controller
   ↓
Service
   ↓
PostgreSQL ownership filter

Examples:

getCampaigns(req.userId)
getScheduledEmails(req.userId)
getSentEmails(req.userId)

Campaign and sender ownership is also validated before campaign emails are created.

This prevents one authenticated user from accessing another user's campaign/email data.

📊 Database Design

PostgreSQL is the durable source of truth.

User

User
├── id
├── googleId
├── email
├── name
├── avatar
├── campaigns[]
└── senders[]

Sender

Sender
├── id
├── userId
├── email
├── etherealUser
├── etherealPassword
└── hourlyLimit

Campaign

Campaign
├── id
├── userId
├── subject
├── body
├── startTime
├── delayMs
├── hourlyLimit
└── status

Email

Email
├── id
├── campaignId
├── senderId
├── recipient
├── subject
├── body
├── scheduledAt
├── sentAt
├── status
├── attempts
├── error
└── sequenceNumber

Email states:

SCHEDULED
    ↓
PROCESSING
    ↓
SENT

or

PROCESSING
    ↓
FAILED

⏱️ Scheduling

The project does not use cron jobs.

Scheduling is performed using BullMQ delayed jobs.

When recipients are created, each recipient becomes an individual database record.

The scheduled time is calculated from:

scheduledAt =
    campaign.startTime
    +
    sequenceNumber × campaign.delayMs

For example, with:

Start time: 10:00:00
Delay:      2000 ms

five recipients become:

Email 1 → 10:00:00
Email 2 → 10:00:02
Email 3 → 10:00:04
Email 4 → 10:00:06
Email 5 → 10:00:08

Each email is then added to BullMQ as a delayed job.

Each email uses a deterministic queue identity:

email-<emailId>

🔄 Persistence & Restart Behavior

A major requirement of the assignment is that future emails must survive application restarts.

The system separates persistent application state from runtime execution:

PostgreSQL
    ↓
Persistent Email Record

Redis / BullMQ
    ↓
Persistent Delayed Job

Worker
    ↓
Processes Job When Due

If the API or worker process stops:

API/Worker stopped
      ↓
PostgreSQL remains intact
      ↓
Redis/BullMQ remains intact
      ↓
Process starts again
      ↓
Worker reconnects
      ↓
Existing delayed jobs continue

No cron job or in-memory scheduler is required.

⚡ BullMQ Worker

The worker runs independently from the Express API.

Development:

npm run dev:worker

Production:

npm run start:worker

The worker reads:

EMAIL_WORKER_CONCURRENCY=3

and configures BullMQ accordingly.

With EMAIL_WORKER_CONCURRENCY=3, up to three BullMQ jobs can be processed concurrently.

Concurrency is configurable rather than hardcoded.

🛡️ Idempotency & Duplicate Protection

The system protects email sending from duplicate processing.

1. Deterministic BullMQ job ID

Jobs use:

jobId: `email-${emailId}`

The same email therefore has a stable queue identity.

2. Atomic email state transition

Before sending, the worker attempts:

SCHEDULED → PROCESSING

using an atomic database update.

If another worker already claimed the email, the update affects zero records.

The worker then exits without sending.

Worker A
   ↓
SCHEDULED → PROCESSING
   ↓
SEND

Worker B
   ↓
tries SCHEDULED → PROCESSING
   ↓
0 rows updated
   ↓
DO NOT SEND

This is important when worker concurrency is greater than one or multiple worker processes are running.

🚦 Hourly Rate Limiting

The scheduler uses a Redis-backed hourly counter.

The counter is scoped by sender and UTC hour:

email:rate-limit:<senderId>:<UTC-hour>

Redis INCR provides an atomic counter.

Conceptually:

Sender A
   │
   ├── Hour 10 → 73 emails
   ├── Hour 11 → 200 emails
   └── Hour 12 → 12 emails

Because the counter is stored in Redis, it is not dependent on one Node.js process's memory.

This makes the rate-limit mechanism safe across multiple worker processes/instances.

🎯 Campaign Hourly Limit

The user can configure an hourly limit from the frontend.

Example:

Hourly limit = 200

The frontend sends the value to the backend.

The backend stores the campaign configuration in PostgreSQL.

The actual enforcement happens on the backend/worker side.

This is intentional:

Frontend controls configuration; backend controls enforcement.

A client-side counter alone would not be secure because a user could modify the request.

React
  ↓
hourlyLimit: 200
  ↓
Express
  ↓
PostgreSQL Campaign
  ↓
BullMQ Worker
  ↓
Redis-backed rate limiting

🔁 Rate Limit Rescheduling

When the sender reaches the hourly limit, the email is not dropped and is not permanently failed.

PROCESSING
    ↓
Hourly limit reached
    ↓
PROCESSING → SCHEDULED
    ↓
Calculate next available hour
    ↓
Create a new BullMQ delayed job
    ↓
Process later

The job is therefore preserved.

This satisfies the assignment requirement that rate-limited jobs be delayed/rescheduled rather than discarded.

⏳ Minimum Delay Between Actual Sends

The system also has a Redis-backed distributed send throttle.

Configured with:

EMAIL_MIN_DELAY_MS=2000

This means the system maintains a minimum two-second delay between actual email sends.

The throttle uses:

Redis lock

Redis last-send timestamp

Distributed locking

Configurable delay

Worker A ─┐
Worker B ─┼──→ Redis lock
Worker C ─┘        │
                   ▼
             Check last send
                   │
                   ▼
             Wait if necessary
                   │
                   ▼
                Send
                   │
                   ▼
          Update last-send time

This prevents concurrent workers from bypassing the minimum send interval.

🧠 Why Both Delay and Hourly Limit Exist

These are two different controls.

Minimum delay

EMAIL_MIN_DELAY_MS=2000

Controls:

How close two actual sends can be.

Hourly limit

Campaign hourlyLimit = 200

Controls:

How many emails a sender/campaign can send within an hour.

Therefore a campaign can be configured as:

Delay:        2 seconds
Hourly limit: 200

and the worker enforces both.

📈 Behavior Under Load

For 1000+ emails scheduled around the same time:

1000 Email records
        ↓
1000 BullMQ jobs
        ↓
Worker concurrency
        ↓
Redis send throttle
        ↓
Redis hourly rate limit
        ↓
Excess jobs rescheduled

The system does not attempt to send all 1000 emails simultaneously.

The queue absorbs scheduling volume while the worker and Redis enforce sending constraints.

📬 Ethereal SMTP

Nodemailer is used to send mail through Ethereal.

Configuration:

ETHEREAL_SMTP_HOST=smtp.ethereal.email
ETHEREAL_SMTP_PORT=587
ETHEREAL_SMTP_USER=<ETHEREAL_USER>
ETHEREAL_SMTP_PASSWORD=<ETHEREAL_PASSWORD>

The worker sends:

from
to
subject
text

The returned message ID and Ethereal preview URL are logged for testing.

Ethereal is intentionally used because this assignment requires fake SMTP rather than real email delivery.

🌐 API Endpoints

Authentication

GET  /api/v1/auth/google
GET  /api/v1/auth/google/callback
GET  /api/v1/auth/me
POST /api/v1/auth/logout

Campaigns

POST /api/v1/campaigns
GET  /api/v1/campaigns
GET  /api/v1/campaigns/:campaignId

Senders

GET  /api/v1/sender
POST /api/v1/sender

Campaign Emails

POST /api/v1/email-campaign/:campaignId/emails
GET  /api/v1/email-campaign/scheduled
GET  /api/v1/email-campaign/sent

🎨 Frontend

The frontend provides:

Authentication

Google login

Authenticated dashboard

User name

User email

User avatar

Logout

Campaign

Subject

Body

Start time

Delay

Hourly limit

Sender selection

Recipient input

Recipient upload workflow

Scheduled Emails

Displays:

Recipient

Subject

Scheduled time

Status

Loading state

Empty state

Error state

Retry action

Sent Emails

Displays:

Recipient

Subject

Sent time

Status

Loading state

Empty state

Error handling

🐳 Docker Infrastructure

Docker Compose runs PostgreSQL and Redis.

services:
  postgres:
    image: postgres:16-alpine

  redis:
    image: redis:7-alpine

Both services use persistent Docker volumes.

PostgreSQL:

localhost:5432

Redis:

localhost:6379

🚀 Local Setup

Prerequisites

Install:

Node.js

npm

Docker Desktop

Git

1. Clone the repository

git clone <YOUR_PRIVATE_REPOSITORY_URL>
cd ReachInbox-Assignment

2. Start PostgreSQL and Redis

cd backend
docker compose up -d

Verify:

docker compose ps

You should see:

reachinbox-postgres
reachinbox-redis

3. Install backend dependencies

npm install

4. Configure backend environment

Create:

backend/.env

Use:

NODE_ENV=development

PORT=8000
FRONTEND_URL=http://localhost:5173

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox"

REDIS_HOST=localhost
REDIS_PORT=6379

EMAIL_WORKER_CONCURRENCY=3
EMAIL_MIN_DELAY_MS=2000
EMAIL_MAX_PER_HOUR=200

ETHEREAL_SMTP_HOST=smtp.ethereal.email
ETHEREAL_SMTP_PORT=587
ETHEREAL_SMTP_USER=<ETHEREAL_USER>
ETHEREAL_SMTP_PASSWORD=<ETHEREAL_PASSWORD>

GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET>
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

JWT_SECRET=<STRONG_RANDOM_SECRET>

Never commit real credentials.

5. Generate Prisma client

npm run db:generate

6. Run database migration

npm run db:migrate

Optional seed:

npm run db:seed

7. Start API server

npm run dev

Backend:

http://localhost:8000

8. Start BullMQ worker

Open another terminal:

cd backend
npm run dev:worker

The worker should report that it has booted and is ready.

9. Start frontend

Open another terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173

📜 Backend Scripts

npm run dev
npm run dev:worker
npm run build
npm start
npm run start:worker
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:seed

🧪 Testing

Create a campaign

Login with Google.

Open the dashboard.

Create a campaign.

Enter subject and body.

Select a sender.

Add recipients.

Choose a future start time.

Set delay.

Set hourly limit.

Schedule.

Verify scheduled emails

Open Scheduled Emails.

Each recipient should appear as an individual scheduled email.

Verify worker processing

Watch:

npm run dev:worker

The worker should show lifecycle events similar to:

job_started
email_marked_processing
email_sent
job_completed

Verify Ethereal

After an email is sent, use the Ethereal preview URL printed by the worker to inspect the generated message.

🔄 Restart Persistence Test

This is an important assignment demonstration.

Step 1

Schedule an email a few minutes in the future.

Step 2

Stop the worker:

Ctrl + C

Optionally stop the API as well.

Step 3

Restart:

npm run dev

and in another terminal:

npm run dev:worker

Step 4

Wait until the scheduled time.

The delayed BullMQ job should still exist in Redis and the worker should process it.

No cron job is involved.

🧪 Rate Limit Test

For a quick demonstration, temporarily set:

EMAIL_MAX_PER_HOUR=2

Create a campaign containing multiple recipients.

Expected behavior:

Email 1 → SENT
Email 2 → SENT
Email 3 → RESCHEDULED
Email 4 → RESCHEDULED
...

The worker should log rate-limit and rescheduling events.

After testing, restore:

EMAIL_MAX_PER_HOUR=200

Restart the worker after changing environment variables.

🧪 Delay Test

Use:

EMAIL_MIN_DELAY_MS=2000

For a campaign with several recipients, the database scheduling logic creates the intended spacing between scheduled jobs, while the Redis-backed throttle guarantees a minimum two-second gap between actual sends.

🔒 Security Notes

The following are secrets and must never be committed:

JWT_SECRET
GOOGLE_CLIENT_SECRET
ETHEREAL_SMTP_PASSWORD

Authentication uses an HTTP-only cookie so the JWT is not directly exposed to frontend JavaScript.

Resource ownership is checked server-side.

⚙️ Environment Variables

Variable

Purpose

Example

NODE_ENV

Runtime environment

development

PORT

Express port

8000

FRONTEND_URL

Frontend origin

http://localhost:5173

DATABASE_URL

PostgreSQL connection

local PostgreSQL URL

REDIS_HOST

Redis host

localhost

REDIS_PORT

Redis port

6379

EMAIL_WORKER_CONCURRENCY

BullMQ concurrency

3

EMAIL_MIN_DELAY_MS

Minimum actual send delay

2000

EMAIL_MAX_PER_HOUR

Rate-limit configuration/fallback

200

ETHEREAL_SMTP_HOST

SMTP host

smtp.ethereal.email

ETHEREAL_SMTP_PORT

SMTP port

587

ETHEREAL_SMTP_USER

Ethereal username

secret

ETHEREAL_SMTP_PASSWORD

Ethereal password

secret

GOOGLE_CLIENT_ID

Google OAuth client

secret

GOOGLE_CLIENT_SECRET

Google OAuth secret

secret

GOOGLE_CALLBACK_URL

Google callback

localhost URL

JWT_SECRET

JWT signing secret

secret

🧩 Design Decisions

Why BullMQ?

BullMQ provides:

Delayed jobs

Persistent queue state through Redis

Retry support

Job IDs

Worker concurrency

Clean Node.js integration

It directly satisfies the assignment requirement to avoid cron.

Why PostgreSQL?

PostgreSQL stores durable business/application state:

Users
Senders
Campaigns
Emails
Statuses
Scheduling metadata

Why Redis?

Redis provides:

BullMQ persistence
+
Hourly counters
+
Distributed send throttle
+
Distributed locks

Why separate API and worker?

The API remains responsive while email jobs are processed asynchronously.

API
 ↓
Persist
 ↓
Queue
 ↓
Return response

Worker
 ↓
Process asynchronously
 ↓
Send
 ↓
Update database

📈 Load Handling

For 1000+ emails scheduled around the same time:

1000 Email records
        ↓
1000 BullMQ jobs
        ↓
Worker concurrency
        ↓
Redis send throttle
        ↓
Redis hourly rate limit
        ↓
Excess jobs rescheduled

The system does not attempt to send all 1000 emails simultaneously.

The queue absorbs scheduling volume while the worker and Redis enforce sending constraints.

📋 Assignment Compliance

Requirement

Status

TypeScript backend

✅

Express.js

✅

PostgreSQL

✅

BullMQ

✅

Redis

✅

Ethereal SMTP

✅

Delayed jobs

✅

No cron

✅

Persistent jobs

✅

Worker concurrency

✅ Configurable

Minimum delay

✅ Redis-backed

Hourly rate limiting

✅ Redis-backed

Multiple senders

✅

Rate-limit rescheduling

✅

Duplicate protection

✅

Google OAuth

✅

JWT authentication

✅

User-scoped data

✅

Dashboard

✅

Campaign scheduling

✅

Scheduled emails

✅

Sent/failed emails

✅

Loading states

✅

Empty states

✅

Error handling

✅

🎥 Recommended 5-Minute Demo

1. Google Login

Show the real OAuth flow and dashboard.

2. Create Campaign

Show:

Subject
Body
Sender
Recipients
Start Time
Delay
Hourly Limit

3. Scheduled Emails

Show scheduled recipients and status.

4. Worker

Show:

job_started
email_marked_processing
email_sent
job_completed

5. Ethereal

Open an Ethereal preview URL.

6. Sent Emails

Show the email as SENT.

7. Restart Persistence

Schedule a future email, stop the worker, restart it, and show that the job continues without recreating the campaign.

8. Optional Rate-Limit Demo

Temporarily use:

EMAIL_MAX_PER_HOUR=2

and show excess emails being rescheduled.

🐳 Useful Docker Commands

docker compose up -d
docker compose down
docker compose ps
docker compose logs -f
docker compose restart

🧹 Pre-Submission Checklist

Run:

npx tsc --noEmit

Verify infrastructure:

docker compose ps

Verify API:

npm run dev

Verify worker:

npm run dev:worker

Verify frontend:

npm run dev

Check Git:

git status

Make sure these are NOT committed:

.env
node_modules/
dist/

Then:

git add .
git commit -m "complete ReachInbox email scheduler assignment"
git push origin main

👥 Repository Access

The assignment asks for a private GitHub repository.

Grant access to:

Mitrajit
Yadav036

🏁 Final Summary

The project follows a clear separation of responsibilities:

React
  ↓
Express API
  ↓
PostgreSQL
  +
BullMQ / Redis
  ↓
Worker
  ↓
Redis Rate Limiter
  +
Redis Send Throttle
  ↓
Ethereal SMTP

The key design principles are:

PostgreSQL for durable application state

BullMQ + Redis for persistent delayed scheduling

Redis for distributed rate limiting

Redis for distributed send throttling

Atomic database state transitions for duplicate protection

Separate API and worker processes

Server-side ownership and enforcement

No cron jobs

Configurable concurrency and sending constraints

Built for the ReachInbox Software Development Intern Assignment.

Persistent jobs. Safe concurrency. Distributed rate limiting. Idempotent processing. No cron.
