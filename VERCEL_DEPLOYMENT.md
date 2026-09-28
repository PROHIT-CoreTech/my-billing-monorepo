# Vercel Deployment Guide for My Billing Monorepo

This monorepo is pre-configured to deploy both the **React Web Frontend** (`apps/web`) and the **Express Serverless API** (`apps/backend`) directly to **Vercel**.

---

## 🚀 Quick Deployment Steps

### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy from Monorepo Root**:
   Run the following command from the root of `my-billing-monorepo`:
   ```bash
   vercel
   ```
   For production deployment:
   ```bash
   vercel --prod
   ```

---

### Option B: Deploy via Vercel Dashboard (Git Integration)

1. Push your repository to **GitHub / GitLab / Bitbucket**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and select **Import Project**.
3. Select your repository.
4. **Project Settings**:
   - **Framework Preset**: Other (or Vite)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `apps/web/dist`

---

## ⚙️ Environment Variables Setup

Configure the following environment variables under **Vercel Project Settings ➔ Environment Variables**:

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `MONGODB_URI` | **Yes** | `mongodb+srv://<username>:<password>@cluster0.mongodb.net/my-billing-prod?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Your secure random secret key |
| `NODE_ENV` | **Yes** | `production` |
| `VITE_API_URL` | Optional | Defaults to `/api` on Vercel (same-origin). Set only if using a custom backend domain. |

---

## 🛠️ Key Monorepo Optimizations Applied for Vercel

1. **Serverless Connection Reuse (`apps/backend/src/config/db.ts`)**:
   - MongoDB Mongoose connections check `mongoose.connection.readyState` to reuse warm lambda connections across API invocations.

2. **Async Handler Wrapper (`apps/backend/api/index.ts`)**:
   - Awaits database connection before dispatching requests to Express router to prevent cold-start race conditions.

3. **Dynamic API Routing (`vercel.json`)**:
   - `/api/*` requests route seamlessly to `@vercel/node` serverless functions.
   - All client routes fall back to `/index.html` for single-page React app routing.

4. **Package Build Pipeline (`turbo.json`)**:
   - Uses Turborepo dependency graph (`dependsOn: ["^build"]`) so shared packages (`@my-billing/database`, `@my-billing/api-client`, `@my-billing/document-templates`) build before frontend & backend.
