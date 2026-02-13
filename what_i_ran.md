On your VPS
1. Copy the project (if not already there with all the code):


cd /var/www/html/worldmun-qr
Make sure .env.local and sa.json are in there.

2. Install & build:


npm install
npm run build
3. Install PM2 and start the app:


npm install -g pm2
PORT=3001 pm2 start npm --name "worldmun-qr" -- start
pm2 save
pm2 startup    # run the command it prints back to you
4. Add to nginx — edit /etc/nginx/sites-enabled/morelos.dev and add this location block inside the existing server block:


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
5. Reload nginx:


sudo nginx -t && sudo systemctl reload nginx
Then open https://morelos.dev/worldmun-qr on your phone — it should work with HTTPS (camera requires it) since your existing Certbot cert already covers the domain.

Useful PM2 commands:

pm2 logs worldmun-qr — see live logs
pm2 restart worldmun-qr — restart after changes
pm2 status — check if running