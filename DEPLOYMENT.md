# CertifyFlow Deployment Guide

This guide details how to deploy **CertifyFlow** with the **Backend on Render** (via Docker) and the **Frontend on Vercel**.

---

## 🛠 Prerequisites

1. A **PostgreSQL Database** (e.g. from [Neon.tech](https://neon.tech), Supabase, or Render PostgreSQL).
2. A **Render** account ([render.com](https://render.com)).
3. A **Vercel** account ([vercel.com](https://vercel.com)).

---

## 🚀 1. Deploy Backend on Render (Using Docker)

The backend uses Puppeteer for generating PDF certificates. Deploying via Docker ensures all required Linux Chromium dependencies and fonts are pre-installed automatically.

### Steps:

1. **Create Web Service on Render**:
   - Log into [Render Dashboard](https://dashboard.render.com).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub / GitLab repository containing `CertifyFlow`.

2. **Configure Service Settings**:
   - **Name**: `certifyflow-backend` (or your preferred name)
   - **Region**: Choose closest to your users (e.g. `Singapore` or `Oregon`)
   - **Root Directory**: Leave blank (or set to `server` if pointing directly to server subfolder)
   - **Runtime**: Select **Docker**
   - **Dockerfile Path**: `./Dockerfile` (or `./server/Dockerfile` if Root Directory is set to `server`)
   - **Instance Type**: Starter / Free or higher

3. **Configure Environment Variables in Render**:
   In the Render Web Service **Environment** section, add the following key-value pairs:

   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Set environment to production |
   | `PORT` | `4000` | Port for the backend server |
   | `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Your PostgreSQL connection string |
   | `JWT_SECRET` | `cf_sec_9f7a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e` | Strong JWT signing secret |
   | `JWT_EXPIRES_IN` | `7d` | Token duration |
   | `COOKIE_NAME` | `cf_token` | Cookie name for auth |
   | `CLIENT_URL` | `https://your-app.vercel.app` | URL of your Vercel frontend |
   | `PUBLIC_SERVER_URL` | `https://certifyflow-backend.onrender.com` | Your Render Web Service URL |
   | `STORAGE_DIR` | `storage` | Local directory for uploaded logos/signatures |

4. **Deploy**:
   - Click **Create Web Service**.
   - Render will build the Docker container, run `npx prisma migrate deploy`, and start the backend service at `https://<your-app-name>.onrender.com`.
   - Copy your Render backend URL (e.g. `https://certifyflow-backend.onrender.com`).

---

## 🌐 2. Deploy Frontend on Vercel

### Steps:

1. **Import Project into Vercel**:
   - Log into [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **Add New...** -> **Project**.
   - Import your `CertifyFlow` repository.

2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variables**:
   Under **Environment Variables**, add:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://certifyflow-backend.onrender.com/api` | *(Replace with your actual Render URL)* |

4. **Deploy**:
   - Click **Deploy**.
   - Vercel will build the React SPA and provide a URL (e.g. `https://certifyflow.vercel.app`).

5. **Update Backend CORS Environment Variable**:
   - Go back to your Render backend environment variables.
   - Update `CLIENT_URL` to match your exact Vercel URL (e.g. `https://certifyflow.vercel.app`).
   - Save changes (Render will trigger a quick redeploy).

---

## 🐳 3. Local Docker Setup (Optional)

You can also run the backend & PostgreSQL database locally via Docker Compose:

```bash
docker compose up --build
```

This starts:
- PostgreSQL DB on `localhost:5432`
- CertifyFlow Express API Server on `localhost:4000`

---

## 📑 Summary of Created/Updated Files

- `server/.env`: Updated `JWT_SECRET` with a secure random key.
- `server/Dockerfile`: Container image for Render deployment with Puppeteer & Prisma.
- `Dockerfile`: Root container setup for monorepo Docker builds.
- `docker-compose.yml`: Local multi-container Docker development setup.
- `vercel.json` & `client/vercel.json`: Handles SPA client route rewrites on Vercel.
- `server/src/modules/auth/cookie.ts`: Enables `sameSite: 'none'` in production for Vercel <-> Render cross-domain cookie authentication.
- `server/src/middleware/auth.ts`: Added support for both Cookie and Bearer authorization headers.
- `server/src/app.ts`: Updated CORS configuration for Vercel deployment domains.
