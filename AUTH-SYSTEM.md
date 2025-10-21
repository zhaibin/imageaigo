# Authentication System - Email Verification Code

## 🎉 Status: Fully Deployed & Operational

**Version**: 3.0.0  
**Deployment**: https://imageaigo.cc  
**GitHub**: https://github.com/zhaibin/imageaigo

## Overview

This application uses email verification codes for secure user authentication via Resend.com API. All pages are now updated with full verification code support.

## Features

### ✅ Dual Login Methods
- **Password Login**: Traditional email/username + password
- **Verification Code Login**: Email/username + 6-digit code

### ✅ Username Support  
- Login with **email** or **username**
- Username format: 3-20 characters, alphanumeric + `_` `-`
- Must start with letter or number

### ✅ Verification Code System
- **Registration**: Email verification required
- **Login**: Optional code-based login
- **Password Reset**: Code-based reset
- **Password Change**: Code-based change (logged in users)

## Security Features

🔒 **Rate Limiting**
- IP-level: Max 20 codes per hour per IP
- Email-level: Max 1 code per minute per email
- Login attempts: Locked after 5 failed verification attempts (30 min)

🔒 **Code Security**
- 6-digit random codes
- 10-minute expiration
- Single-use only
- Automatic cleanup

🔒 **Password Requirements**
- Minimum 8 characters
- Must contain letters and numbers

🔒 **Username Validation**
- 3-20 characters
- Regex: `/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/`
- Must start with letter/number

## API Endpoints

### Send Verification Code
```
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com",
  "purpose": "register|login|reset_password|change_password"
}
```

### Register
```
POST /api/auth/register

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "verificationCode": "123456"
}
```

### Login (Password)
```
POST /api/auth/login

{
  "email": "user@example.com",  // or username
  "password": "SecurePass123"
}
```

### Login (Verification Code)
```
POST /api/auth/login

{
  "email": "user@example.com",  // or username
  "verificationCode": "123456"
}
```

### Reset Password
```
POST /api/auth/reset-password

{
  "email": "user@example.com",
  "verificationCode": "123456",
  "newPassword": "NewSecure123"
}
```

### Change Password (Logged In)
```
POST /api/auth/change-password
Authorization: Bearer <session_token>

{
  "verificationCode": "123456",
  "newPassword": "NewSecure123"
}
```

## Environment Variables

```bash
RESEND_API_TOKEN=re_xxxxxxxxxxxx
```

## Setup (✅ Already Deployed)

1. **Configure Resend.com** ✅
   - Sign up at https://resend.com
   - Verify domain: imageaigo.cc
   - Create API key

2. **Set Environment Variable** ⚠️ Required
   ```bash
   wrangler secret put RESEND_API_TOKEN
   ```

3. **Update Database** ✅
   ```bash
   wrangler d1 execute <DB_NAME> --file=schema.sql
   ```

4. **Deploy** ✅
   ```bash
   wrangler deploy
   ```

## Frontend Pages (✅ All Updated)

All user authentication pages have been updated with verification code support:

### 1. Register Page ✅
- Email input with "Get Code" button
- 6-digit verification code input
- 60-second countdown timer
- Username format validation
- Password strength validation

### 2. Login Page ✅
- Dual-tab interface:
  - **Password Login**: Email/Username + Password
  - **Code Login**: Email/Username + Verification Code
- Tab switching with smooth transitions
- "Get Code" button with countdown

### 3. Forgot Password Page ✅
- Email input
- "Send Verification Code" button
- Link to reset password page

### 4. Reset Password Page ✅
- Email input
- Verification code input (6-digit)
- New password input
- Password confirmation

## Email Templates

All emails are sent from `noreply@mail.imageaigo.cc` with professional HTML templates:

- **Registration**: Welcome + verification code
- **Login**: Login verification code
- **Password Reset**: Reset verification code  
- **Password Change**: Change confirmation code

## Testing

See `TEST-API.md` for comprehensive testing guide.

Quick test:
```bash
# 1. Send code
curl -X POST http://localhost:8787/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"register"}'

# 2. Register
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "username":"testuser",
    "password":"Test1234",
    "verificationCode":"123456"
  }'

# 3. Login with username
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser","password":"Test1234"}'
```

## Implementation Files

- `src/email-service.js` - Resend API integration
- `src/verification-code.js` - Code management
- `src/auth.js` - Authentication logic
- `src/index.js` - API routes

## Error Messages

All error messages are in English:
- `Invalid email format`
- `Username must be 3-20 characters...`
- `Password must be at least 8 characters...`
- `Email already registered`
- `Username already taken`
- `Invalid credentials`
- `Verification code expired`
- `Incorrect verification code`
- `Too many failed attempts`
- `Too many requests`

## Performance Optimizations

✅ Database indexes on email, username, verification codes
✅ KV cache for rate limiting
✅ Automatic cleanup of expired codes
✅ Efficient code verification queries

## Documentation

- `QUICK-START.md` - Quick setup guide
- `TEST-API.md` - API testing examples
- `IMPLEMENTATION-SUMMARY.md` - Technical details
- `CHANGELOG.md` - Version history

