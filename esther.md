# Esther's Project Notes — Pharmacy Management Backend
> Last updated: based on current state of `feature/medicines-inventory-module`
> Repo: https://github.com/ingdia/inventory_backend

---

## What This Project Is

A **Node.js + Express + MongoDB** backend for a Pharmacy Management System.
It has two main parts — built by different people:

| Module | Built by |
|---|---|
| Auth & User Management | Diane |
| Medicines & Inventory | Esther (you) |

The frontend team is also separate and connects to this backend via REST API.

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Node.js | - | Runtime |
| Express | ^5.2.1 | Web framework |
| MongoDB | local | Database |
| Mongoose | ^9.6.3 | ODM |
| bcryptjs | ^3.0.3 | Password hashing |
| jsonwebtoken | ^9.0.3 | JWT auth |
| express-validator | ^7.3.2 | Input validation |
| express-rate-limit | ^8.5.2 | Rate limiting |
| helmet | ^8.2.0 | Security headers |
| morgan | ^1.11.0 | Request logging |
| cookie-parser | ^1.4.7 | Cookie handling |
| dotenv | ^17.4.2 | Env vars |
| nodemon | ^3.1.14 | Dev auto-restart |

---

## Folder Structure

```
src/
├── config/
│   └── db.js                        ← MongoDB connection + event logging
├── controllers/
│   ├── auth.controller.js           ← login, register, refresh, logout, forgot/reset password
│   └── user.controller.js           ← CRUD users, profile update (owner only)
├── middleware/
│   ├── auth.middleware.js           ← protect (JWT verify) + restrictTo (RBAC)
│   ├── error.middleware.js          ← global error handler
│   ├── rateLimiter.js               ← auth + api rate limiters
│   └── validate.middleware.js       ← express-validator error handler
├── models/
│   └── User.js                      ← User schema with bcrypt + password tracking
├── modules/
│   ├── medicines/
│   │   ├── medicine.model.js        ← Medicine schema
│   │   ├── medicine.controller.js   ← CRUD + low-stock/expiring/expired
│   │   ├── medicine.routes.js       ← /api/medicines routes
│   │   └── medicine.validation.js   ← express-validator rules
│   └── inventory/
│       ├── inventory.model.js       ← Inventory schema (1 per medicine)
│       ├── inventoryTransaction.model.js ← Stock movement history
│       ├── inventory.controller.js  ← stock movement, summary, transactions
│       ├── inventory.routes.js      ← /api/inventory routes
│       └── inventory.validation.js  ← stock movement validation rules
├── routes/
│   ├── auth.routes.js               ← /api/auth routes
│   └── user.routes.js               ← /api/users routes
├── utils/
│   ├── jwt.js                       ← sign/verify access + refresh tokens
│   └── response.js                  ← sendSuccess / sendError helpers
├── validators/
│   └── auth.validator.js            ← validation rules for auth + profile
├── app.js                           ← Express app setup (middleware, routes)
└── server.js                        ← Entry point (DB connect + listen)
```

---

## Environment Variables (.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pharmacy
JWT_ACCESS_SECRET=your_secret        ← CHANGE IN PRODUCTION
JWT_REFRESH_SECRET=your_secret       ← CHANGE IN PRODUCTION (use different value)
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

> ⚠️ Both JWT secrets are the same right now. In production use two different strong random strings.

---

## How to Run

```bash
npm run dev     # development (nodemon)
npm start       # production
```

Expected output:
```
✅ Server running on port 5000
MongoDB connected successfully
```

---

## All API Endpoints

### Auth — /api/auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login, returns accessToken |
| POST | /api/auth/refresh | Cookie | Refresh access token |
| POST | /api/auth/logout | Cookie | Logout, clears refresh token |
| GET | /api/auth/me | Bearer | Get own profile |
| PATCH | /api/auth/update-password | Bearer | Change password (needs current) |
| POST | /api/auth/forgot-password | Public | Request password reset token |
| PATCH | /api/auth/reset-password/:token | Public | Reset password with token |

### Users — /api/users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/users | Owner | Get all users (paginated, filterable) |
| POST | /api/users | Owner | Create user |
| GET | /api/users/:id | Owner | Get user by ID |
| PATCH | /api/users/:id | Owner | Update user (role, status, etc.) |
| DELETE | /api/users/:id | Owner | Deactivate user (soft delete) |
| PATCH | /api/users/:id/activate | Owner | Re-activate user |
| PATCH | /api/users/profile | Bearer | Update own profile |

### Medicines — /api/medicines

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/medicines | Bearer | Get all (paginated, searchable, filterable) |
| POST | /api/medicines | Owner/Pharmacist | Create medicine + auto-creates inventory |
| GET | /api/medicines/:id | Bearer | Get single medicine |
| PUT | /api/medicines/:id | Owner/Pharmacist | Update medicine |
| DELETE | /api/medicines/:id | Owner | Delete medicine + deletes inventory |
| GET | /api/medicines/low-stock | Bearer | Medicines at or below reorder level |
| GET | /api/medicines/expiring | Bearer | Expiring within 30 days |
| GET | /api/medicines/expired | Bearer | Already expired |

Query params for GET /api/medicines:
- `search` — name or genericName
- `category` — category ID
- `supplier` — supplier ID
- `status` — active / inactive
- `page` — default 1
- `limit` — default 10
- `sortBy` — default createdAt
- `sortOrder` — asc / desc

### Inventory — /api/inventory

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/inventory | Bearer | All inventory (paginated) |
| GET | /api/inventory/:medicineId | Bearer | Inventory for one medicine |
| POST | /api/inventory/stock-movement | Bearer | Record stock in/out/adjustment |
| GET | /api/inventory/transactions | Bearer | All transaction history (paginated) |
| GET | /api/inventory/transactions/:medicineId | Bearer | Transactions for one medicine |
| GET | /api/inventory/summary | Bearer | Dashboard stats |

Stock movement body:
```json
{
  "medicineId": "<ObjectId>",
  "type": "stock_in | stock_out | adjustment",
  "quantity": 50,
  "reason": "optional reason"
}
```

Summary response:
```json
{
  "totalMedicines": 0,
  "totalStockValue": 0,
  "lowStockCount": 0,
  "expiringCount": 0,
  "expiredCount": 0,
  "outOfStockCount": 0
}
```

---

## Authentication Flow

```
1. User calls POST /api/auth/login
   → Gets accessToken (15min) in response body
   → Gets refreshToken (7d) in httpOnly cookie

2. Frontend attaches accessToken to every request:
   Authorization: Bearer <accessToken>

3. When accessToken expires (401 response):
   → Frontend calls POST /api/auth/refresh (cookie is sent automatically)
   → Gets new accessToken in response
   → Retries original request with new token

4. On logout:
   → POST /api/auth/logout
   → refreshToken removed from DB + cookie cleared
```

---

## Roles & Permissions

| Action | Owner | Pharmacist |
|---|---|---|
| Login / profile / password | ✅ | ✅ |
| View medicines | ✅ | ✅ |
| Create / update medicine | ✅ | ✅ |
| Delete medicine | ✅ | ❌ |
| View inventory | ✅ | ✅ |
| Stock movements | ✅ | ✅ |
| View users | ✅ | ❌ |
| Create / update / delete users | ✅ | ❌ |

---

## Password Rules (register / reset / update)

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Example valid password: `Test1234`

---

## Rate Limiting

| Limiter | Dev | Production | Notes |
|---|---|---|---|
| authLimiter | 100 / 15min | 20 / 15min | Only failed requests count |
| apiLimiter | 1000 / 1min | 300 / 1min | Only failed requests count |

---

## Bugs Fixed During Development

| Bug | Cause | Fix |
|---|---|---|
| `TypeError: next is not a function` on register | Mongoose 7+ async pre-save hook doesn't accept `next` param | Removed `next` param from pre-save hook |
| Login always 401 after register fix | Users registered before fix had plaintext passwords in DB | Cleared DB, re-registered |
| Login took 500ms+ | bcrypt cost 12 in dev | Cost 10 in dev, 12 in production only |
| Login still slow after saving | `user.save()` triggered pre-save hook → re-hashed password | Replaced with `User.updateOne()` to skip hook |
| Rate limiter blocking normal usage | authLimiter max was 10, apiLimiter max was 100 | Raised limits, added `skipSuccessfulRequests: true` |
| Forgot password not working | Endpoint didn't exist | Added `POST /forgot-password` + `PATCH /reset-password/:token` |

---

## What Is Currently Working ✅

- Server starts and connects to MongoDB
- Register new users
- Login returns accessToken + sets refresh cookie
- Token refresh works
- Logout invalidates tokens
- Forgot password / reset password flow (dev returns token directly)
- All medicine CRUD endpoints
- Low stock / expiring / expired medicine queries
- Full inventory tracking with transaction history
- Dashboard summary stats
- Role-based access control (owner vs pharmacist)
- Input validation on all write endpoints
- Global error handling
- Rate limiting

---

## What Is Missing or Broken ❌

### 1. Frontend axios interceptor is broken (NOT a backend issue)
The frontend keeps firing 401 requests in an infinite loop because:
- It sends a request → gets 401 (expired token)
- Calls /api/auth/refresh → gets 200 + new token
- Fires the original request again → still 401 (using old token, not the new one)
- Loops forever until rate limited

**Fix needed on frontend:** The axios interceptor must:
1. Queue all failed requests while refresh is in progress
2. Wait for refresh to complete
3. Retry ALL queued requests with the NEW token
4. Only call refresh once, not once per failed request

Ask the frontend team to fix their axios interceptor.

### 2. Categories API missing — GET /api/categories → 404
The Medicine model has `category: ObjectId ref 'Category'` but there is no:
- Category model
- Category controller
- Category routes

The frontend is already calling `/api/categories`. This needs to be built.
This is likely a teammate's responsibility — confirm with team.

### 3. Suppliers API missing — GET /api/suppliers → 404
Same situation as categories. The Medicine model has `supplier: ObjectId ref 'Supplier'`
but no Supplier module exists.

The frontend is calling `/api/suppliers`. Needs to be built.

### 4. Forgot password email not sent in production
Currently in `NODE_ENV=development` the reset token is returned in the API response.
In production it should be emailed to the user but no email service (Nodemailer/SendGrid) is set up.

**Before going to production:** integrate an email service and replace the dev token response
with an actual email send.

### 5. JWT secrets are identical in .env
`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are both set to `your_secret`.
**Before production:** use two different strong random strings.
Generate them with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 6. No image upload for medicines
The spec mentioned Multer for medicine images but it was not implemented.
If the frontend needs medicine images, Multer needs to be added to the medicine module.

---

## Database Collections

| Collection | Model | Description |
|---|---|---|
| users | User | All pharmacy staff accounts |
| medicines | Medicine | Medicine catalog |
| inventories | Inventory | Current stock per medicine (1-to-1) |
| inventorytransactions | InventoryTransaction | Full history of stock changes |

> Categories and Suppliers collections don't exist yet — need to be created.

---

## Git Branch

All your work is on: `feature/medicines-inventory-module`

Commits pushed (in order):
1. `feat(medicines): add Medicine mongoose schema with timestamps`
2. `feat(medicines): add express-validator rules for create and update`
3. `feat(medicines): add CRUD, low-stock, expiring, and expired controllers`
4. `feat(medicines): add protected routes with role-based access control`
5. `feat(inventory): add Inventory mongoose schema with unique medicine ref`
6. `feat(inventory): add InventoryTransaction schema for stock movement history`
7. `feat(inventory): add express-validator rules for stock movement`
8. `feat(inventory): add stock movement, transactions, and summary controllers`
9. `feat(inventory): add protected inventory and transaction routes`
10. `feat(app): mount /api/medicines and /api/inventory routes`
11. `feat(middleware): add standalone validate middleware as per folder structure spec`
12. `fix(routes): import validate from middleware instead of auth.validator`
13. `fix(server): move app.listen to bottom with PORT fallback and success log`
14. `feat(config): add mongoose connection event listeners for logging`
15. `fix(user): remove next param from async pre-save hook for Mongoose 7+ compatibility`
16. `feat(user): add passwordResetToken and passwordResetExpiresAt fields to schema`
17. `feat(auth): add resetPasswordRules validator`
18. `feat(auth): add forgotPassword and resetPassword controllers`
19. `feat(auth): add POST /forgot-password and PATCH /reset-password/:token routes`
20. `perf(user): use bcrypt cost 10 in dev and 12 in production for faster login`
21. `perf(auth): optimize login — early exit before bcrypt, use updateOne to skip pre-save hook`
22. `fix(rateLimit): raise auth limit to 100 dev/20 prod, skip successful requests`
23. `perf(auth): use updateOne in refresh to skip pre-save hook`
24. `fix(rateLimit): raise apiLimiter to 1000 dev/300 prod, skip successful requests`

---

## Quick Test Sequence (Postman / any client)

```
1. Register
   POST http://localhost:5000/api/auth/register
   Body: {
     "firstName": "Esther",
     "lastName": "Test",
     "email": "esther@test.com",
     "password": "Test1234",
     "role": "owner"
   }

2. Login
   POST http://localhost:5000/api/auth/login
   Body: { "email": "esther@test.com", "password": "Test1234" }
   → Copy the accessToken from response

3. Get medicines (use token from step 2)
   GET http://localhost:5000/api/medicines
   Header: Authorization: Bearer <accessToken>

4. Create medicine
   POST http://localhost:5000/api/medicines
   Header: Authorization: Bearer <accessToken>
   Body: {
     "name": "Paracetamol",
     "category": "<any ObjectId>",
     "unit": "tablet",
     "purchasePrice": 5,
     "sellingPrice": 10
   }

5. Get inventory summary
   GET http://localhost:5000/api/inventory/summary
   Header: Authorization: Bearer <accessToken>

6. Forgot password
   POST http://localhost:5000/api/auth/forgot-password
   Body: { "email": "esther@test.com" }
   → In dev, response contains resetToken

7. Reset password
   PATCH http://localhost:5000/api/auth/reset-password/<resetToken>
   Body: { "password": "NewPass123" }
```

---

## Things to Tell Your Team

1. **Frontend team** — fix the axios interceptor. The 401 loop is entirely on your side.
   The backend refresh endpoint works correctly (returns 200 + new token).
   You need to queue requests during refresh and retry them with the new token.

2. **Categories module teammate** — `GET /api/categories` is returning 404.
   The medicines module references a `Category` model that doesn't exist yet.
   This needs to be built and mounted in `app.js`.

3. **Suppliers module teammate** — same as above for `GET /api/suppliers`.

4. **Before production deployment:**
   - Change both JWT secrets to different strong random strings
   - Set `NODE_ENV=production`
   - Set `MONGO_URI` to your production MongoDB URI
   - Integrate an email service for forgot-password
   - Make sure `CLIENT_ORIGIN` points to your real frontend domain
