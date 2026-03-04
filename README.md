# Identity Reconciliation API

A backend REST API that intelligently links customer contact information (email + phone) across multiple purchases to build a unified identity profile — even when customers use different emails or phone numbers over time.

## 🚀 Live Endpoint

```
POST https://<your-render-url>/identify
```

> Deploy to Render and replace the URL above.

---

## 📖 API Documentation

### `POST /identify`

Identifies and links a contact based on email and/or phone number.

**Request Body**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```
> At least one of `email` or `phoneNumber` is required.

**Response — 200 OK**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "l.mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "999999"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Error Responses**

| Code | Reason |
|---|---|
| `400` | Both `email` and `phoneNumber` are missing |
| `500` | Internal server error |

---

## 🧠 Business Logic

The API implements the following rules:

1. **New Contact**: If no match is found → creates a new `primary` contact.
2. **Existing Contact**: If a match is found → links to the existing cluster, creates a new `secondary` contact if the request adds new information.
3. **Cluster Merge (Primary Demotion)**: If the request links two previously independent `primary` contacts, the **older one stays primary** and the newer one is **demoted to secondary**.
4. **Response Order**: The primary contact's email/phone always appear **first** in the response arrays.

---

## 🗄️ Database Schema

**Table:** `image_reconcilation` (PostgreSQL on Neon)

| Column | Type | Description |
|---|---|---|
| `id` | Int (PK) | Auto-incremented ID |
| `email` | String? | Optional email address |
| `phoneNumber` | String? | Optional phone number |
| `linkedId` | Int? | ID of the primary contact (if secondary) |
| `linkPrecedence` | String | `"primary"` or `"secondary"` |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated on change |
| `deletedAt` | DateTime? | Soft delete timestamp |

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js v5 |
| ORM | Prisma v7 |
| Database | PostgreSQL (Neon.tech) |
| DB Adapter | `@prisma/adapter-pg` (Driver Adapter) |
| Deployment | Render |

---

## 🛠️ Local Setup

### Prerequisites
- Node.js ≥ 18
- A PostgreSQL database (e.g., [Neon.tech](https://neon.tech) — free tier works)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd identity-reconciliation
npm install
```

### 2. Configure Environment
Create a `.env` file in the root:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host-direct/dbname?sslmode=require"
```
> `DATABASE_URL` = pooled connection (for the app)  
> `DIRECT_URL` = direct connection (for migrations)

### 3. Initialize the Database
```bash
npx prisma migrate dev --name init
```

### 4. (Optional) Seed Sample Data
```bash
npx ts-node prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Server starts at `http://localhost:3000`

---

## 🧪 Test the API

Run these in a PowerShell terminal:

```powershell
# Test 1: Create a new contact
Invoke-RestMethod -Uri "http://localhost:3000/identify" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'

# Test 2: Link a new phone to existing contact (creates secondary)
Invoke-RestMethod -Uri "http://localhost:3000/identify" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"lorraine@hillvalley.edu","phoneNumber":"999999"}'

# Test 3: Merge two clusters (triggers primary demotion)
Invoke-RestMethod -Uri "http://localhost:3000/identify" -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"george@hillvalley.edu","phoneNumber":"717171"}'
```

---

## 🚀 Deployment (Render)

1. Push code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set the following:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`
4. Add these **Environment Variables** in the Render dashboard:
   - `DATABASE_URL` → your Neon pooled connection string
   - `DIRECT_URL` → your Neon direct connection string
5. Deploy!

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma       # Database schema (Contact model → image_reconcilation table)
│   ├── seed.ts             # Sample data seeder
│   └── migrations/         # Migration history
├── prisma.config.ts        # Prisma v7 configuration (URLs, adapter)
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Entry point
│   ├── controllers/
│   │   └── identifyController.ts
│   ├── routes/
│   │   └── identifyRoute.ts
│   ├── services/
│   │   └── identityService.ts  # Core reconciliation logic
│   └── prisma/
│       └── prismaClient.ts     # Prisma client singleton
├── .env                    # Local environment variables (not committed)
├── tsconfig.json
└── package.json
```
