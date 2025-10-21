# API Testing Guide

## Quick Test Commands

### 1. Send Verification Code

```bash
# Register verification code
curl -X POST http://localhost:8787/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"register"}'

# Login verification code
curl -X POST http://localhost:8787/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"login"}'

# Reset password verification code
curl -X POST http://localhost:8787/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"reset_password"}'
```

### 2. User Registration

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "username":"testuser",
    "password":"Test1234",
    "verificationCode":"123456"
  }'
```

### 3. User Login

#### Password Login
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test1234"
  }'

# Or login with username
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser",
    "password":"Test1234"
  }'
```

#### Verification Code Login
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "verificationCode":"123456"
  }'

# Or with username
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"testuser",
    "verificationCode":"123456"
  }'
```

### 4. Password Reset

#### Request Reset
```bash
curl -X POST http://localhost:8787/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### Reset Password
```bash
curl -X POST http://localhost:8787/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "verificationCode":"123456",
    "newPassword":"NewPass1234"
  }'
```

### 5. Change Password (Logged in)

```bash
# First, get the session token from login response
# Then request code
curl -X POST http://localhost:8787/api/auth/send-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"purpose":"change_password"}'

# Change password
curl -X POST http://localhost:8787/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "verificationCode":"123456",
    "newPassword":"NewPass1234"
  }'
```

## Testing Scenarios

### Scenario 1: New User Registration
1. Send verification code to email
2. Check email for 6-digit code
3. Register with code
4. Login with credentials

### Scenario 2: Login with Verification Code
1. Send login verification code
2. Check email
3. Login with code

### Scenario 3: Password Reset
1. Request password reset (sends code)
2. Check email for code
3. Reset password with code
4. Login with new password

### Scenario 4: Username Login
1. Try logging in with username instead of email
2. Should work for both password and code login

## Expected Responses

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  ...
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Login Success Response
```json
{
  "success": true,
  "message": "Login successful",
  "sessionToken": "...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

## Common Error Messages

- `Invalid email format` - Email format is incorrect
- `Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens`
- `Password must be at least 8 characters with letters and numbers`
- `Email already registered`
- `Username already taken`
- `Invalid credentials` - Wrong email/username or password
- `User not found`
- `Verification code not found or expired`
- `Verification code already used`
- `Incorrect verification code`
- `Please wait 1 minute before requesting another code`
- `Session expired, please log in again`

## Username Format Rules

- Length: 3-20 characters
- Allowed characters: letters (a-z, A-Z), numbers (0-9), underscore (_), hyphen (-)
- Must start with a letter or number
- Examples:
  - Valid: `john`, `user123`, `test_user`, `my-name`
  - Invalid: `ab`, `_test`, `-user`, `this_is_a_very_long_username_that_exceeds_20_chars`

## Notes

- Verification codes are valid for 10 minutes
- Can only request a new code after 1 minute
- Codes are single-use only
- Sessions are valid for 30 days
- Email OR username can be used for login

