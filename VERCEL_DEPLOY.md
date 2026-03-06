# Vercel Deployment (Backup)

Runs at `https://worldmun-qr.vercel.app` (or your custom domain)

## Environment Variables (set in Vercel dashboard)

| Key | Value |
|-----|-------|
| `SHEET_ID` | Your Google Sheet ID (e.g. `1vzz-LSSeFG...`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Entire contents of `sa.json` pasted as a single line |

Do NOT set `NEXT_PUBLIC_BASE_PATH` — leave it unset so the app runs at the root (`/`).

### How to get the GOOGLE_SERVICE_ACCOUNT_JSON value

`sa.json` is in `.gitignore` so it won't be pushed to GitHub. You don't need the file on Vercel — the app reads from the environment variable instead. To get the single-line value, run locally:

```bash
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('sa.json','utf8'))))"
```

Copy the output and paste it as the value for `GOOGLE_SERVICE_ACCOUNT_JSON` in the Vercel dashboard.

## Setup

1. Import the GitHub repo `ahmtox/worldmun-qr` on https://vercel.com/new
2. Leave all build settings as defaults (Framework: Next.js, Build Command: `next build`)
3. Add the two environment variables above
4. Click **Deploy**

## Redeploy

Vercel auto-deploys on every push to `main`. To manually redeploy:
- Go to the project on vercel.com > Deployments > Redeploy

## Notes

- The VPS uses `NEXT_PUBLIC_BASE_PATH=/worldmun-qr` to serve under a subpath. Vercel does not need this since it serves at the root domain.
- Both deployments share the same Google Sheet, so scans on either site write to the same ATTENDANCE sheet.
- If you hit Google Sheets API rate limits under heavy traffic (~60 writes/min), consider adding caching.
