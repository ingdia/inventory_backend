# Pharmacy API — Auth & User Management

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

## User Management Endpoints (Owner only)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | Owner | List all users (filterable) |
| POST | `/users` | Owner | Create new user |
| GET | `/users/:id` | Owner | Get user by ID |
| PATCH | `/users/:id` | Owner | Update user |
| DELETE | `/users/:id` | Owner | Deactivate user (soft delete) |
| PATCH | `/users/:id/activate` | Owner | Re-activate user |
| PATCH | `/users/profile` | Protected | Update own profile |

## Roles
- `owner` — full system access
- `pharmacist` — limited access (no user management)

## Token Strategy
- Access token: 15min, sent in Authorization header (`Bearer <token>`)
- Refresh token: 7 days, stored in httpOnly cookie

## Register Payload
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

## Login Payload
```json
{
  "email": "jane@pharmacy.com",
  "password": "SecurePass1"
}
```
