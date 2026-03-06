# Local Development (macOS)

## Prerequisites
- Node.js (v18+) via nvm
- `.env.local` in project root with `SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON`
- `sa.json` in project root (Google service account credentials)

## Setup (first time)
```bash
cd /Users/ahmtox/tmp/Projects/worldmun-qr
npm install
```

## Run dev server
```bash
npm run dev
```

App will be available at: http://localhost:3000/worldmun-qr

## Production build (local testing)
```bash
npm run build
npm start
```

## Notes
- Camera access requires HTTPS in production, but works on `localhost` without it
- To test on your phone locally, both devices must be on the same WiFi network. Use your Mac's local IP (e.g., `http://192.168.x.x:3000/worldmun-qr`). Camera may not work without HTTPS on non-localhost.
