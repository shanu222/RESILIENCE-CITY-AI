# RESILIENCE CITY AI EC2 Deployment

This project keeps the current UI design and adds a backend simulation server for real-time gameplay.

## 1) Launch EC2

- Ubuntu 22.04 LTS
- Security groups:
  - `22` SSH (admin IP only)
  - `80` HTTP
  - `443` HTTPS
  - `4000` internal only (optional; keep private behind Nginx)

## 2) Install runtime

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx docker.io docker-compose-plugin
sudo npm install -g pm2
```

## 3) Clone and setup

```bash
git clone <your-repo-url> resilience-city-ai
cd resilience-city-ai
npm install
cd server && npm install && cd ..
```

## 4) Start PostgreSQL + Redis (Docker)

```bash
docker compose up -d postgres redis
```

## 5) Configure backend env

```bash
cp server/.env.example server/.env
# edit server/.env values for production secrets and DB credentials
```

Required:

- `JWT_SECRET` strong random value
- `DATABASE_URL` production DB
- `REDIS_URL` production redis
- `CORS_ORIGIN` frontend domain (Vercel URL)
- `AWS_REGION` + `AWS_S3_BUCKET` for signed uploads

## 6) Run migrations + build

```bash
cd server
npx prisma generate
npx prisma migrate deploy
npm run build
cd ..
npm run build
```

## 7) Start backend with PM2

```bash
pm2 start npm --name resilience-backend --prefix server -- run start
pm2 save
pm2 startup
```

## 8) Configure Nginx reverse proxy

- Copy `infra/nginx.conf` to `/etc/nginx/sites-available/resilience-backend`
- Update `server_name`
- Enable:

```bash
sudo ln -s /etc/nginx/sites-available/resilience-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 9) SSL setup

```bash
sudo certbot --nginx -d api.resiliencecityai.com
```

## 10) Frontend deployment (Vercel)

- Set `VITE_API_BASE_URL=https://api.resiliencecityai.com`
- Build command: `npm run build`
- Output directory: `dist`

## 11) Optional autoscaling

- Move DB to RDS and Redis to ElastiCache for production scaling.
- Keep EC2 stateless, store all saves in PostgreSQL.
- Use CloudFront for static assets and S3 uploads.
