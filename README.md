# QuickNext — The Scalable Neighbourhood Marketplace

Hyperlocal e-commerce for **Code to Cloud '26**. React + Express + MongoDB Atlas, with Google sign-in and Razorpay.

---

## What's here

```
backend/                      Express API (ESM, Node 22+)
  src/models/                 User, Product, Cart, Order
  src/services/
    stock.service.js          ← atomic reservation + compensation (the headline feature)
    payment.service.js        ← simulated + Razorpay behind one interface
  src/controllers/            auth, product, cart, order, vendor
  src/middleware/             JWT auth, vendor guard, error handling
  src/scripts/seed.js         demo accounts + catalog
  tests/stock.test.js         concurrency proofs        → npm test
  tests/smoke.js              full API walkthrough      → npm run smoke

frontend/                     React 19 + Vite
  src/context/                AuthContext, CartContext (server-backed)
  src/hooks/usePoll.js        live stock polling
  src/hooks/useCheckout.js    order → pay → confirm chain
  src/pages/                  Catalog, ProductDetail, Cart, Orders, Vendor*
```

---

## Setup, step by step

### 0. Just want to see it? (~2 min, no accounts)

```bash
cd backend  && npm install && npm run dev:local    # in-memory DB, seeded, no Atlas
cd frontend && npm install && npm run dev          # → http://localhost:5173
```

`dev:local` spins up a throwaway MongoDB, seeds it, and boots the API. Nothing to configure — good for getting teammates running in hour 1 without sharing credentials. Data resets on restart; use Atlas below when you need it to persist.

### 1. MongoDB Atlas (~5 min)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Create a cluster** → choose **M0 Free**. Pick the region closest to you (Mumbai if available).
3. **Database Access** → *Add New Database User* → username + password (autogenerate and copy it). Give it **Read and write to any database**.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   This isn't laziness — Render and Railway assign dynamic egress IPs, so there's no single address to allowlist. Tighten it after the event.
5. **Connect** → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Two edits that catch everyone out:**
   - Replace `<password>` with the real password. If it contains `@ : / ? #`, URL-encode it (`@` → `%40`).
   - Insert the database name before the `?`, or everything lands in a database called `test`:
     ```
     mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/quicknext?retryWrites=true&w=majority
     ```

#### ⚠️ `querySrv ECONNREFUSED` / `ENOTFOUND`? Use the non-SRV string

`mongodb+srv://` requires a **DNS SRV lookup**. On some machines Node's resolver (c-ares) misreads the Windows DNS config and falls back to `127.0.0.1`, where nothing is listening — so *every* `mongodb+srv://` connection fails, on every project, forever. Your browser and `nslookup` keep working, which makes it baffling to debug. **This machine has that bug**, which is why `backend/.env` uses the standard string.

One-line diagnosis — if this prints `127.0.0.1`, that's it:
```bash
node -e "console.log(require('dns').getServers())"
```

**Fix:** use Atlas's standard connection string. It lists shard hosts explicitly and resolves them via ordinary A records, so SRV is never involved. Get it from **Atlas → Connect → Drivers → driver version "Node.js 2.2.12 or later"**, or build it:

```powershell
nslookup -type=SRV _mongodb._tcp.<cluster>.mongodb.net 8.8.8.8   # → shard hostnames
nslookup -type=TXT <cluster>.mongodb.net 8.8.8.8                 # → replicaSet name
```
```
mongodb://user:pass@host-00:27017,host-01:27017,host-02:27017/quicknext?ssl=true&replicaSet=atlas-xxxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

Works everywhere including Render, so use it in both places. Regenerate it if Atlas ever changes cluster topology.

```bash
cd backend
cp .env.example .env          # then paste MONGO_URI into it
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # → JWT_SECRET
npm install
npm run seed
npm run dev
```

`GET http://localhost:5000/api/health` should report `"db": "connected"`.

```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000
npm install
npm run dev                   # http://localhost:5173
```

Sign in with any demo account on the login screen — password `demo1234` for all three.

| Account | Role |
|---|---|
| `customer@quicknext.demo` | customer |
| `vendor@quicknext.demo` | vendor (groceries) |
| `vendor2@quicknext.demo` | vendor (bakery) |

**Google and Razorpay are both optional.** With neither configured the app is fully functional — demo accounts log in, checkout runs on the simulated payment path. Add keys to switch each on; no code changes.

### 2. Google sign-in (~10 min, optional)

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project.
2. **APIs & Services → OAuth consent screen** → External.
3. **Publish the app.** ⚠️ This is the one that ruins demos. While the consent screen is in **Testing**, only Google accounts you manually add as test users can sign in — everyone else gets **"Access blocked: app has not completed the Google verification process."** A judge using their own account hits this. Because we only request `openid`, `email`, and `profile` (non-sensitive scopes), publishing to **In production** needs **no Google verification** — it's just a button. Do it now, not on the day.
4. **Credentials → Create Credentials → OAuth client ID → Web application.**
5. **Authorised JavaScript origins** — add both:
   - `http://localhost:5173`
   - your deployed frontend URL (the **stable production** domain — Vercel mints a *new* URL for every preview deploy, and those won't work)
6. Copy the Client ID into **both**:
   - `backend/.env` → `GOOGLE_CLIENT_ID=`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=`

The frontend only ever obtains an ID token; the backend verifies Google's signature *and* the audience before trusting it ([auth.controller.js](backend/src/controllers/auth.controller.js)).

### 3. Razorpay (~10 min, optional)

1. Sign up at [razorpay.com](https://razorpay.com). **Test mode needs no KYC** — keys are available immediately. (KYC is only for live mode, which we never use.)
2. Toggle the dashboard to **Test Mode**.
3. **Account & Settings → API Keys → Generate Test Key.** You get `rzp_test_…` and a secret. The secret is shown **once**.
4. Put both in `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxx
   ```
5. Restart the backend. It logs `Payments: Razorpay`, `/api/config` flips `razorpayEnabled: true`, and the frontend opens real Razorpay Checkout — no code change.

Test card: `4111 1111 1111 1111`, any future expiry, any CVV.

The key **secret never reaches the browser**. Only `RAZORPAY_KEY_ID` (publishable) is sent. Signature verification happens server-side in [payment.service.js](backend/src/services/payment.service.js).

### 4. Deploy — one Vercel project, frontend + API together

The React app and the Express API deploy as a **single Vercel project**. [api/index.js](api/index.js) wraps the Express app as a serverless function, and [vercel.json](vercel.json) rewrites `/api/*` to it; everything else serves the SPA.

This is worth the restructure for two reasons:
- **No CORS at all.** The API is same-origin (`/api/…`), so the brief's "must not fail due to cross-origin issues" stops being a risk rather than being managed.
- **No 60-second cold start.** Render's free tier sleeps after 15 min idle and takes 30–60s to wake — judges opening a cold URL would see a broken app. Vercel's cold start is under a second and needs no keep-alive pinger.

**Import the repo at Vercel → Framework: Vite.** Root directory stays the repo root (not `frontend/`) — the root `package.json` uses npm workspaces and `vercel.json` points the build at `frontend/dist`.

Set these in **Project Settings → Environment Variables** (all environments):

| Variable | Value |
|---|---|
| `MONGO_URI` | your standard (non-SRV) Atlas string |
| `JWT_SECRET` | the long random string from `backend/.env` |
| `JWT_EXPIRES_IN` | `7d` |
| `GOOGLE_CLIENT_ID` | your client ID (omit to disable Google) |
| `VITE_GOOGLE_CLIENT_ID` | the **same** client ID |
| `CORS_ORIGINS` | `https://<your-app>.vercel.app` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | omit until you have keys — checkout runs simulated |

**Do not set `VITE_API_BASE_URL`.** Unset means "same origin", which is what you want. Setting it to `http://localhost:5000` would make the deployed site call the *visitor's own machine*.

Don't copy `PORT` or `NODE_ENV` from `backend/.env` either — Vercel manages both, and `NODE_ENV=development` would ship a dev build.

After the first deploy, add your real `https://<app>.vercel.app` URL to Google's **Authorized JavaScript origins**, and to `CORS_ORIGINS`. `VITE_*` vars are baked in at **build** time, so changing one needs a redeploy, not just a restart.

---

## How this answers the brief

| Brief requirement | Where |
|---|---|
| Secure user entry, session management | Google ID token verified server-side + own JWT; Bearer header, not cookies (no SameSite issues cross-domain) |
| Real-time stock indicators | [usePoll.js](frontend/src/hooks/usePoll.js) — 5s refresh on catalog, detail and cart |
| Categorisation, search/filter | `GET /api/products?category=&search=` — substring regex, so "lap" finds "Laptop" |
| **Persistent** basket | `Cart` collection in Mongo, keyed by user. Survives refresh *and* device change |
| Simulated secure order generation | Razorpay **test mode** (a simulation by definition) with real HMAC verification; simulated fallback |
| Vendor catalog CRUD | `/api/vendor/products` — soft delete keeps order history intact |
| **Visual** operational insights | [VendorDashboard.jsx](frontend/src/pages/VendorDashboard.jsx) — Recharts bar + pie, live |
| Gross totals / active pipeline / completed | Three separate figures — the status enum (`pending_payment → paid → processing → completed`) distinguishes them |
| **Data integrity & concurrency** | [stock.service.js](backend/src/services/stock.service.js) — see below |
| Responsive desktop + mobile | Mobile-first CSS; vendor charts code-split so shoppers don't download 386 kB |
| Production availability | Env validated at boot, explicit CORS allowlist, `/api/health` |

### The concurrency answer

`{ stock: { $gte: qty } }` + `$inc: { stock: -qty }` evaluate **inside a single MongoDB document update**. The read and the write cannot be interleaved, so two customers racing for the last unit both match at most once — one wins, the other's update matches no document and returns `null`.

A multi-item cart isn't atomic by itself, so partial failures **compensate**: if line 3 fails after lines 1 and 2 were decremented, those two are given back. Cancellation claims itself atomically via `stockRestored`, so a double-clicked cancel credits stock exactly once.

*Why compensating writes instead of a transaction?* Atlas M0 is a replica set, which is the documented prerequisite for multi-document transactions — but the free-tier docs don't actually guarantee support. The headline feature shouldn't rest on an uncertain platform capability.

```bash
cd backend && npm test
```
```
✔ two customers racing for the last unit: exactly one wins
✔ twenty customers racing for five units: exactly five win
✔ partial failure compensates: earlier lines are given back
✔ inactive products cannot be reserved
✔ cancelling restores stock exactly once, even when called twice at once
✔ a paid order cannot be cancelled back into stock
```

`npm run smoke` boots the real API against a throwaway database and drives the whole flow over HTTP — 49 checks, no Atlas or keys needed.

---

## The demo

`"Baker's Last Chocolate Tart"` is seeded with **stock = 1** on purpose. Re-run `npm run seed` to reset between takes.

1. Two browsers side by side (one incognito), both on that product.
2. Both add to cart, both reach checkout.
3. Both click Pay.
4. One order confirms. The other gets **"Insufficient stock for Baker's Last Chocolate Tart"** — a clean 409 naming the product, not a crash.
5. Within 5 seconds the loser's badge flips to **Out of stock** on its own. No refresh.
6. Then show `npm test` going green.

---

## Known gaps — name these before a judge asks

- **Abandoned checkouts hold stock.** Reservation happens at checkout; dismissing the Razorpay modal or an explicit cancel restores it, but a user who closes the tab mid-payment leaves the unit held. The fix is a sweeper restoring stock from `pending_payment` orders older than ~15 min. Cut for time, not for lack of a solution. (A TTL index *cannot* do this — TTL only deletes documents, and deleting the order first strands that stock permanently.)
- **No payment webhook.** Confirmation is client-callback only, so paying and instantly closing the browser leaves the order `pending_payment`. Razorpay webhooks are the production answer.
- **Order status is per-order, not per-vendor.** In a cart spanning two vendors, either can advance the shared status. Correct fix is per-line fulfilment state.
- **Images are URLs, no upload.** Paste a link. Cloudinary unsigned upload would be ~30 min.
