#!/bin/bash
# Einmaliges Server-Setup für SimpliPlan auf Hetzner (Ubuntu 24.04)
# Voraussetzung: Node.js, PM2, nginx, certbot sind auf diesem Server bereits
# installiert (siehe toolies-CC/deploy/server-setup.sh für den vollständigen
# Ersteinrichtungs-Ablauf). Dieses Skript legt nur SimpliPlan selbst an.
# Aufruf: bash server-setup.sh
set -e

echo "=== 1. Projektverzeichnis anlegen & Repo klonen ==="
git clone https://github.com/GeSt59/SimpliPlan-2.0.git /var/www/SimpliPlan || echo "Repo bereits vorhanden"

echo "=== 2. .env.local anlegen (Werte manuell eintragen) ==="
echo "-> /var/www/SimpliPlan/.env.local muss NEXT_PUBLIC_SUPABASE_URL,"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY enthalten."

cd /var/www/SimpliPlan

echo "=== 3. Dependencies & Build ==="
npm ci
npm run build

echo "=== 4. PM2 Start ==="
pm2 start ecosystem.config.js
pm2 save

echo "=== 5. Nginx Konfiguration ==="
cat > /etc/nginx/sites-available/SimpliPlan << 'EOF'
server {
    listen 80;
    server_name simpliplan.toolies.eu;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/SimpliPlan /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "=== 6. SSL-Zertifikat (Let's Encrypt) ==="
echo "-> Erst ausführen, wenn der DNS A-Record simpliplan.toolies.eu -> Server-IP aktiv ist:"
echo "   certbot --nginx -d simpliplan.toolies.eu --non-interactive --agree-tos -m admin@toolies.at"

echo ""
echo "=============================="
echo "SimpliPlan Setup abgeschlossen!"
echo "=============================="
