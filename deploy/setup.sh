#!/bin/bash
set -euo pipefail

REPO_URL="${1:?Usage: setup.sh <github-repo-url>}"
DOMAIN="dovalerio.dev.br"
APP_DIR="/opt/md-editor"
WEB_DIR="/var/www/dovalerio"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

# ── 1. Sistema ────────────────────────────────────────────────
apt update && apt upgrade -y
apt install -y nginx ufw fail2ban git certbot python3-certbot-nginx

# ── 2. SSH ────────────────────────────────────────────────────
SSHD=/etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "$SSHD"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD"
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSHD"
sed -i 's/^#\?MaxAuthTries.*/MaxAuthTries 3/' "$SSHD"
sshd -t
systemctl reload ssh

# ── 3. Firewall ───────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw default deny incoming
ufw default allow outgoing
ufw --force enable

# ── 4. Fail2ban ───────────────────────────────────────────────
cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
maxretry = 3
bantime = 1h
findtime = 10m
EOF
systemctl enable --now fail2ban
systemctl reload fail2ban

# ── 5. Diretórios ─────────────────────────────────────────────
mkdir -p "$WEB_DIR"

# ── 6. Clone do repositório ───────────────────────────────────
if [ -d "$APP_DIR" ]; then
  echo "Diretório $APP_DIR já existe, pulando clone."
else
  git clone "$REPO_URL" "$APP_DIR"
fi

# ── 7. Página inicial ─────────────────────────────────────────
cp "$(dirname "$0")/index.html" "$WEB_DIR/index.html"

# ── 8. Nginx ──────────────────────────────────────────────────
cp "$(dirname "$0")/nginx.conf" "$NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# ── 9. Container ──────────────────────────────────────────────
cd "$APP_DIR"
docker compose up -d --build
docker ps

# ── 10. HTTPS ─────────────────────────────────────────────────
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN"

# ── 11. Headers de segurança (bloco HTTPS já criado pelo certbot) ──
HTTPS_BLOCK="    add_header X-Frame-Options \"SAMEORIGIN\" always;\n    add_header X-Content-Type-Options \"nosniff\" always;\n    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;\n    add_header Permissions-Policy \"geolocation=(), microphone=(), camera=()\" always;"

# Insere os headers após a linha "listen 443 ssl"
sed -i "/listen 443 ssl/a\\$HTTPS_BLOCK" "$NGINX_CONF"
nginx -t
systemctl reload nginx

echo ""
echo "Deploy concluído."
echo "  https://$DOMAIN       → página inicial"
echo "  https://$DOMAIN/md-editor/ → editor Markdown"
