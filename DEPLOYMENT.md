# Deployment Guide for Knolta Ticket System

This guide covers how to deploy your Ticket Management System to a production environment.

## Prerequisites

- A server (VPS) running Ubuntu 20.04/22.04 (DigitalOcean, Linode, AWS EC2, etc.)
- A domain name (optional but recommended)
- Basic knowledge of terminal/SSH

---

## Option 1: Deploying on a VPS (Recommended)

This method gives you full control and is cost-effective (approx. $5/month).

### 1. Server Setup

SSH into your server:
```bash
ssh root@your_server_ip
```

Update packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Node.js (v18+):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Application Setup

Clone your code (or upload it via SFTP/Git):
```bash
mkdir -p /var/www/knolta_ticket
# Upload your files to this directory
cd /var/www/knolta_ticket
```

Install dependencies:
```bash
npm install --production
```

Create your production `.env` file:
```bash
nano .env
```
Paste your configuration (Change these values!):
```env
PORT=3000
JWT_SECRET=REALLY_LONG_RANDOM_STRING_HERE_XYZ123
SESSION_SECRET=ANOTHER_LONG_RANDOM_STRING
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong_password_here
SERVER_URL=https://your-domain.com
# Twilio credentials...
```

### 3. Process Management with PM2

Install PM2 to keep your app running forever:
```bash
sudo npm install -g pm2
pm2 start server.js --name "ticket-system"
pm2 save
pm2 startup
```

### 4. Nginx Reverse Proxy (for Port 80/443)

Install Nginx:
```bash
sudo apt install nginx -y
```

Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/ticket-system
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com; # Or your server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ticket-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate (HTTPS) - Crucial for Security!

If you have a domain, use Certbot for free SSL:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Option 2: Cloud Platforms (Railway/Render)

**Note:** Since this app uses SQLite (a local file database), you MUST use a service that supports **Persistent Storage (Volumes)**. If you don't, your database will be wiped every time you redeploy.

### Railway.app (Easiest)
1. Push your code to GitHub.
2. Login to Railway and "New Project" -> "Deploy from GitHub repo".
3. Add a **Volume** and mount it to `/app/data` (or wherever your db is).
   - *Note: You might need to update code to save DB to that path.*
4. Add your Environment Variables in Railway dashboard.
5. Railway handles HTTPS automatically.

---

## Maintenance

### Backups
Run the backup script periodically using `cron`:
```bash
crontab -e
```
Add this line to backup every day at 3 AM:
```bash
0 3 * * * /usr/bin/node /var/www/knolta_ticket/backup_db.js
```

### Updates
To update your app:
1. Pull new code / upload files
2. `npm install` (if new deps)
3. `pm2 restart ticket-system`
