# PharmaManager — Inventory Backend

A RESTful API backend for a pharmacy inventory management system built with Node.js, Express, and MongoDB.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (Access + Refresh tokens)
- **Docs:** Swagger UI (swagger-jsdoc + swagger-ui-express)
- **Security:** Helmet, CORS, Rate Limiting

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally or a MongoDB Atlas URI

### Installation

```bash
git clone https://github.com/ingdia/inventory_backend.git
cd inventory_backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/pharmacy_db
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

---

## API Documentation

Swagger UI is available at:

```
http://localhost:5000/api/docs
```

---

## API Endpoints

### Auth — `POST /api/auth`
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and get token | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout | Public |
| GET | `/auth/me` | Get current user | Protected |
| PATCH | `/auth/update-password` | Update password | Protected |
| POST | `/auth/forgot-password` | Request password reset | Public |
| PATCH | `/auth/reset-password/:token` | Reset password | Public |

### Users — `/api/users`
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | Get all users | Owner |
| POST | `/users` | Create user | Owner |
| GET | `/users/:id` | Get user by ID | Owner |
| PATCH | `/users/:id` | Update user | Owner |
| DELETE | `/users/:id` | Delete user | Owner |
| PATCH | `/users/:id/activate` | Toggle user activation | Owner |
| PATCH | `/users/profile` | Update own profile | Protected |

### Medicines — `/api/medicines`
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/medicines` | Get all medicines | Protected |
| POST | `/medicines` | Create medicine | Owner/Pharmacist |
| GET | `/medicines/:id` | Get medicine by ID | Protected |
| PUT | `/medicines/:id` | Update medicine | Owner/Pharmacist |
| DELETE | `/medicines/:id` | Delete medicine | Owner |
| GET | `/medicines/low-stock` | Get low stock medicines | Protected |
| GET | `/medicines/expiring` | Get expiring medicines | Protected |
| GET | `/medicines/expired` | Get expired medicines | Protected |

### Inventory — `/api/inventory`
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/inventory` | Get all inventory | Protected |
| GET | `/inventory/summary` | Get inventory summary | Protected |
| GET | `/inventory/:medicineId` | Get inventory by medicine | Protected |
| POST | `/inventory/stock-movement` | Record stock movement | Protected |
| GET | `/inventory/transactions` | Get all transactions | Protected |
| GET | `/inventory/transactions/:medicineId` | Get transactions by medicine | Protected |

### Sales — `/api/sales`
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/sales` | Get all sales | Protected |
| POST | `/sales` | Create a sale | Protected |
| GET | `/sales/:id` | Get sale by ID | Protected |

### Purchases — `/api/purchases`
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/purchases` | Get all purchases | Protected |
| POST | `/purchases` | Create a purchase | Protected |
| GET | `/purchases/:id` | Get purchase by ID | Protected |

### Suppliers — `/api/suppliers`
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/suppliers` | Get all suppliers | Protected |
| POST | `/suppliers` | Create supplier | Owner |
| GET | `/suppliers/:id` | Get supplier by ID | Protected |
| PATCH | `/suppliers/:id` | Update supplier | Owner |
| DELETE | `/suppliers/:id` | Delete supplier | Owner |

### Dashboard — `/api/dashboard` (Owner only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/metrics` | KPI metric cards |
| GET | `/dashboard/revenue-chart` | Revenue over time |
| GET | `/dashboard/top-medicines` | Top 10 selling medicines |
| GET | `/dashboard/sales-by-payment` | Sales by payment method |
| GET | `/dashboard/profit-summary` | Revenue, COGS, profit |
| GET | `/dashboard/recent-sales` | Last 5 sales |
| GET | `/dashboard/low-stock` | Low stock alerts |
| GET | `/dashboard/expiring` | Expiring medicines |

### Reports — `/api/reports` (Owner only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/sales` | Sales report with filters |
| GET | `/reports/inventory` | Inventory snapshot report |
| GET | `/reports/profit-loss` | Profit & Loss report |
| GET | `/reports/purchases` | Purchases report |

---

## Project Structure

```
src/
├── config/          # DB connection, Swagger config
├── controllers/     # Auth, User controllers
├── middleware/      # Auth, error, rate limiter, validate
├── models/          # User model
├── modules/
│   ├── auth/
│   ├── dashboard/   # Dashboard APIs (Chantal)
│   ├── inventory/   # Inventory module (Esther)
│   ├── medicines/   # Medicines module (Esther)
│   ├── purchases/   # Purchases module (Kelia)
│   ├── reports/     # Reports APIs (Chantal)
│   ├── sales/       # Sales module (Kelia)
│   └── suppliers/   # Suppliers module (Kelia)
├── routes/          # Auth, User routes
├── utils/           # JWT, response helpers
├── validators/      # Auth validators
├── app.js
└── server.js
```

---

## Branch Strategy

```
main          ← production ready
develop       ← integration & testing
feature/*     ← individual feature branches
```

### Feature Branches
| Branch | Developer | Description |
|--------|-----------|-------------|
| `feature/diane-auth-backend` | Diane | Auth & User management |
| `feature/medicines-inventory-module` | Esther | Medicines & Inventory |
| `feature/sales-purchase` | Kelia | Sales, Purchases & Suppliers |
| `feature/dashboard-reports` | Chantal | Dashboard & Reports |

---

## Team

| Developer | Module |
|-----------|--------|
| Diane | Auth & Users |
| Esther | Medicines & Inventory |
| Kelia | Sales, Purchases & Suppliers |
| Chantal | Dashboard & Reports |
