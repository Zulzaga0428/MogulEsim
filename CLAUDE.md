# Хязгааргүй eSIM

Mongolian travel eSIM store, started 2026-10-01 as a history-free copy of
GoTravel (github.com/Zulzaga0428/Travel, commit 7d84028), which itself began as
a copy of AVA eSIM. GoTravel keeps running separately; nothing here is shared
with it — own Neon, own Railway project, own QPay merchant. Where this file
says "GoTravel" or "Travel" below, read it as the template this was copied
from. Customers pay in MNT through QPay; the eSIM itself is
bought from Airalo and delivered as a QR code.

This repo was generated on Replit and has since moved off it entirely. There is
no `.replit`, no Replit plugins, and nothing reads `REPL_ID` or
`REPLIT_DOMAINS` — Railway is the only deployment target.

## Layout

pnpm workspace monorepo, TypeScript throughout.

| Package | What it is |
|---|---|
| `artifacts/api-server` | Express 5 API. Routes in `src/routes`, integrations in `src/lib` |
| `artifacts/esim-store` | React + Vite + Tailwind storefront, `wouter` routing |
| `lib/db` | Drizzle schema + pool. Exports `db`, `ordersTable`, `usersTable`, `heroSlidesTable` |
| `lib/api-spec` | OpenAPI spec + Orval config; generates the two packages below |
| `lib/api-zod` | Generated Zod schemas |
| `lib/api-client-react` | Generated React Query hooks |
| `scripts` | Utility scripts, run via `pnpm --filter @workspace/scripts run <name>` |

External services: **Airalo** (eSIM supply), **QPay v2** (payment),
**Cloudflare Images** (hero slides), **OpenAI** (support chat). Accounts are our own.

## Commands

```bash
pnpm install

pnpm run typecheck:libs                              # tsc --build, project references
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/esim-store run typecheck
pnpm --filter @workspace/api-server run build        # esbuild -> dist/index.cjs
pnpm --filter @workspace/esim-store run build        # vite -> dist/public

pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/esim-store run dev
```

Typecheck from the root first. Every package sets `composite: true` and the root
`tsconfig.json` lists them as references, so a package typechecked on its own
fails until its dependencies have emitted their `.d.ts` files.

### Building on Windows

pnpm does not always fetch the platform-specific optional binaries, and the
failure looks like a code error ("Cannot find native binding"). It is not:

```bash
pnpm add -w -D @rollup/rollup-win32-x64-msvc lightningcss-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc
```

**Do not commit those** — they are Windows-only and Railway builds on Linux.
`git checkout -- package.json pnpm-lock.yaml` once the build has been verified.

## Database

Drizzle against PostgreSQL, connection from `NEON_DATABASE_URL` (falls back to
`DATABASE_URL`).

**Migrations are manual.** Nothing in the Railway build applies schema changes.
After editing `lib/db/src/schema`, run it yourself against the target database:

```bash
pnpm --filter @workspace/db run push
```

A Replit hook used to attempt this and was silently broken — it filtered on the
package name `db` when the package is `@workspace/db`, so it never matched.
Assume no schema change has ever been applied automatically.

## Pricing

Retail prices are computed on the server. The client sends a price for display
only; `/qpay/create` recomputes it and charges its own number.

The formula lives in `artifacts/api-server/src/routes/countries.ts`:

```
net_usd × 3450 (USD_TO_MNT) × 1.85 (MARKUP), rounded to the nearest 500
```

`PRICE_OVERRIDES` sets manual flat prices per country slug and validity, applied
to unlimited packages only. Every override is checked against a cost floor
(`OVERRIDE_MIN_MARGIN`, 1.1×): if the flat price would not clear 10% over the
Airalo cost, the formula price is used instead. Roughly 50 country/validity
combinations sit below that floor — Canada, Dubai, Nepal, Saudi Arabia,
Kazakhstan among them — and stay on the formula by design. The advertised flat
Asia/Europe pricing does not reach them.

When Airalo answers, prices come from its live `net_price`. When it does not,
the hardcoded `PACKAGES` table is the fallback, and `findLocalPackage()` prices
checkout from it too.

> In `PACKAGES`, `price` **must** be the Airalo *net* (wholesale) price, never
> the recommended retail price. Seeding retail prices there once put 287 of 305
> overrides below the cost floor and priced the fallback at up to 2.8× the
> intended amount. Values come from the net-price export in `attached_assets`;
> re-run that export and update them together.
>
> `priceInMnt` in that table is dead weight — a loop right after it recomputes
> every entry.

`USD_TO_MNT` is hardcoded. Margins on the thinner packages are near 15%, so a
rate move erodes them; revisit it rather than assuming it is current.

## Fulfillment

Payment and fulfillment cannot share a transaction — the money moves at QPay,
the SIM comes from Airalo — so an order can be paid with no eSIM behind it.
Everything below exists to make that state recoverable rather than terminal.

Order `status` (plain text, no DB constraint):

```
pending  -> invoice created, unpaid
paid     -> payment confirmed, awaiting fulfillment
fulfilling -> a worker holds the claim
completed -> eSIM issued or top-up applied
```

Two atomic transitions guard against doing the work twice. Both are conditional
`UPDATE`s that only the winner sees rows from:

- `claimPendingOrder()` in `routes/qpay.ts` — `pending -> paid`
- `claimForFulfillment()` in `lib/fulfillment.ts` — `paid -> fulfilling`

`fulfillOrder()` in `lib/fulfillment.ts` is the only place that buys from
Airalo. **An order carrying an ICCID is a top-up**, and recharges that SIM
rather than issuing a new one; getting this wrong bills Airalo twice and
orphans the eSIM the customer already installed. Call `runFulfillment()`, not
`fulfillOrder()` directly — it takes the claim and releases it on failure.

`lib/fulfillment-sweeper.ts` retries `paid` orders once a minute, backing off
1/2/4/8/16/32 minutes and giving up after six attempts. It reads the orders
table rather than an in-process queue, so a deploy does not lose the work;
attempt counts are in memory on purpose, so a restart grants fresh attempts. A
claim older than fifteen minutes is treated as abandoned and reclaimed, with a
warning — a crash between Airalo issuing a SIM and the row being written would
otherwise be invisible, and the retry would buy a second SIM.

## Auth

Customers sign in with **phone number + password against this API** —
`routes/auth.ts`, `lib/user-auth.ts`. No Firebase, no Google, no SMS, on
purpose: Google is blocked in China, many iPhone users have no Gmail, and a
Mongolian SIM abroad often can't receive a text.

- Accounts live in `usersTable`: `email` is the synthetic
  `<8-digit phone>@phone.avaesim.store`, `password` an scrypt hash, `name` the
  phone. Orders are keyed by that same address (`orders.customer_email`), so
  it is load-bearing — the AVA-era domain is kept because changing it would
  orphan orders.
- Phone numbers are normalised to 8 digits (a `976` prefix is dropped) on
  both client and server.
- Tokens are HS256 JWTs, 90 days, signed with `JWT_SECRET` (≥32 chars, no
  default: without it sign-in answers 503). Rotating the secret signs
  everyone out. A password reset does not revoke existing tokens.
- Login is rate-limited in memory: 30 per address and 10 per phone per 15
  minutes; register 10 per address.
- Forgotten passwords: there is no email or SMS to recover with, so an admin
  sets a new one (admin page → Хэрэглэгч tab, `POST /admin/users/reset-password`).
- The storefront's `useAuth()` keeps the Firebase-era user shape
  (`email`, `getIdToken()`), so pages didn't change; the session is in
  localStorage under `gotravel-session`.

Admin endpoints take an `ADMIN_SECRET` in an `x-admin-key` header. There is
deliberately no default: without the variable set, every admin route answers
503. The admin page is gated by that key alone.


## Deployment

Railway project **Travel**, two services from this one repo:
`@workspace/api-server` and `@workspace/esim-store`. Railway auto-created four
more from the workspace packages on import; they were deleted and must not come
back.

Railway did not pick up the per-service `railway.toml` files, so build and start
commands are set as **service variables**, which Railpack reads directly:

| Service | `RAILPACK_START_CMD` |
|---|---|
| api-server | `node artifacts/api-server/dist/index.cjs` |
| esim-store | `npx serve@14 artifacts/esim-store/dist/public -s -l $PORT` |

Both use `RAILPACK_BUILD_CMD=pnpm install --no-frozen-lockfile && pnpm run build`.
Do not remove these when pasting variables through the Raw Editor.

Run migrations against production without handling the secret yourself:
`railway run --service @workspace/api-server -- pnpm --filter @workspace/db run push`

API service environment: `NEON_DATABASE_URL` (GoTravel's own Neon project, not AVA's), `AIRALO_CLIENT_ID`,
`AIRALO_CLIENT_SECRET`, `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE`,
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_TOKEN`, `OPENAI_API_KEY`,
`FRONTEND_URL`, `ADMIN_SECRET`, `PUBLIC_API_URL`, `JWT_SECRET`.

Frontend service environment: `PORT`, `VITE_API_URL`.

Health check: `GET /api/healthz`.

**Never commit secrets.** They belong in Railway's environment variables and
nowhere else.

## Known gaps

- Russia is listed but marked coming-soon; Airalo publishes no unlimited
  packages for it, and the six `ru-*` ids in `PACKAGES` do not exist.
- No tests. The pricing and fulfillment logic — the parts that move money — have
  no coverage.

Closed since the copy from AVA: chat is rate-limited and bounded
(`routes/chat.ts`), the dead `routes/auth.ts` is gone, and admin/profile name
destinations through `useCountryLookup` instead of their own slug tables.

## Brand

This repo is the template for several eSIM brands; each clone is its own
repo (see `CLONING.md`). Everything brand-specific reads from the root
**`brand.json`**: name, tagline, page titles and description, QPay invoice
prefix and branch code, share-card text and the colour set.

- Storefront: `src/brand.ts` (name, tagline). `vite.config.ts` injects the
  colours as `--brand`, `--brand-hover`, `--brand-border`, `--brand-soft`,
  `--brand-tint`, `--brand-ink`, `--on-brand` and fills the `%BRAND_*%`
  placeholders in `index.html`. Tailwind exposes them as `bg-brand`,
  `text-on-brand`, `border-brand-border`… **Never write a brand hex value in a
  component**; on a brand-coloured surface use `text-on-brand`, not `#111`.
- API: `src/brand.ts` (name, invoice prefix, QPay branch code) for invoices,
  Airalo order notes and the chat prompt.
- Images: `public/images/brand/`, fixed file names.
- `scripts/og-image.py` renders `og-image.jpg`, `favicon.svg` and
  `apple-touch-icon.png` from `brand.json`.
- Page copy (home, help, about, how-it-works) is deliberately *not* in
  `brand.json`: each clone rewrites it so search engines don't see duplicates.

Fixes that clones need are listed in `FIXES.md`; add a row for any change
that touches money, accounts or security.

## Link previews

`index.html` carries the Open Graph tags; `og:image` is built from
`VITE_SITE_URL` (set on the esim-store service — change it with the domain,
and only once the domain resolves).
