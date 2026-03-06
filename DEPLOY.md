# Production Deployment (VPS - morelos.dev)

Runs at `https://morelos.dev/worldmun-qr`

## .env.local

```
NEXT_PUBLIC_BASE_PATH=/worldmun-qr
SHEET_ID=<your-google-sheet-id>
GOOGLE_SERVICE_ACCOUNT_JSON=<single-line JSON from sa.json>
```

To generate the single-line JSON from sa.json:
```bash
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('sa.json','utf8'))))"
```

## First-time setup

### 1. Upload code to VPS
```bash
cd /var/www/html/worldmun-qr
```

### 2. Create .env.local
```bash
nano .env.local
```
Paste the env vars above.

### 3. Install dependencies and build
```bash
npm install
npm run build
```

### 4. Start with PM2
```bash
PORT=3001 pm2 start npm --name "worldmun-qr" -- start
pm2 save
pm2 startup
```
Follow the command `pm2 startup` prints back to you — it gives you a sudo command to run.

### 5. Add nginx location block
Edit `/etc/nginx/sites-enabled/morelos.dev` and add inside the `server` block:
```nginx
location /worldmun-qr {
    proxy_pass http://127.0.0.1:3001/worldmun-qr;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### 6. Reload nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Redeploy after code changes
```bash
cd /var/www/html/worldmun-qr
sudo npm run build
sudo pm2 restart worldmun-qr
```

## PM2 commands
```bash
pm2 status                  # check if running
pm2 logs worldmun-qr        # view live logs
pm2 restart worldmun-qr     # restart app
pm2 stop worldmun-qr        # stop app
pm2 delete worldmun-qr      # remove from PM2
```

## Verify deployment
```bash
curl https://morelos.dev/worldmun-qr
curl -X POST https://morelos.dev/worldmun-qr/api/scan \
  -H "Content-Type: application/json" \
  -d '{"uid":"obs-0001","event":"Event 1:\nNight Zero"}'
```

Open https://morelos.dev/worldmun-qr on your phone to test the full scanner flow.
