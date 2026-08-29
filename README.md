# LUXE — White-Label Luxury E-Commerce Platform

A complete, production-ready luxury e-commerce platform: bilingual (AR/EN) storefront + admin dashboard + API + embedded SQLite database + Telegram order delivery — deployed as **one single service** on Railway.

No external database. No SaaS dependencies. The store owner rebrands everything from the admin dashboard without touching code.

---

## Quick start (local)

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The admin dashboard lives at `/admin` (e.g. `http://localhost:3000/en/admin`).

On first boot a random admin password is generated and printed **once** in the server log — sign in with it, and you'll be required to set your own password before continuing. To control the initial password instead, set `ADMIN_PASSWORD` in `.env` (see [`.env.example`](.env.example)).

---

## Deploying to Railway

The repository ships with a [`Dockerfile`](Dockerfile) (Next.js `output: standalone`) and [`railway.json`](railway.json) — deployment is three steps:

1. **Create the service** — push this repo to GitHub, then in Railway: *New Project → Deploy from GitHub repo*. Railway auto-detects the Dockerfile.
2. **Attach a volume** — *Service → Settings → Volumes → New Volume*, mount it at `/data`. This persists the SQLite database, uploaded images, and the encryption key file across deploys and restarts.
3. **Set the public domain** — *Settings → Networking → Generate Domain*. The canonical URL is derived automatically from the Railway public domain for SEO metadata and the sitemap.

Optional environment variables (all have safe defaults — see [`.env.example`](.env.example)):

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Initial admin password (min 8 chars). Random + logged if unset. |
| `ENCRYPTION_KEY` | 64-hex-char key encrypting the Telegram bot token at rest. Auto-generated key file in `/data` if unset. |
| `DATA_DIR` | Data directory override. `/data` on Railway, `./data` locally. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO/sitemap. Derived from Railway domain if unset. |

### First-run checklist on Railway

1. Open `https://<your-domain>/en/admin` (or `/ar/admin`) and sign in with the generated password (check deploy logs) — change it immediately.
2. **Branding** — set store name, tagline, logo, favicon, accent color, currency, contact and social links.
3. **Telegram** — create a bot with [@BotFather](https://t.me/BotFather), paste the token + your chat ID, send a test message.
4. **Products & collections** — add products with images (auto-converted to optimized WebP), organize into collections.
5. **Homepage** — compose the homepage from 7 section types (hero, featured products, collection highlight, new arrivals, lookbook preview, brand story, promo banner).
6. Place a test order and watch it arrive in Telegram.

---

## Architecture

```
┌─────────────────────────── One Railway service ───────────────────────────┐
│                                                                            │
│  Next.js 15 (App Router, standalone output)                                │
│  ├── /[locale] storefront (EN/AR, RTL-first)                               │
│  ├── /[locale]/admin dashboard (session-cookie auth)                       │
│  └── /api/* REST endpoints (public + admin-guarded)                        │
│                                                                            │
│  Embedded SQLite (better-sqlite3, WAL mode)          ←─ /data volume      │
│  Media pipeline (sharp → WebP, content-hash dedup)   ←─ /data volume      │
│  Telegram delivery engine (retry + backoff)                               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Key design decisions

- **Embedded SQLite at `/data`** — zero external database services; WAL mode for concurrent reads; sequential `.sql` migrations run automatically at boot ([`src/lib/db/migrations/`](src/lib/db/migrations/)).
- **Prices as integer minor units** everywhere (DB, API, UI) — no floating-point money bugs.
- **Orders are persisted before any Telegram attempt** — an order can never silently disappear; delivery failures retry with backoff (1m → 5m → 15m → 1h → 6h, max 10 attempts) and are visible in the admin Orders view with a manual resend button.
- **Bot token encrypted at rest** (AES-256-GCM) and never sent to the browser — the admin UI only ever sees a masked hint (`…AB12`).
- **White-label everything** — store name, logo, favicon, accent color (CSS variable injected from the DB), currency, governorate list, policies, about page: all editable at runtime.
- **Bilingual-first** — every entity carries EN + AR fields; Arabic gets correct typography (Amiri/IBM Plex Sans Arabic, no uppercase/letter-spacing) and full RTL mirroring via logical CSS properties.

### Project layout

```
src/
├── app/
│   ├── [locale]/(storefront)/   # home, collections, product, search, cart,
│   │                            # checkout, order confirmation, lookbook,
│   │                            # about, policies, wishlist
│   ├── [locale]/(admin)/admin/  # login + guarded dashboard (products,
│   │                            # collections, home sections, lookbook,
│   │                            # about, policies, branding, telegram, orders)
│   ├── api/                     # public: products/collections/media/orders/health
│   │                            # admin: guarded CRUD + telegram + resend
│   ├── sitemap.ts / robots.ts   # bilingual SEO
│   └── layout.tsx               # fonts + design tokens
├── components/                  # storefront/, admin/, ui/ (icons, Reveal, SmartImage)
├── i18n/                        # next-intl routing + request config
├── lib/
│   ├── db/                      # SQLite client + repos (products, collections,
│   │                            # orders, content, settings)
│   ├── server/                  # auth, crypto, media, telegram, order-delivery,
│   │                            # rate-limit, admin-utils, site-url
│   ├── store/                   # zustand cart + wishlist (persisted)
│   ├── validation/              # zod schemas shared client + server
│   └── admin-client.ts          # typed fetch wrapper for admin UI
├── messages/                    # en.json + ar.json catalogs
└── styles/                      # Tailwind v4 theme tokens
```

---

## Security model

- Admin auth: scrypt-hashed password, session token (httpOnly cookie, sha256-hashed in DB, 12h sliding expiry).
- CSRF: `SameSite=Lax` cookies + Origin verification on every admin mutation.
- Rate limiting: login (5/5min), order creation, media upload, Telegram test/resend.
- Uploads: magic-byte type detection, sharp re-encode (strips any payload), ≤8 MB, ≤2000px, WebP q82, content-hash dedup.
- Input validation: zod schemas on every API route; admin routes additionally guarded by session + origin checks.

## Order flow (no online payments)

1. Customer fills the checkout form (name, Egyptian phone, governorate, city, address, notes).
2. Order is **persisted to SQLite first**, stock decremented, then the structured HTML message is sent to Telegram (text-first for reliability; product photo as best-effort follow-up).
3. Customer sees an honest confirmation page with the order number — including a "pending delivery" state if Telegram is unreachable.
4. Owner receives the order in Telegram. Failures retry automatically; the admin Orders view shows attempts, last error, and a manual resend button.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Run the production build |
| `npx tsc --noEmit` | Type check |

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · better-sqlite3 · next-intl · zustand · zod · sharp · Telegram Bot API
