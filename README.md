# NiHi

NiHi is a personal finance tracker for the web. Track your accounts, income, expenses and transfers, then see where the money goes. It works on phones, tablets and desktops.

Built with Next.js (App Router), Tailwind CSS and Supabase (Postgres).

## Features

- **Accounts**: cash, bank, savings, credit card, investment. Each has its own currency and a live balance. Drag to reorder, archive what you no longer use, and fix a balance with a correction entry.
- **Cards**: link Visa, Mastercard or Amex cards to a bank account. Paying with a card reduces that account.
- **Credit cards**: just a limit and a monthly interest rate. Credit and savings are kept out of the home total and shown as small separate sections.
- **Transactions**: expenses, income and transfers (including across currencies), with categories, tags and notes. Filter by month, type, account, category, tag or text. Select several to change category or delete, split one into parts, and undo a delete.
- **Scan a screenshot**: read a bank SMS, bill or ride receipt in the browser (no AI service, nothing uploaded). It fills the form; you always confirm before saving. Possible duplicates are flagged.
- **Budgets**: monthly limit per category with warnings at 80% and 100%.
- **Repeats**: recurring bills and income; due ones are offered to add, never silently added.
- **Goals**: savings goals with progress.
- **Reminders**: payments due soon, a card close to its limit, an unusually high month.
- **Partner access**: share a read-only view with a single-use link that expires after 7 days (optionally emailed).
- **Installable and offline**: works as a home-screen app; entries made offline are sent when you reconnect.
- **English and Sinhala**: switch in settings.
- **Responsive**: sidebar on desktop, bottom tab bar with quick-add on mobile.

## Getting started

Requires Node.js 22 (Node 20 works for the app; CI uses 22).

```bash
npm install
cp .env.example .env        # then set SUPABASE_URL, SUPABASE_SECRET_KEY and SESSION_SECRET (openssl rand -base64 32)
npx supabase link --project-ref <project-ref>
npx supabase db push        # creates the tables from supabase/migrations
ALLOW_DEMO_SEED=1 npm run db:seed   # optional, local only: demo account with a year of sample data
npm run dev
```

Open http://localhost:3000. If you seeded the demo account, the login is printed by the seed script (see `scripts/seed.ts`). Local development and production share a database, so the live site refuses the demo account (`src/lib/demo.ts`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production |
| `npm start` | Run the production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm test` | Unit tests: money-moving actions, recurring, partner access, scan parsing |
| `ALLOW_DEMO_SEED=1 npm run db:seed` | Reset and fill the demo account (local only) |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the linked project |

## Project layout

```
scripts/seed.ts      demo seed
supabase/migrations/ SQL migrations: tables and the SQL functions behind the reports
src/actions/         Server Actions (auth, accounts, transactions, labels, settings)
src/app/(auth)/      login and signup
src/app/(app)/       signed-in pages: dashboard, transactions, accounts, categories, tags, statistics, settings
src/components/      UI building blocks, app shell, finance widgets
src/lib/             database client, session, queries, money and date helpers
```

Notes:

- Amounts are stored as integers in minor units (cents). Transaction dates are calendar days, stored at 12:00 UTC.
- Sessions are signed JWTs kept in an httpOnly cookie. Every Server Action checks the session again before it touches data.
- The app uses Next.js Cache Components. Pages render a static shell right away and stream in user data behind `<Suspense>`.

## Database migrations

The schema lives in `supabase/migrations`. To change it:

1. Run `npx supabase migration new <name>` and write the SQL in the new file.
2. Apply it with `npx supabase db push`.
3. Run `npm run db:types` so the TypeScript types match.

## Deploying

Any host that runs Node works, including Vercel. Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `SESSION_SECRET`, then run `npm run build && npm start`. To email partner invites automatically, also set `SMTP_USER` and `SMTP_PASSWORD` (for Gmail, an app password; see `.env.example`); without them the invite page offers a copy link and a Send via Gmail button. Apply new migrations with `npx supabase db push` before you deploy.

The app reads and writes through supabase-js on the server only, with the secret key. Every table has row level security turned on with no policies, and the SQL functions can only be called with the secret key, so the publishable (anon) key cannot read anything. Every query filters by the signed-in user.

## License

MIT. See [LICENSE](LICENSE). NiHi started as a fork of [ezBookkeeping](https://github.com/mayswind/ezbookkeeping) by MaysWind and has since been rewritten from scratch.

## Environment variables

| Name | Needed | Purpose |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | yes | Database (server-side only) |
| `SESSION_SECRET` | yes | Signs session cookies |
| `SMTP_USER`, `SMTP_PASSWORD` | no | Email partner invites (Gmail needs an app password) |
| `ERROR_WEBHOOK_URL` | no | Receives server errors as JSON; otherwise they only go to the log |
| `ALLOW_DEMO_SEED` | local only | Lets `db:seed` create the demo user |

## Database migrations

Apply every file in `supabase/migrations` in order (`npx supabase db push`, or paste them in the Supabase SQL editor). Each ends with `notify pgrst, 'reload schema'`. A "column does not exist" error means one is missing.

## Quality and security

- CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and build.
- Security headers are set in `next.config.ts`. The Content-Security-Policy is report-only for now; reports go to `/api/csp-report`.
- Server errors are logged and optionally posted to `ERROR_WEBHOOK_URL` (`instrumentation.ts`).
- Real-device checks are listed in `docs/phone-checklist.md`.
