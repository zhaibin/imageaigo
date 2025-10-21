# ImageAI Go - Setup Guide

## 🚀 Quick Setup

### Required Environment Variables

```bash
# 1. Resend API (for email verification codes)
wrangler secret put RESEND_API_TOKEN

# 2. Turnstile Secret (optional, for brute-force protection)
wrangler secret put TURNSTILE_SECRET_KEY
```

---

## 📧 1. Resend Configuration

### Get Resend API Key

1. Visit https://resend.com
2. Sign up / Log in
3. Verify domain: `imageaigo.cc`
4. Configure sender: `noreply@mail.imageaigo.cc`
5. Create API key
6. Copy the API key

### Set Environment Variable

```bash
wrangler secret put RESEND_API_TOKEN
# Paste your Resend API key when prompted
```

### Test Email Sending

Visit your site and try:
- Register (sends verification code)
- Login with code (sends verification code)
- Password reset (sends reset link)
- Password change (sends verification code)

---

## 🤖 2. Turnstile Configuration (Optional but Recommended)

### Get Turnstile Keys

1. Visit https://dash.cloudflare.com
2. Navigate to **Turnstile**
3. Click **Add Site**
4. Enter domain: `imageaigo.cc`
5. Choose **Managed** mode
6. Copy **Site Key** and **Secret Key**

### Already Configured Site Key

```
Site Key: 0x4AAAAAAAzX8PJx0lF_CDHO
```

This is already integrated in the code. You only need to add the **Secret Key**:

```bash
wrangler secret put TURNSTILE_SECRET_KEY
# Paste your Turnstile secret key
```

### What if I don't configure it?

**The system still works!**
- ✅ Turnstile widget shows in UI
- ✅ Frontend validation works
- ⚠️ Server-side validation skipped (less secure)
- ✅ Failure tracking still works
- ✅ Account lockout still works

---

## 🗄️ 3. Database Setup

### Already Deployed

The database schema is already deployed with:
- ✅ `users` table
- ✅ `user_sessions` table
- ✅ `password_resets` table
- ✅ `verification_codes` table
- ✅ All indexes

### If you need to re-run:

```bash
wrangler d1 execute imageaigo --remote --file=schema.sql
```

---

## ✅ Verification Checklist

### Test Each Feature

- [ ] **Registration**
  1. Visit /register
  2. Enter email, click "Get Code"
  3. Check email for 6-digit code
  4. Complete registration
  5. ✅ Should work

- [ ] **Login (Password)**
  1. Visit /login
  2. Enter email/username + password
  3. ✅ Should login

- [ ] **Login (Code)**
  1. Visit /login, click "Code Login" tab
  2. Enter email/username, click "Get Code"
  3. Check email for code
  4. Enter code and login
  5. ✅ Should work

- [ ] **Password Reset**
  1. Visit /forgot-password
  2. Enter email, click "Send Reset Link"
  3. Check email for reset link
  4. Click link, enter new password
  5. ✅ Should work

- [ ] **Brute-Force Protection**
  1. Try wrong password twice
  2. See Turnstile CAPTCHA appear
  3. ✅ Protection working

- [ ] **Upload (Logged in)**
  1. Log in
  2. Upload an image
  3. ✅ Should analyze

- [ ] **Upload (Not logged in)**
  1. Log out
  2. Try to upload
  3. See login prompt
  4. ✅ Protection working

---

## 🔐 Security Features

### Current Protection Levels

| Feature | Status | Config Needed |
|---------|--------|---------------|
| Email Verification | ✅ Active | RESEND_API_TOKEN |
| Login Rate Limiting | ✅ Active | None (automatic) |
| Brute-Force Protection | ✅ Active | TURNSTILE_SECRET_KEY (optional) |
| Account Lockout | ✅ Active | None (automatic) |
| IP Tracking | ✅ Active | None (automatic) |
| CAPTCHA (Turnstile) | ✅ Active | TURNSTILE_SECRET_KEY (optional) |

### Without Configuration

Even without environment variables:
- ✅ Basic auth works (password only)
- ✅ Rate limiting works
- ✅ Account lockout works
- ⚠️ Email features won't work
- ⚠️ Server-side Turnstile validation skipped

---

## 📊 Current Status

**Deployment**: ✅ Live at https://imageaigo.cc  
**Database**: ✅ All tables created  
**Code**: ✅ Latest version deployed  
**Documentation**: ✅ Complete  

---

## ⚙️ Environment Variables Summary

```bash
# Required for full functionality
RESEND_API_TOKEN=re_xxxxxxxxxxxx

# Optional (recommended for security)
TURNSTILE_SECRET_KEY=0x4AAAxxxxxxxxxx

# Existing (already configured)
ADMIN_SECRET=your_admin_secret
# ... other existing variables
```

---

## 🧪 Quick Test Script

```bash
# Test registration
curl -X POST https://imageaigo.cc/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","purpose":"register"}'

# Check email for code

# Register
curl -X POST https://imageaigo.cc/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "username":"testuser",
    "password":"Test1234",
    "verificationCode":"123456"
  }'

# Login
curl -X POST https://imageaigo.cc/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser","password":"Test1234"}'
```

---

## 📚 Documentation

- **AUTH-SYSTEM.md** - Authentication system overview
- **BRUTE-FORCE-PROTECTION.md** - Security details
- **TEST-API.md** - API testing guide
- **COMPLETED.md** - Implementation summary
- **UX-IMPROVEMENTS.md** - Recent UX changes
- **SETUP-GUIDE.md** (this file) - Configuration guide

---

## 🆘 Troubleshooting

### Issue: Emails not sending

**Solution**: Configure `RESEND_API_TOKEN`
```bash
wrangler secret put RESEND_API_TOKEN
```

### Issue: Turnstile shows immediately

**Cause**: Normal behavior - it's hidden by CSS
**Note**: Only shows after 2 failed login attempts

### Issue: "请填写此字段" in Chinese

**Solution**: Already fixed! Pages now use `lang="en-US"` and custom validation messages

### Issue: Can't login

**Check**:
1. Database migrated? ✅
2. Correct credentials?
3. Account not locked?
4. Check browser console for errors

---

## 🎯 Next Steps

1. Configure `RESEND_API_TOKEN` ← Most important!
2. Configure `TURNSTILE_SECRET_KEY` (optional)
3. Test all features
4. Monitor logs
5. Enjoy! 🎉

---

**Last Updated**: 2025-10-21  
**Version**: 3.3.0  
**Status**: 🟢 Production Ready

