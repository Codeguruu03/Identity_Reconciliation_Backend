# Identity Reconciliation — Bitespeed Backend

A Node.js + TypeScript + Express + Prisma (PostgreSQL) backend that identifies and consolidates customer identities across multiple purchases even when different contact details are used.

## 🚀 Live Endpoint

```
POST https://<your-render-url>/identify
```

> ⚠️ Update this URL after deploying on Render.

## 📡 API

### `POST /identify`

**Request Body:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```
*(At least one of `email` or `phoneNumber` is required)*

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local or [Neon.tech](https://neon.tech) free tier)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# 3. Run Prisma migrations
npx prisma migrate deploy

# 4. Start the dev server
npm run dev
```

Server runs at `http://localhost:3000`

## 🗄️ Database (PostgreSQL)

This project uses **PostgreSQL** via [Prisma ORM](https://www.prisma.io/).

For free hosted PostgreSQL, use:
- **[Neon.tech](https://neon.tech)** — Recommended. Free serverless Postgres, connect string format: `postgresql://...`
- **Render PostgreSQL** — Available in Render dashboard when deploying

## 🌐 Deploying to Render

1. Push code to GitHub
2. Go to [Render.com](https://render.com) → **New Web Service** → connect your repo
3. Set **Build Command**: `npm install && npx prisma migrate deploy && npm run build`
4. Set **Start Command**: `npm start`
5. Add environment variable `DATABASE_URL` with your Neon/Render Postgres connection string

## 📁 Project Structure

```
src/
├── app.ts                    # Express app setup
├── server.ts                 # Entry point
├── routes/
│   └── identifyRoute.ts      # POST /identify route
├── controllers/
│   └── identifyController.ts # Request handler
├── services/
│   └── identityService.ts    # Core business logic
└── prisma/
    └── prismaClient.ts       # Singleton Prisma client
prisma/
└── schema.prisma             # Database schema
```

## 🔑 Key Logic

- **New contact**: Creates a `primary` contact
- **Existing contact with new info**: Creates a `secondary` contact linked to the primary
- **Two separate primaries linked**: Older one stays `primary`, newer is **demoted to `secondary`**
