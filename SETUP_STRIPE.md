# 🚀 Stripe Setup Guide for Autopilot

## Quick Start (5 Minutes)

### 1. Environment Variables
Your `.env.local` already has Stripe keys configured:
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Add Webhook Secret

#### For Local Development
```bash
# Install Stripe CLI (if not installed)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost (keep this running)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret (starts with whsec_...)
# Add to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

#### For Production
1. Deploy your app to production
2. Go to https://dashboard.stripe.com/webhooks
3. Click "+ Add endpoint"
4. Enter: `https://yourdomain.com/api/webhooks/stripe`
5. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Copy the "Signing secret" (starts with `whsec_`)
7. Add to production environment variables

### 3. Run Database Migration
In Supabase SQL Editor, run:
```sql
-- Copy contents from: supabase/migrations/add_gold_membership_fields.sql
```

This creates:
- `users` table with Gold membership fields
- Indexes for performance
- RLS policies for security

### 4. Test the Integration

#### Terminal 1: Dev Server
```bash
npm run dev
```

#### Terminal 2: Stripe Webhook Forwarding
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Terminal 3: Test Subscription
```bash
# Navigate to http://localhost:3000/membership
# Click "Upgrade to Autopilot Gold"
# Use test card: 4242 4242 4242 4242
# Any future expiry date, any CVC
```

---

## ✅ Testing Checklist

### Payment Flows
- [ ] Navigate to `/membership`
- [ ] Click "Upgrade to Autopilot Gold"
- [ ] Verify Stripe checkout opens
- [ ] Verify "Autopilot" shows as business name
- [ ] Verify autopilot.png logo appears
- [ ] Complete payment with test card: `4242 4242 4242 4242`
- [ ] Verify redirect to `/membership/success`
- [ ] Verify browser notification appears
- [ ] Verify haptic feedback triggers (mobile)
- [ ] Check database: `users.is_gold = true`

### Webhook Events
- [ ] Webhook receives `checkout.session.completed`
- [ ] User Gold status updated
- [ ] Transaction recorded
- [ ] Notification created

### Admin Dashboard
- [ ] Navigate to `/admin`
- [ ] Enter super admin email: `zackariahlacey@gmail.com`
- [ ] Verify "Total Revenue" shows correct amount
- [ ] Verify revenue includes subscription payment

---

## 🔧 Troubleshooting

### Issue: Webhook signature verification failed
**Solution**: Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the secret from `stripe listen`.

### Issue: Payment succeeds but user not upgraded to Gold
**Solution**: 
1. Check webhook logs in terminal running `stripe listen`
2. Verify webhook endpoint is accessible
3. Check `user_id` is in session metadata

### Issue: "No such product" error
**Solution**: The product will be auto-created on first subscription. Make sure Stripe keys are valid.

### Issue: Build fails with Stripe API version error
**Solution**: Update to latest version in both route files:
```typescript
apiVersion: '2026-01-28.clover'
```

---

## 📊 Stripe Test Cards

Use these cards for testing:

### Success Scenarios
```
4242 4242 4242 4242  - Successful payment
4000 0566 5566 5556  - Successful 3D Secure
5555 5555 5555 4444  - Mastercard success
```

### Failure Scenarios
```
4000 0000 0000 0002  - Card declined
4000 0000 0000 9995  - Insufficient funds
4000 0000 0000 0069  - Expired card
4100 0000 0000 0019  - Processing error
```

### Testing Subscriptions
```bash
# Trigger test subscription events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

---

## 🎯 What Gets Created

### API Routes
- `POST /api/stripe/checkout` - Creates Stripe Checkout sessions
- `POST /api/webhooks/stripe` - Handles Stripe events

### Database Tables
- `users` - Extended with Gold membership fields
- `transactions` - Records all payments
- `notifications` - Stores user notifications

### UI Components
- `GoldButton.tsx` - Subscribe button with logo
- `SOSButton.tsx` - Emergency button with haptics
- `SuccessHaptic.tsx` - Success feedback
- Updated `SubscriptionCard.tsx` - Uses new checkout flow

### Success Pages
- `/membership/success` - Gold welcome page with notification

---

## 💰 Pricing Configuration

### Current Tiers
- **Free**: $0/month (default)
- **Gold**: $19/month (recurring)
- **Platinum**: $49/month (coming soon)

### Update Pricing
Edit `app/api/stripe/checkout/route.ts`:
```typescript
const price = await stripe.prices.create({
  currency: 'usd',
  unit_amount: 1900, // $19.00 in cents
  recurring: {
    interval: 'month',
  },
  product: productId,
});
```

---

## 🔐 Security Best Practices

### Environment Variables
- Never commit `.env.local`
- Use different keys for dev/prod
- Rotate webhook secrets periodically

### Webhook Verification
```typescript
// Always verify webhook signatures
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

### User Authorization
```typescript
// Always check user is authenticated
const { data: { user } } = await supabase.auth.getUser();
if (!user) return 401;
```

---

## 📈 Monitoring & Analytics

### Stripe Dashboard
- View revenue: https://dashboard.stripe.com
- Check subscriptions: https://dashboard.stripe.com/subscriptions
- View webhook logs: https://dashboard.stripe.com/webhooks

### Application Logs
- Server logs: Check terminal running `npm run dev`
- Webhook logs: Check terminal running `stripe listen`
- Database: Query `transactions` table for revenue

### Admin Dashboard
- Access: `/admin` (super admin only)
- Shows: Total revenue, active users, subscriptions

---

## 🚀 Deployment

### 1. Set Production Environment Variables
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_production_secret
```

### 2. Configure Production Webhook
- URL: `https://autopilot.app/api/webhooks/stripe`
- Events: All subscription and payment events
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Update Product Images
In `app/api/stripe/checkout/route.ts`, update:
```typescript
images: ['https://autopilot.app/autopilot.png']
```

### 4. Test in Production
- Use real payment method
- Verify webhook delivery
- Check user Gold status
- Verify notifications

---

## 📞 Support

### Stripe Issues
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

### Autopilot Issues
- Check `STRIPE_REVENUE_ENGINE.md` for full documentation
- Review terminal logs for errors
- Test with `stripe listen` for webhook debugging

---

**Your Stripe Revenue Engine is ready!** 💰

Start the dev server and test the Gold subscription flow!