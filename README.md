# Fullstack Realtime Chat

Production-oriented starter for a modern real-time chat app with:

- React + TypeScript + Context API + Tailwind CSS
- FastAPI + async SQLAlchemy + WebSockets
- PostgreSQL for durable storage
- JWT authentication, profiles, direct chat, groups, media uploads, typing indicators

## Project structure

```text
.
├── backend
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── db
│   │   ├── models
│   │   ├── schemas
│   │   ├── services
│   │   └── websocket
│   ├── requirements.txt
│   └── uploads
├── frontend
│   ├── public
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   └── types
│   └── package.json
└── docker-compose.yml
```

## Backend architecture

- `auth` routes handle registration and login with bcrypt password hashing and JWTs.
- `users` routes provide profile reads and updates.
- `conversations` routes cover direct chats, groups, history, messages, and typing events.
- `websocket` exposes `/api/ws` for authenticated live updates.
- PostgreSQL persists users, conversations, memberships, and messages.

## Database schema

Main tables:

- `users`: account identity, avatar, bio, status, online state
- `conversations`: chat container for direct and group chats
- `conversation_members`: many-to-many relationship between users and conversations
- `messages`: text/image messages with timestamps and read state

## Local setup

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Run backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`.

### 3. Run frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Core API routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users`

### Conversations

- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/{conversation_id}/messages`
- `POST /api/conversations/{conversation_id}/messages`
- `POST /api/conversations/{conversation_id}/typing`
- `POST /api/conversations/{conversation_id}/members/{user_id}`
- `DELETE /api/conversations/{conversation_id}/members/{user_id}`

### Uploads

- `POST /api/uploads/image`

### WebSocket

- `GET ws://localhost:8000/api/ws?token=<jwt>`

## Notes and next production steps

- Frontend and backend now support deployment via environment variables instead of hardcoded localhost URLs.
- For deployment instructions, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).
- Serve uploaded media from object storage or a CDN for stronger production durability.
- Move from `create_all` to Alembic migrations before serious production traffic.
- Add refresh tokens, rate limiting, background jobs, and observability before public launch.
