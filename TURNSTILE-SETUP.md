# 🔐 Cloudflare Turnstile Configuration Guide

## What is Turnstile?

Cloudflare Turnstile is a privacy-friendly CAPTCHA alternative that provides smart, invisible human verification without requiring users to solve puzzles.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Turnstile Site

1. **Visit Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/?to=/:account/turnstile
   ```

2. **Click "Add Site"**

3. **Fill in Details**
   - **Site Name**: ImageAI Go (or any name you prefer)
   - **Domain**: `imageaigo.cc` (or leave blank for testing)
   - **Widget Mode**: Managed
   - **Widget Type**: Visible

4. **Click "Create"**

### Step 2: Get Your Keys

After creating the site, you'll see two keys:

```
Site Key (Public): 0x4AAAAAAA...
Secret Key (Private): 0x4AAAAAAA...
```

**Important**: 
- ✅ Site Key is already configured in the frontend code
- ⚠️ You need to configure the Secret Key in Cloudflare Workers

### Step 3: Configure Secret Key

#### Option A: Using Wrangler CLI (Recommended)

```bash
cd /Users/zhaibin/Code/cf_worker/imageaigo

# Set the secret key
wrangler secret put TURNSTILE_SECRET_KEY
# When prompted, paste your Secret Key and press Enter
```

#### Option B: Using Cloudflare Dashboard

1. Go to Workers & Pages → imageaigo → Settings → Variables
2. Click "Add variable"
3. Name: `TURNSTILE_SECRET_KEY`
4. Type: Secret
5. Value: Paste your Secret Key
6. Click "Save"

### Step 4: Update Frontend Site Key (if needed)

If your Site Key is different from `0x4AAAAAAACxIrRaibzD1pfM`, update it in:

**File**: `src/user-pages.js`

Find and replace both instances:
```html
<!-- Old -->
<div class="cf-turnstile" data-sitekey="0x4AAAAAAACxIrRaibzD1pfM" ...></div>

<!-- New -->
<div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY_HERE" ...></div>
```

### Step 5: Deploy Changes

```bash
# If you updated the site key
wrangler deploy

# If you only added the secret
# No deployment needed - secrets are applied immediately
```

---

## 🧪 Testing

### Test 1: Verify Turnstile Loads

1. Visit https://imageaigo.cc/login
2. Open Browser Console (F12)
3. Look for any Turnstile errors
4. Should see: `challenges.cloudflare.com` script loaded

### Test 2: Trigger CAPTCHA

1. Enter **wrong password** on login page
2. Submit form
3. Enter **wrong password** again
4. **Turnstile CAPTCHA should appear** after 2nd failure

### Test 3: Verify Backend Validation

1. Trigger CAPTCHA (wrong password 2x)
2. Complete CAPTCHA
3. Enter **correct password**
4. Should login successfully

---

## 🔍 Troubleshooting

### Issue 1: CAPTCHA Never Shows

**Symptoms**: No CAPTCHA appears even after multiple failures

**Solution**:
1. Check browser console for errors
2. Verify `challenges.cloudflare.com` is not blocked
3. Clear cache and reload page
4. Try in incognito mode

### Issue 2: CAPTCHA Shows But Login Fails

**Symptoms**: "Human verification failed" error

**Possible Causes**:
- ❌ `TURNSTILE_SECRET_KEY` not configured
- ❌ Wrong Secret Key
- ❌ Site Key doesn't match Secret Key

**Solution**:
```bash
# Check current secrets
wrangler secret list

# Update secret if needed
wrangler secret put TURNSTILE_SECRET_KEY
```

### Issue 3: Site Key Mismatch

**Symptoms**: Console error: "Invalid site key"

**Solution**:
1. Copy Site Key from Cloudflare Dashboard
2. Update in `src/user-pages.js` (lines 285, 314)
3. Deploy: `wrangler deploy`

### Issue 4: "No such secret found"

**Symptoms**: Worker logs show "Secret key not configured"

**Solution**:
```bash
# Verify secret exists
wrangler secret list

# If not found, create it
wrangler secret put TURNSTILE_SECRET_KEY

# Verify it's set
wrangler tail
# Then trigger login to see logs
```

---

## 📊 How It Works

### Frontend (Client-Side)

1. **Load Turnstile Script**
   ```html
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
   ```

2. **Render Widget** (when needed)
   ```html
   <div class="cf-turnstile" 
        data-sitekey="0x4AAAAAAACxIrRaibzD1pfM" 
        data-theme="light">
   </div>
   ```

3. **Get Token**
   ```javascript
   const token = turnstile.getResponse();
   ```

4. **Send to Backend**
   ```javascript
   fetch('/api/auth/login', {
     body: JSON.stringify({ email, password, turnstileToken: token })
   });
   ```

### Backend (Server-Side)

1. **Verify Token**
   ```javascript
   const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       secret: env.TURNSTILE_SECRET_KEY,
       response: token,
       remoteip: ip
     })
   });
   ```

2. **Check Result**
   ```javascript
   if (result.success) {
     // Allow login
   } else {
     // Reject with error
   }
   ```

---

## 🎯 Current Configuration Status

### ✅ Already Configured
- [x] Frontend script loaded
- [x] Widget HTML added
- [x] Site Key in frontend (`0x4AAAAAAACxIrRaibzD1pfM`)
- [x] Backend verification code
- [x] Failure tracking logic
- [x] Progressive CAPTCHA display

### ⚠️ Needs Configuration
- [ ] `TURNSTILE_SECRET_KEY` in Cloudflare Workers

---

## 🔑 Getting Your Turnstile Keys

### Quick Link
```
https://dash.cloudflare.com/?to=/:account/turnstile
```

### Step-by-Step

1. **Login to Cloudflare**
   - Use your Cloudflare account

2. **Navigate to Turnstile**
   - Sidebar → Security → Turnstile

3. **Create Site**
   - Click "Add Site"
   - Enter domain: `imageaigo.cc`
   - Select "Managed" mode

4. **Copy Keys**
   - **Site Key**: Use in frontend (already done if using `0x4AAAAAAACxIrRaibzD1pfM`)
   - **Secret Key**: Configure in Wrangler secrets

---

## 📝 Configuration Commands

### Set Secret Key
```bash
# Interactive
wrangler secret put TURNSTILE_SECRET_KEY

# Or with value (less secure, avoid in production)
echo "your_secret_key" | wrangler secret put TURNSTILE_SECRET_KEY
```

### Verify Secret Key
```bash
# List all secrets
wrangler secret list

# Should show:
# - TURNSTILE_SECRET_KEY
# - RESEND_API_TOKEN
```

### Test in Development
```bash
# Create .dev.vars file (for local testing only)
echo "TURNSTILE_SECRET_KEY=your_secret_key_here" >> .dev.vars
echo "RESEND_API_TOKEN=your_resend_token_here" >> .dev.vars

# Run locally
wrangler dev

# IMPORTANT: Never commit .dev.vars to git!
# It's already in .gitignore
```

---

## 🚨 Security Notes

### ⚠️ Important
- **Never commit Secret Keys** to Git
- **Never expose Secret Keys** in frontend code
- **Always use Wrangler secrets** for production
- **Use `.dev.vars`** for local development only

### ✅ Best Practices
- Rotate keys periodically
- Monitor Turnstile analytics
- Check failure logs regularly
- Update Turnstile widget settings as needed

---

## 📞 Need Help?

### Cloudflare Turnstile Docs
```
https://developers.cloudflare.com/turnstile/
```

### Check Configuration
```bash
# View worker logs
wrangler tail

# Test login and check for Turnstile messages:
# - "[Turnstile] Secret key not configured" → Need to set secret
# - "[Turnstile] Verification successful" → ✅ Working!
# - "[Turnstile] Verification failed" → Check keys match
```

---

## ✨ What Happens After Configuration?

### Without Secret Key (Current State)
```
1. User fails login 2x
2. CAPTCHA appears ✅
3. User completes CAPTCHA
4. Backend SKIPS verification ⚠️
5. Login based on password only
```

### With Secret Key (Recommended)
```
1. User fails login 2x
2. CAPTCHA appears ✅
3. User completes CAPTCHA ✅
4. Backend verifies CAPTCHA ✅
5. Login requires both: correct password + valid CAPTCHA ✅
```

**The system still works without the secret key, but adding it provides maximum security!**

---

**Generated**: 2025-10-21  
**Version**: 1.0.0  
**Status**: Ready for configuration

