# Pharmacy API Documentation

Base URL: `http://localhost:5000/api`

## Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login and receive tokens |
| POST | `/auth/refresh` | Public (cookie) | Refresh access token |
| POST | `/auth/logout` | Public | Logout and clear cookie |
| GET | `/auth/me` | Protected | Get current user profile |
| PATCH | `/auth/update-password` | Protected | Change own password |
| POST | `/auth/forgot-password` | Public | Request password reset link |
| PATCH | `/auth/reset-password/:token` | Public | Reset password with token |

## User Management (Owner only)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | Owner | List all users (filterable) |
| POST | `/users` | Owner | Create new user |
| GET | `/users/:id` | Owner | Get user by ID |
| PATCH | `/users/:id` | Owner | Update user |
| DELETE | `/users/:id` | Owner | Deactivate user (soft delete) |
| PATCH | `/users/:id/activate` | Owner | Re-activate user |
| PATCH | `/users/profile` | Protected | Update own profile |

## Medicines

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/medicines` | Protected | List medicines (search, filter, paginate) |
| POST | `/medicines` | Owner/Pharmacist | Create medicine |
| GET | `/medicines/:id` | Protected | Get medicine by ID |
| PUT | `/medicines/:id` | Owner/Pharmacist | Update medicine |
| DELETE | `/medicines/:id` | Owner | Delete medicine |
| GET | `/medicines/low-stock` | Protected | Medicines at or below reorder level |
| GET | `/medicines/expiring` | Protected | Medicines expiring within 30 days |
| GET | `/medicines/expired` | Protected | Expired medicines |

## Inventory

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/inventory` | Protected | List all inventory records |
| GET | `/inventory/summary` | Protected | Inventory summary stats |
| GET | `/inventory/transactions` | Protected | All stock movement history |
| GET | `/inventory/transactions/:medicineId` | Protected | Transactions for a medicine |
| POST | `/inventory/stock-movement` | Protected | Record stock movement |
| GET | `/inventory/:medicineId` | Protected | Inventory for a specific medicine |

## Suppliers

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/suppliers` | Protected | List active suppliers |
| GET | `/suppliers/:id` | Protected | Get supplier by ID |
| POST | `/suppliers` | Owner/Pharmacist | Create supplier |
| PATCH | `/suppliers/:id` | Owner/Pharmacist | Update supplier |
| DELETE | `/suppliers/:id` | Owner | Deactivate supplier (soft delete) |

## Sales

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/sales` | Protected | List sales (filterable, paginated) |
| POST | `/sales` | Protected | Create sale (transactional, deducts stock) |
| GET | `/sales/:id` | Protected | Get sale by ID |
| GET | `/sales/summary/today` | Protected | Today's revenue summary |
| GET | `/sales/summary/range?startDate=&endDate=` | Protected | Revenue summary for date range |

## Purchases

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/purchases` | Protected | List purchases (filterable, paginated) |
| POST | `/purchases` | Protected | Create purchase order |
| GET | `/purchases/:id` | Protected | Get purchase by ID |
| PUT | `/purchases/:id/receive` | Protected | Mark purchase received (adds stock) |
| PUT | `/purchases/:id/cancel` | Owner | Cancel pending purchase |

## Roles
- `owner` — full system access
- `pharmacist` — medicine, inventory, supplier, sales, purchases access; no user management

## Token Strategy
- Access token: short-lived (15m), sent in `Authorization: Bearer <token>` header
- Refresh token: 7 days, stored in `httpOnly` cookie

## Example Payloads

### POST /auth/register
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@pharmacy.com",
  "password": "SecurePass1",
  "role": "pharmacist",
  "phone": "+250788000000"
}
```

### POST /sales
```json
{
  "items": [
    { "medicine": "<mongoId>", "quantity": 2, "unitPrice": 50 }
  ],
  "paymentMethod": "cash",
  "discount": 0,
  "tax": 0,
  "customer": { "name": "John Doe" }
}
```

### POST /purchases
```json
{
  "supplier": "<mongoId>",
  "invoiceNumber": "INV-2025-001",
  "purchaseDate": "2025-01-15T00:00:00.000Z",
  "items": [
    { "medicine": "<mongoId>", "quantity": 100, "purchasePrice": 30 }
  ]
}
```
