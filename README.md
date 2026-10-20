# NiHi

NiHi is a personal finance tracker for the web. Track your accounts, income, expenses and transfers, then see where the money goes. It works on phones, tablets and desktops.

Built with Next.js (App Router), Tailwind CSS and Supabase (Postgres).

## Features

- **Accounts**: cash, bank, savings, credit card, investment. Each has its own currency and a live balance. Archive accounts you no longer use.
- **Transactions**: expenses, income and transfers between accounts, including transfers between currencies. Add categories, tags and notes. Filter by month, type, account, category, tag or note text.
- **Categories and tags**: start with a default set and edit it however you like.
- **Dashboard**: net worth, this month's income and spending, spending by category, recent activity.
- **Statistics**: month and year views, income vs expense trend for the last 12 months (also shown as a table), and breakdowns by category.
- **Responsive**: a sidebar on desktop, and a bottom tab bar with a quick-add button on mobile.
- **Dark mode**: follows the system setting.

## Getting started

Requires Node.js 20 or later.

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
