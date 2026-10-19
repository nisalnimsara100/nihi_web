# NiHi

NiHi is a personal finance tracker for the web. Track your accounts, income, expenses and transfers, then see where the money goes. It works on phones, tablets and desktops.

Built with Next.js (App Router), Tailwind CSS, Prisma and SQLite.

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
npm install                 # also generates the Prisma client
cp .env.example .env        # then set SESSION_SECRET (openssl rand -base64 32)
npx prisma migrate dev      # creates the SQLite database
npm run db:seed             # optional: demo account with a year of sample data
npm run dev
```

Open http://localhost:3000. The demo login is printed by the seed script (see `prisma/seed.ts`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Apply migrations and build for production |
| `npm start` | Run the production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:migrate` | Create and apply a migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Reset and fill the demo account |
| `npm run db:studio` | Browse the database in Prisma Studio |

## Project layout

```
prisma/              schema, migrations, demo seed
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

## Deploying

Any host that runs Node works. Set `DATABASE_URL` and `SESSION_SECRET`, then run `npm run build && npm start`.

SQLite needs a persistent disk. On serverless hosts such as Vercel, switch to Postgres instead: change `provider` in `prisma/schema.prisma`, swap `@prisma/adapter-better-sqlite3` for `@prisma/adapter-pg` in `src/lib/db.ts`, and recreate the migrations.

## License

MIT. See [LICENSE](LICENSE). NiHi started as a fork of [ezBookkeeping](https://github.com/mayswind/ezbookkeeping) by MaysWind and has since been rewritten from scratch.
