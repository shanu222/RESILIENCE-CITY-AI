
 # RESILIENCE CITY AI

RESILIENCE CITY AI is a browser-based disaster resilience simulation game with AI-assisted gameplay systems.

## Local development

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Backend dev server: `npm run backend:dev`

## Full stack local run

1. Start PostgreSQL and Redis:
   - `docker compose up -d postgres redis`
2. Configure backend env:
   - copy `server/.env.example` to `server/.env`
3. Run Prisma setup:
   - `cd server && npx prisma generate && npx prisma migrate dev && cd ..`
4. Start backend:
   - `npm run backend:dev`
5. Start frontend:
   - `npm run dev`

## Production build

- Build: `npm run build`
- Preview locally (optional): `npx vite preview`
- Backend build: `npm run backend:build`

## Deployment (Vercel)

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Env var: `VITE_API_BASE_URL=https://api.your-domain.com`

This repository includes `vercel.json` with SPA rewrite rules so client-side navigation resolves correctly in production.

## Environment variables

Frontend:

- `VITE_API_BASE_URL` backend API URL

Backend (`server/.env`):

- `PORT`
- `CORS_ORIGIN`
- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `SIM_TICK_MS`
- `AWS_REGION`
- `AWS_S3_BUCKET`

## Backend stack now integrated

- Node.js + Express API
- Prisma + PostgreSQL schema
- Redis cache support
- JWT auth (local, guest, Google-mock flow)
- Socket.IO realtime state sync
- Disaster simulation tick engine on server
- Persistent city save/load with autosave

## Infrastructure docs

- Nginx reverse proxy: `infra/nginx.conf`
- PM2 config: `infra/pm2-ecosystem.config.cjs`
- EC2 deploy guide: `infra/ec2-deploy.md`
  