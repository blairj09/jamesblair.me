# Vercel KV Setup for Caffeine Tracker

The caffeine tracker uses Vercel KV (a Redis-compatible key-value store) to enable cross-device synchronization.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install `@vercel/kv` package required for cloud sync.

### 2. Create a Vercel KV Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Navigate to your project
3. Click on the "Storage" tab
4. Click "Create Database"
5. Select "KV" (Key-Value Store)
6. Choose a name (e.g., "caffeine-tracker-kv")
7. Select a region close to your users
8. Click "Create"

### 3. Connect Database to Project

Vercel will automatically:
- Create the KV database
- Set up environment variables (`KV_URL`, `KV_REST_API_URL`, etc.)
- Make them available to your edge functions

No manual environment variable configuration needed!

### 4. Deploy

```bash
npm run deploy
```

Or use Vercel's GitHub integration for automatic deployments.

## How It Works

- Each user gets a unique ID stored in their browser's localStorage
- Data is synced to Vercel KV automatically every 5 minutes
- Users can manually sync anytime with the "Sync Now" button
- To sync across devices:
  1. On device 1: Click "Copy User ID"
  2. On device 2: Click "Use Different ID" and paste the ID
  3. Data will sync immediately

## Data Retention

- Data is stored for 90 days from last sync
- Doses older than 48 hours are automatically cleaned up

## Troubleshooting

If sync isn't working:
1. Check that Vercel KV database is created and connected
2. Check browser console for error messages
3. Verify the API endpoint `/api/caffeine` is accessible
4. Ensure environment variables are set in Vercel dashboard
