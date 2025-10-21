#!/bin/bash

# Cloudflare Turnstile Configuration Checker
# 检查 Turnstile 配置状态

echo "🔍 Checking Turnstile Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check 1: Frontend Site Key
echo "1️⃣ Checking Frontend Site Key..."
if grep -q "data-sitekey=\"0x4AAAAAAACxIrRaibzD1pfM\"" src/user-pages.js; then
    echo -e "${GREEN}✅ Site Key found in frontend${NC}"
    SITE_KEY="0x4AAAAAAACxIrRaibzD1pfM"
    echo "   Site Key: $SITE_KEY"
else
    echo -e "${RED}❌ Site Key not found in frontend${NC}"
    echo "   Please check src/user-pages.js"
fi
echo ""

# Check 2: Turnstile Script
echo "2️⃣ Checking Turnstile Script..."
if grep -q "challenges.cloudflare.com/turnstile" src/user-pages.js; then
    echo -e "${GREEN}✅ Turnstile script included${NC}"
else
    echo -e "${RED}❌ Turnstile script not found${NC}"
fi
echo ""

# Check 3: Secret Key in Wrangler
echo "3️⃣ Checking Wrangler Secrets..."
if command -v wrangler &> /dev/null; then
    if wrangler secret list | grep -q "TURNSTILE_SECRET_KEY"; then
        echo -e "${GREEN}✅ TURNSTILE_SECRET_KEY is configured${NC}"
        SECRET_CONFIGURED=true
    else
        echo -e "${YELLOW}⚠️  TURNSTILE_SECRET_KEY not found${NC}"
        echo "   Run: wrangler secret put TURNSTILE_SECRET_KEY"
        SECRET_CONFIGURED=false
    fi
else
    echo -e "${RED}❌ Wrangler CLI not found${NC}"
    echo "   Install: npm install -g wrangler"
fi
echo ""

# Check 4: Verification Code
echo "4️⃣ Checking Backend Verification..."
if grep -q "verifyTurnstile" src/brute-force-protection.js; then
    echo -e "${GREEN}✅ Backend verification code exists${NC}"
else
    echo -e "${RED}❌ Backend verification code not found${NC}"
fi
echo ""

# Check 5: Dev Vars (local testing)
echo "5️⃣ Checking Local Dev Configuration..."
if [ -f .dev.vars ]; then
    if grep -q "TURNSTILE_SECRET_KEY" .dev.vars; then
        echo -e "${GREEN}✅ .dev.vars configured for local testing${NC}"
    else
        echo -e "${YELLOW}⚠️  TURNSTILE_SECRET_KEY not in .dev.vars${NC}"
        echo "   For local testing, add: TURNSTILE_SECRET_KEY=your_key"
    fi
else
    echo -e "${YELLOW}⚠️  .dev.vars not found${NC}"
    echo "   Create for local testing: touch .dev.vars"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$SECRET_CONFIGURED" = true ]; then
    echo -e "${GREEN}✅ Turnstile is FULLY CONFIGURED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy: wrangler deploy"
    echo "2. Test: Visit https://imageaigo.cc/login"
    echo "3. Trigger CAPTCHA: Enter wrong password 2x"
else
    echo -e "${YELLOW}⚠️  Turnstile is PARTIALLY CONFIGURED${NC}"
    echo ""
    echo "To complete setup:"
    echo ""
    echo "1️⃣ Get your Turnstile keys:"
    echo "   https://dash.cloudflare.com/?to=/:account/turnstile"
    echo ""
    echo "2️⃣ Create a new site:"
    echo "   - Domain: imageaigo.cc"
    echo "   - Widget Mode: Managed"
    echo ""
    echo "3️⃣ Configure Secret Key:"
    echo "   wrangler secret put TURNSTILE_SECRET_KEY"
    echo ""
    echo "4️⃣ (Optional) Update Site Key in src/user-pages.js"
    echo "   Current: 0x4AAAAAAACxIrRaibzD1pfM"
    echo "   Replace with your Site Key if different"
    echo ""
    echo "5️⃣ Deploy:"
    echo "   wrangler deploy"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For detailed guide, see: TURNSTILE-SETUP.md"
echo ""

