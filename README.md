# AgriLink — MERN Farm-to-Buyer Marketplace

AgriLink connects farmers and buyers in a single marketplace: farmers publish listings with images, buyers place orders, farmers accept and deliver, and the platform records a commission. Admins verify users and listings, and farmers subscribe to paid plans for lower commission + priority placement.

**Stack**

| Layer | Tech |
|------|------|
| Server | Node + Express + Mongoose (ESM) |
| Client | React + Vite + Tailwind CSS + react-router |
| Auth | JWT in `Authorization: Bearer` header |
| Images | Cloudinary via `multer` memory storage |
| DB | MongoDB (local or Atlas) |

---

## Quick start

### 1. Install dependencies

From the project root:

```bash
npm install                       # installs root + workspaces (server, client)
```

Or install the two workspaces separately:

```bash
npm install --workspace server
npm install --workspace client
```

### 2. Configure environment

Copy the template and fill in real values:

```bash
cp server/.env.example server/.env
# edit server/.env — set MONGO_URI, JWT_SECRET, CLOUDINARY_*
cp client/.env.example client/.env
# edit client/.env only if the API is on a different origin in production
```

### 3. Seed an admin user

```bash
npm run seed:admin
# → uses SEED_ADMIN_* env (defaults: admin@agrilink.local / ChangeMe!2025)
```

The script is idempotent — re-run it to re-promote the user to admin.

### 4. Run the app

In two terminals (or use the combined `npm run dev`):

```bash
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173 (proxies /api → 5000)
```

Or run both with one command:

```bash
npm run dev
```

The client's `vite.config.js` proxies `/api` and `/health` to `http://localhost:5000`, so no `VITE_API_URL` is needed in dev.

---

## Project layout

```
agrilink/
├── package.json                # workspaces: server + client, dev orchestration
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js            # bootstrap: dotenv → connectDB → listen
│   │   ├── app.js              # express app: helmet, cors, morgan, routes
│   │   ├── config/
│   │   │   ├── db.js           # mongoose connect with retry
│   │   │   ├── cloudinary.js   # uploadBuffer(buffer) → {secure_url, public_id}
│   │   │   └── plans.js        # PLANS catalog (free / pro / enterprise)
│   │   ├── middleware/
│   │   │   ├── auth.js         # protect + authorize(...roles)
│   │   │   ├── error.js        # errorHandler + AppError
│   │   │   └── upload.js       # multer memoryStorage (single image, 5MB)
│   │   ├── models/
│   │   │   ├── User.js          # role, plan, verified, password hashing
│   │   │   ├── Listing.js       # text index + compound indexes for browse
│   │   │   ├── Order.js         # state machine + commission snapshot
│   │   │   └── Subscription.js  # mock payment record (Stripe-ready shape)
│   │   ├── controllers/
│   │   │   ├── authController.js        # register, login, me, updateProfile
│   │   │   ├── listingController.js     # CRUD + search/filter/sort/pagination
│   │   │   ├── orderController.js       # create, accept, decline, deliver
│   │   │   ├── analyticsController.js   # farmer + admin dashboards
│   │   │   ├── adminController.js       # users/listings/orders + verification
│   │   │   └── subscriptionController.js # plans, subscribe (mock), cancel
│   │   ├── routes/
│   │   │   ├── auth.js, listings.js, orders.js,
│   │   │   ├── analytics.js, admin.js, subscriptions.js
│   │   └── utils/
│   │       └── seedAdmin.js
│   └── .env.example
└── client/
    ├── package.json
    ├── vite.config.js          # /api proxy
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx             # routes (role-aware)
        ├── index.css           # Tailwind directives + component classes
        ├── api/client.js       # axios instance + JWT interceptor
        ├── context/AuthContext.jsx  # boot / login / register / logout
        ├── components/
        │   ├── Navbar.jsx, ProtectedRoute.jsx, ListingCard.jsx,
        │   ├── QuantityPicker.jsx, Toast.jsx
        └── pages/
            ├── Login.jsx, Register.jsx
            ├── BuyerBrowse.jsx, BuyerOrders.jsx
            ├── FarmerDashboard.jsx, FarmerListings.jsx,
            ├── FarmerOrders.jsx, FarmerAnalytics.jsx
            ├── AdminDashboard.jsx, AdminUsers.jsx, AdminListings.jsx
            └── SubscriptionPlans.jsx
```

---

## API reference

Base URL: `http://localhost:5000/api` (use Postman / Insomnia against the table below).

| Method | Endpoint | Auth | Body / Query | Returns |
|---|---|---|---|---|
| **Auth** | | | | |
| POST | `/auth/register` | — | `{name, email, password, role?, phone?, region?}` | `{token, user}` |
| POST | `/auth/login` | — | `{email, password}` | `{token, user}` |
| GET | `/auth/me` | bearer | — | `{user}` |
| PATCH | `/auth/me` | bearer | `{name?, phone?, region?, avatarUrl?}` | `{user}` |
| **Listings** | | | | |
| GET | `/listings` | — | `?q&category&crop&region&organic&minPrice&maxPrice&sort&page&limit` | `{items, page, pageSize, total, totalPages, hasMore}` |
| GET | `/listings/:id` | — | — | `{listing}` (with populated farmer) |
| GET | `/listings/me/listings` | farmer | — | `{items}` |
| POST | `/listings` | farmer | multipart `image` + fields `title, crop, pricePerUnit, stock, …` | `{listing}` (201) |
| PATCH | `/listings/:id` | farmer/admin | multipart + fields | `{listing}` |
| DELETE | `/listings/:id` | farmer/admin | — | `{ok:true}` |
| **Orders** | | | | |
| POST | `/orders` | buyer | `{listingId, quantity, note?}` | `{order}` (201) |
| GET | `/orders/buyer` | buyer | — | `{items}` |
| GET | `/orders/farmer` | farmer | `?status=requested|accepted|declined|delivered` | `{items}` |
| POST | `/orders/:id/accept` | farmer | — | `{order, listing}` (atomic stock decrement) |
| POST | `/orders/:id/decline` | farmer | — | `{order}` |
| POST | `/orders/:id/deliver` | farmer | — | `{order}` |
| **Analytics** | | | | |
| GET | `/analytics/farmer` | farmer | — | revenue, commission, statusCounts, topCrops, listingStatus |
| GET | `/analytics/admin` | admin | — | users, sales (GMV + commission), listings, topFarmers, recentOrders |
| **Admin** | | | | |
| GET | `/admin/users` | admin | `?role&q&page&limit` | `{items, page, …}` |
| POST | `/admin/users/:id/verify` | admin | — | `{user}` (toggles) |
| POST | `/admin/users/:id/suspend` | admin | — | `{user}` (toggles) |
| GET | `/admin/listings` | admin | `?status&verified&page&limit` | `{items, …}` |
| POST | `/admin/listings/:id/verify` | admin | — | `{listing}` (toggles) |
| GET | `/admin/orders` | admin | `?status&page&limit` | `{items, …}` |
| **Subscriptions** | | | | |
| GET | `/subscriptions/plans` | — | — | `{plans: [free, pro, enterprise]}` |
| GET | `/subscriptions/me` | bearer | — | `{plan, subscription}` |
| POST | `/subscriptions/subscribe` | bearer | `{planId, paymentMethodId}` | `{subscription, plan, user}` (201) |
| POST | `/subscriptions/cancel` | bearer | — | `{plan, user}` (reverts to free) |

**Sort values** for `GET /listings`: `newest` · `price_asc` · `price_desc` · `stock_desc` · `featured_first`.

**Commission rate** is read from each plan's catalog entry. `COMMISSION_RATE` env sets the free plan's rate (default `0.05` = 5%). Pro = 3%, Enterprise = 2%.

**Plan limits** enforced on listing create: `free` = 5, `pro` = 50, `enterprise` = 500 active listings.

---

## Feature checklist

- ✅ JWT auth with bcrypt-hashed passwords and role checks (`farmer`, `buyer`, `admin`)
- ✅ Listings: CRUD + Cloudinary image upload; search / filter / sort / paginate (12 per page)
- ✅ Orders: request → accept / decline / deliver; accepting does an **atomic** stock decrement (`findOneAndUpdate` with `$gte`) and records commission at the plan's rate
- ✅ Farmer analytics: revenue, commission, net, top crops, order/listing status breakdown
- ✅ Admin analytics: total users (by role), GMV, total commission earned, top farmers, recent orders
- ✅ Admin verification: toggle user verified + listing verified
- ✅ Subscription plans: `free` / `pro` / `enterprise` with mock payment activation (Stripe-ready shape)
- ✅ Tailwind CSS fully configured (brand + soil palettes, component utility classes in `index.css`)
- ✅ Flexible order quantity (buyer picks 1..stock via QuantityPicker — no longer fixed at 10)
- ✅ Full admin screens: dashboard, users (search/verify/suspend), listings (verify/delete)

---

## Deploy notes

### Server (Render / Railway / Fly.io / Heroku)

1. Set every key from `server/.env.example` as a platform env var (don't commit `.env`).
2. Build step: none (server is JS-only). Start command: `npm --workspace server start`.
3. Allow the following origins in CORS via `CLIENT_ORIGIN` (comma-separated for multiple).
4. Make sure MongoDB is reachable from the deploy environment (`MONGO_URI`). Use Atlas in production.
5. Cloudinary credentials are required for image uploads to work — otherwise `POST /listings` returns 500 on file attach.

### Client (Vercel / Netlify / Cloudflare Pages / S3+CF)

1. Build command: `npm --workspace client run build`.
2. Output dir: `client/dist`.
3. Env: set `VITE_API_URL` to your deployed API origin (e.g. `https://api.agrilink.app/api`). Without it, the client uses relative URLs (works when client + API share an origin).
4. For SPA routing, add a catch-all rewrite to `index.html` (Vercel/Netlify handle this automatically).

### Mongo

- `MONGO_URI` for production should use `?retryWrites=true&w=majority` and a properly-scoped DB user.
- Indexes are created automatically on first server start (Mongoose `syncIndexes` is not required; the schema's `index()` calls create them on model compile + first query).

### Stripe (when you're ready to replace the mock checkout)

1. `npm i stripe` server-side and `@stripe/stripe-js` client-side.
2. In `subscriptionController.subscribe`, replace the mock branch with a Stripe Checkout Session (`mode: 'subscription'`, `line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }]`), and return `session.url`.
3. Add `POST /api/subscriptions/webhook` (raw body, `stripe.webhooks.constructEvent`) handling `checkout.session.completed` → create `Subscription` doc with status `active` + set `user.plan`.
4. The `Subscription` model already mirrors Stripe's fields — `paymentMethodId`, `currentPeriodStart/End`, `status`, `canceledAt` all line up.

---

## Local dev tips

- **Mongo not running?** `docker run --rm -d -p 27017:27017 --name agrilink-mongo mongo:7`
- **No Cloudinary keys yet?** The server still boots; listing create returns 500 only when an image file is attached.
- **Lost admin access?** Re-run `npm run seed:admin` — it promotes the email to admin if it already exists.
- **Want to test the buyer flow?** Register as a buyer (default role), then browse `/browse` and place an order. Switch to a farmer account to accept it.

---

## Scripts (root)

| Script | What it does |
|---|---|
| `npm install` | installs root + both workspaces |
| `npm run dev` | runs server + client concurrently |
| `npm run dev:server` | nodemon on the API |
| `npm run dev:client` | Vite dev server |
| `npm run start:server` | production start for the API |
| `npm run build:client` | production build for the React app |
| `npm run seed:admin` | seed / promote the admin user |

---

## License

MIT — for demo and educational purposes. Replace the mock payment + cookie/JWT handling before running in production.
