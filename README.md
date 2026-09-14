# CRAVIXO — Find Your Next Craving

A full-stack food ordering platform. Customers browse restaurants, add items to cart, place orders, and track them live. Restaurant owners receive orders through a real-time dashboard. Delivery riders manage assigned deliveries and update status from pickup to doorstep.

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Prisma ORM** with **SQLite**
- **Auth.js (NextAuth v5)** — credentials + Google OAuth
- **Socket.io** — real-time order & delivery updates
- **Stripe** — online payments (with COD fallback)
- **Zustand** — persisted cart state
- **Tailwind CSS 4** + Lucide icons

## Features

### Customer
- Browse restaurants with search
- View restaurant menus grouped by category
- Add items to cart (persists in localStorage, single-restaurant carts)
- Checkout with delivery address + special instructions
- Pay online (Stripe) or cash on delivery
- Live order tracking with a status timeline (pending → confirmed → preparing → ready → out for delivery → delivered)
- Order history and profile

### Restaurant Owner (Dashboard)
- **Overview**: today's orders, pending count, revenue, recent activity
- **Incoming Orders**: real-time new-order notifications, accept/decline, progress status updates
- **Rider Assignment**: assign a rider to an order once it starts being prepared
- **Menu Management**: CRUD for categories and items, dietary flags, availability toggles
- **Order History**: filterable completed/cancelled orders
- **Settings**: restaurant profile setup

### Delivery Rider (Dashboard)
- **Overview**: ready-to-pickup count, out-for-delivery count, delivered-today, earnings
- **My Deliveries**: live view of assigned orders with instant new-assignment alerts
- **Start Delivery** (mark order out for delivery) and **Mark Delivered**
- **Delivery History**: completed deliveries and earnings per order

## Demo Accounts (seeded)

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@cravixo.com` | `password123` |
| Restaurant Owner | `owner@curryhouse.com` | `restaurant123` |
| Restaurant Owner | `owner@pizzeria.com` | `restaurant123` |
| Admin | `admin@cravixo.com` | `restaurant123` |
| Delivery Rider | `rider@cravixo.com` | `restaurant123` |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
# Create the SQLite database from the Prisma schema
npx prisma db push --schema prisma/schema.prisma

# Seed with sample restaurants, menus, users and a ready delivery
npm run seed
```

### 3. Environment variables

Copy the values from `.env` (already created) and adjust as needed:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate with: openssl rand -base64 32"
AUTH_GOOGLE_ID=""              # optional, for Google sign-in
AUTH_GOOGLE_SECRET=""          # optional, for Google sign-in
STRIPE_SECRET_KEY=""           # optional, enables online payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""       # for local webhook testing
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Without Stripe keys, the checkout falls back to **Cash on Delivery**.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note**: `npm run dev` uses a custom server (`server.ts`) that hosts Socket.io for real-time features. Use `npm run build` + `npm run start` for production.

## Real-Time Delivery Flow

1. Customer places an order → restaurant owner in `/admin/orders` sees it appear instantly (with browser notification if allowed).
2. Owner accepts (→ confirmed) or declines (→ cancelled).
3. Owner advances status as it's prepared, then **assigns a rider**.
4. Rider (logged in at `/rider`) gets an instant notification in **My Deliveries**.
5. Rider taps **Start Delivery** (→ out for delivery) then **Mark Delivered**.
6. Customer's order tracking page and the rider's dashboard update live via Socket.io.

## Stripe Setup (Optional)

1. Create a Stripe account and grab test keys.
2. Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET` to the printed `whsec_...` value.
4. Checkout now redirects to a Stripe-hosted payment page. Payment confirms the order via webhook.

## Deployment

This app needs a long-running Node server (custom `server.ts` for Socket.io) + a database — it cannot run on GitHub Pages or Vercel. Any Docker-capable host works (Render, Railway, Fly.io).

Included config:

- `Dockerfile` — multi-stage build; runs Prisma schema push + seeds a fresh DB on boot, then starts the server.
- `render.yaml` — one-click Render blueprint (free tier gives `cravixo.onrender.com`).

Required environment variables (on Render/Railway, `PORT` and `HOSTNAME` are set automatically):

| Variable | Example | Notes |
|---|---|---|
| `AUTH_SECRET` | random 32+ char string | use `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` | required by Auth.js in production |
| `NEXT_PUBLIC_APP_URL` | `https://cravixo.onrender.com` | must match your public URL (Socket CORS) |
| `DATABASE_URL` | `file:/data/cravixo.db` | SQLite path; on Render use `/opt/render/data/cravixo.db` |

Notes:

- **Render free tier has no persistent disk** — SQLite resets on redeploy. For a persistent DB use Railway (mount a volume, e.g. `DATABASE_URL=file:/data/cravixo.db`) or Fly.io, or swap the Prisma datasource to Postgres.
- Stripe/Google OAuth env vars are optional in production too.
- On first boot the entrypoint runs `prisma db push` and seeds demo accounts (skips seeding if the DB already has data).

## Project Structure

```
prisma/
  schema.prisma      # Database schema
  seed.ts            # Sample data + demo users
src/
  app/
    (customer pages) # / , /restaurants/[id], /cart, /checkout, /orders, /profile
    admin/           # /admin restaurant dashboard (overview, orders, menu, history, settings)
    rider/           # /rider delivery dashboard (overview, deliveries, history)
    api/             # auth, checkout, stripe webhook
  actions/           # Server Actions (auth, orders, menu, restaurants)
  components/        # UI + feature components
  hooks/             # useSocket
  lib/               # prisma, auth, socket-events, stripe, utils
  store/             # Zustand cart store
  proxy.ts           # Route protection (Next.js 16 proxy/middleware)
server.ts            # Custom server with Socket.io
```