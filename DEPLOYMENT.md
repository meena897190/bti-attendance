# Vercel Deployment Guide for BTI Attendance API

## Overview
This guide walks you through deploying the `@workspace/api-server` to Vercel.

## Prerequisites
- GitHub account with repository access
- Vercel account (https://vercel.com)
- Repository pushed to GitHub

## Environment Variables

Before deploying, you need to set these environment variables in Vercel:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | ✅ Yes | Server port | `3000` |
| `NODE_ENV` | ✅ Yes | Environment type | `production` |
| `DATABASE_URL` | ✅ Yes | SQLite/Database connection | See below |
| `OPENID_CLIENT_ID` | ⚠️ Optional | OpenID provider client ID | Your provider's ID |
| `OPENID_CLIENT_SECRET` | ⚠️ Optional | OpenID provider secret | Your provider's secret |
| `OPENID_PROVIDER_URL` | ⚠️ Optional | OpenID provider URL | https://your-provider.com |

### SQLite Database Setup
If using SQLite (better-sqlite3):
- SQLite works locally but on Vercel requires a persistent storage solution
- **Options:**
  1. Use environment-specific config (PostgreSQL on Vercel, SQLite locally)
  2. Use Vercel KV Store or other persistent storage
  3. Configure a remote database service

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Select **"Import Git Repository"**
4. Search for and select `meena897190/bti-attendance`
5. Click **"Import"**

### 2. Configure Project Settings
1. Set **Framework**: `Other`
2. Set **Root Directory**: `./` (or leave default)
3. Click **"Environment Variables"**

### 3. Add Environment Variables
Add the following variables:
```
PORT = 3000
NODE_ENV = production
DATABASE_URL = [your-database-url]
```

Add optional variables if using OpenID:
```
OPENID_CLIENT_ID = [your-client-id]
OPENID_CLIENT_SECRET = [your-client-secret]
OPENID_PROVIDER_URL = [your-provider-url]
```

### 4. Deploy
1. Click **"Deploy"**
2. Wait for build to complete (should take 2-3 minutes)
3. You'll receive a deployment URL like: `https://bti-attendance.vercel.app`

## Local Testing

Before deploying to Vercel, test locally:

```bash
# Install dependencies
pnpm install

# Build the API server
cd artifacts/api-server
pnpm run build

# Start the server
pnpm run start
```

The server should start on `http://localhost:3000`

## Troubleshooting

### Build Failed: "Cannot find module"
- **Cause**: Missing dependencies
- **Fix**: Run `pnpm install` at the root and in `artifacts/api-server`

### Build Failed: "PORT environment variable is required"
- **Cause**: Missing `PORT` env var in Vercel
- **Fix**: Add `PORT=3000` to Environment Variables in Vercel dashboard

### Server crashes after deploy
- Check the Vercel logs: Dashboard → Project → Deployments → Latest → Logs
- Ensure all required environment variables are set
- Verify database connection string is correct

### Slow builds or timeouts
- Vercel has a 60-second build limit for free tier
- Upgrade to Pro if needed, or optimize build

## Monitoring Deployment

1. Go to your project in Vercel dashboard
2. Click **"Deployments"** to see build history
3. Click on any deployment to view:
   - Build logs
   - Runtime logs
   - Performance metrics

## API Testing After Deployment

Test your deployment with:

```bash
curl https://your-deployment-url/health
```

Or use Postman/Insomnia to test your API endpoints.

## Rollback

If something goes wrong:
1. Go to **"Deployments"** in Vercel dashboard
2. Find the last working deployment
3. Click **"..."** → **"Redeploy"**

## Support

For issues:
1. Check Vercel logs in the dashboard
2. Review this deployment guide
3. Check Vercel documentation: https://vercel.com/docs
4. Contact Vercel support for account/platform issues
