# Taze Creative Attendance Dashboard

Production-ready attendance and leave management dashboard for a small team of about 7 employees. The project uses Next.js App Router, Prisma, PostgreSQL, Google OAuth, and Tailwind CSS, with clear admin and employee experiences.

## Features

- Secure Google sign-in using `next-auth`
- Pre-approved email allowlist using the `User` table
- Role-based routing for admins and employees
- Daily attendance with check-in and check-out timestamps
- Late mark logic using configurable threshold
- Auto-absent treatment for past working days without check-in or approved leave
- Leave management with overlap prevention and approval workflow
- Admin tools for employee management, role assignment, manual attendance, manual leave assignment, and CSV export
- Calendar view, analytics cards, loading UI, dark mode, and toast notifications

## Tech Stack

- Frontend and backend: Next.js 15 App Router
- Authentication: Google OAuth via `next-auth`
- Database: PostgreSQL
- ORM: Prisma
- Styling: Tailwind CSS
- Notifications: Sonner

## Folder Structure

```text
app/
  (auth)/sign-in/          Sign-in page
  (dashboard)/admin/       Admin dashboard
  (dashboard)/employee/    Employee dashboard
  api/auth/[...nextauth]/  Auth route handler
  api/export/attendance/   CSV export endpoint
components/
  dashboard/               Layout, stats, calendar UI
  forms/                   Interactive server-action forms
  providers/               Session, theme, toast providers
  ui/                      Shared UI primitives
lib/
  actions.ts               Server actions
  attendance.ts            Attendance and leave logic
  auth.ts                  NextAuth config and guards
  prisma.ts                Prisma client singleton
  time.ts                  Team timezone and date helpers
prisma/
  schema.prisma            Database schema
  seed.ts                  Seed data for 7 employees
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taze_creative"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
APP_TIMEZONE="Asia/Kolkata"
LATE_MARK_AFTER="09:45"
```

## Google OAuth Setup

1. Create a Google Cloud project.
2. Configure the OAuth consent screen.
3. Create OAuth 2.0 credentials.
4. Add these redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`
5. Add the generated client ID and secret to `.env`.

Important:

- Only users already present in the `User` table and marked `isActive = true` can log in.
- Admins can add new approved emails from the admin dashboard.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run prisma:generate
```

3. Create the database schema:

```bash
npm run db:push
```

4. Seed the 7 sample employees:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

## Seeded Employees

- `raghav@tazecreative.com` - Admin
- `aisha@tazecreative.com` - Admin
- `neha@tazecreative.com` - Employee
- `arjun@tazecreative.com` - Employee
- `simran@tazecreative.com` - Employee
- `kabir@tazecreative.com` - Employee
- `ira@tazecreative.com` - Employee

These are allowlisted examples. They still need matching Google accounts during sign-in.

## Deployment

### Vercel

1. Create a managed PostgreSQL database such as Neon, Supabase, or RDS.
2. Import the repository into Vercel.
3. Set all environment variables from `.env.example`.
4. Run `npm run db:push` and `npm run db:seed` once against the production database.
5. Update Google OAuth redirect URI to:

```text
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

### AWS or DigitalOcean

1. Provision a Node.js host and PostgreSQL database.
2. Set environment variables securely in the server environment.
3. Run:

```bash
npm install
npm run prisma:generate
npm run db:push
npm run build
npm run start
```

4. Put the app behind Nginx or a load balancer.
5. Use HTTPS so Google OAuth callbacks are accepted.

## Security Notes

- No public self-signup path exists.
- Access is blocked if the Google email is not pre-approved in the database.
- Role checks are enforced at the page level and through protected routes.
- Sensitive credentials are loaded only from environment variables.

## Production Enhancements You Can Add Next

- Scheduled daily reconciliation job to persist absent rows
- Email notifications using Resend, SES, or SendGrid
- More granular leave balance policy rules
- Audit logs for admin actions
- S3 or blob storage for downloadable monthly reports

## Notes

The workspace where this was generated did not have Node.js or npm installed, so the codebase was assembled carefully but not executed locally in this environment. After installing Node.js, run the setup commands above to generate Prisma artifacts and validate the build.
