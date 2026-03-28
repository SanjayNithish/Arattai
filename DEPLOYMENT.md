# Deployment Guide

This app is now configured to deploy with environment variables instead of hardcoded localhost URLs.

## Reality check

You can deploy this as a **good hobby / portfolio app for $0**, but a truly production-grade realtime chat stack with:

- always-on backend
- PostgreSQL
- media storage
- websocket reliability
- backups / SLA

usually is **not sustainably free**.

So the guide below is the best no-cost path for a launchable app, not an enterprise SLA setup.

## Best free stack

- Frontend: Vercel
- Backend: Render web service or Koyeb/Fly-style free trial alternatives
- PostgreSQL: Neon or Supabase
- Media uploads:
  - easiest hobby option: keep local uploads only if your backend has persistent disk
  - better long-term option: move uploads to Supabase Storage or Cloudinary

## Environment variables

### Backend

Set these on your backend host:

```env
APP_NAME=Realtime Chat API
API_V1_PREFIX=/api
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL=postgresql+asyncpg://...
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
UPLOAD_DIR=uploads
PUBLIC_ASSET_BASE_URL=https://your-backend-domain.onrender.com
AUTO_INIT_DB=true
```

### Frontend

Set these on Vercel:

```env
VITE_API_BASE_URL=https://your-backend-domain.onrender.com/api
VITE_ASSET_BASE_URL=https://your-backend-domain.onrender.com
VITE_WS_BASE_URL=wss://your-backend-domain.onrender.com/api/ws
```

## Recommended launch order

1. Create hosted Postgres.
2. Deploy backend with those env vars.
3. Confirm `GET /health` works.
4. Deploy frontend with the backend URLs.
5. Update backend `ALLOWED_ORIGINS` to your exact frontend domain.
6. Test register, login, direct chat, group chat, websocket delivery, and uploads.

## Backend deployment command

Use this start command on your Python host:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Important limitation about uploads

The current upload service writes to the backend filesystem.

That is fine for:

- local development
- a single backend instance with persistent disk

That is not ideal for:

- ephemeral containers
- multi-instance horizontal scaling

If you want, the next upgrade should be moving uploads to object storage.
