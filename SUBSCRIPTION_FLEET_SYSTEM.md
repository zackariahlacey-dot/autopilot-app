# AUTOPILOT Subscription & Fleet Management Engine 🚗⭐

## Overview
Complete subscription platform with Autopilot Gold membership, multi-vehicle fleet management, proactive AI maintenance reminders, and smart view switching for car owners and shop owners.

---

## 1. Multi-Vehicle Fleet Management

### Beautiful Fleet Grid (`/dashboard`)

**Before**: Simple list of vehicles
**Now**: Premium grid layout with:
- Each vehicle displayed as a glowing card
- Health status indicator (green pulse)
- Hover effects with scale animation
- Quick "View HUD" link

### Add Another Vehicle Card
- Inline form directly in the grid
- Quick-add functionality
- Seamless integration with existing vehicles
- **Free tier**: 1 vehicle
- **Gold tier**: Up to 5 vehicles
- **Platinum tier**: Unlimited vehicles

### Features
```tsx
// Vehicle Card UI
- Car icon with gradient background
- Make/Model/Year display
- Health status badge
- Animated hover effects
- Direct link to vehicle HUD
```

---

## 2. Autopilot Gold Subscription (`/membership`)

### Pricing Tiers

| Tier | Price | Key Features |
|------|-------|--------------|
| **Free** | $0/mo | Single vehicle, basic AI, health monitoring |
| **Gold** ⭐ | $19/mo | 5% cashback, priority chat, auto-scheduling, 5 vehicles |
| **Platinum** 👑 | $49/mo | 10% cashback, unlimited vehicles, concierge, roadside assistance |

### Gold Perks
1. **5% CarCoin Cashback** on every service
   - $200 oil change = $10 back instantly
   - Cashback never expires
   - Use on any future service

2. **Priority AI Chat**
   - Faster responses
   - Dedicated support
   - Advanced diagnostics

3. **Automatic Scheduling**
   - AI monitors mileage
   - Books appointments proactively
   - No manual tracking needed

4. **Multi-Vehicle Support**
   - Track up to 5 cars/trucks
   - Individual health scores
   - Separate service histories

### Cashback System

```typescript
// Auto-applied on booking completion
function apply_gold_cashback() {
  if (subscription === 'gold') {
    const cashback = booking_price * 0.05;
    wallet.balance += cashback;
    
    // Track in transactions
    wallet_transactions.insert({
      amount: cashback,
      type: 'loyalty_reward',
      description: 'Autopilot Gold 5% Cashback'
    });
  }
}
```

**Database Trigger**: Automatically applies cashback when `booking.status` changes to `'completed'`.

---

## 3. Proactive AI Assistant 🤖

### Mileage-Based Reminders

**60k Mile Major Service Alert**:
```
🔔 Proactive Alert: Your 2018 Elantra is at 58,000 miles. 
You're due for a major 60,000-mile service in approximately 2 weeks!

Recommended services:
• Transmission fluid flush
• Spark plug replacement
• Air & cabin filter replacement
• Coolant system service
• Brake fluid flush

I've found 3 local shops with quotes starting at $199. 
Should I book the best deal for you?

[🚀 Get 3 Quotes from Shops] [View All Mechanics]
```

**Oil Change Reminder**:
```
⏰ Proactive Reminder: Your Elantra will need an oil change 
in about 500 miles. Want me to schedule it now and save you the hassle?

[Schedule Oil Change] [Remind Me Later]
```

### How to Trigger
In AI Assistant, type:
```
proactive
```

The AI will check:
- Current mileage
- Last service dates
- Upcoming maintenance milestones
- Service intervals (5k miles, 60k miles, etc.)

### Implementation
```typescript
// In app/assistant/actions.ts
if (currentMileage >= 55000 && currentMileage < 65000) {
  const milesUntil60k = 60000 - currentMileage;
  const weeksEstimate = Math.ceil(milesUntil60k / 200);
  
  return {
    message: `Proactive Alert: Major 60k service in ${weeksEstimate} weeks...`,
    actions: [
      { label: '🚀 Get 3 Quotes', action: 'request_quotes_60k' }
    ]
  };
}
```

---

## 4. Owner Switcher (Navbar Dropdown) 🔄

### Smart View Switching

**Automatically detects if user has**:
- Personal vehicles (`vehicles` table)
- Business ownership (`businesses` table)

**Only shows if BOTH exist** - no clutter for single-role users.

### UI/UX
- Compact dropdown in navbar
- Shows current context (Personal vs Business)
- Icon changes based on view:
  - **Personal**: User profile icon
  - **Business**: Building icon
- Instant switching between modes

### Navigation Behavior
```typescript
// Personal Mode
Current View: "Personal"
Dashboard: /dashboard (shows vehicles)
Context: "Manage my vehicles"

// Business Mode
Current View: "Business"
Dashboard: /business/dashboard (shows shop metrics)
Context: "Manage my shop"
```

### Implementation
- **Client-side component** (`ViewSwitcherWrapper.tsx`)
- Checks user's vehicles and business ownership on mount
- Only renders if both exist
- Preserves navigation state

---

## 5. Database Schema

### New Tables

```sql
-- subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  tier TEXT CHECK (tier IN ('free', 'gold', 'platinum')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')),
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- subscription_perks (track feature usage)
CREATE TABLE subscription_perks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  perk_type TEXT CHECK (perk_type IN ('cashback', 'priority_chat', 'auto_schedule')),
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP
);

-- proactive_reminders (AI-generated alerts)
CREATE TABLE proactive_reminders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  reminder_type TEXT CHECK (reminder_type IN ('mileage', 'time_based', 'seasonal')),
  service_type TEXT NOT NULL,
  due_date DATE,
  due_mileage INTEGER,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT CHECK (status IN ('pending', 'sent', 'acknowledged', 'scheduled')),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Auto-Triggers

```sql
-- Create free subscription on user signup
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_subscription();

-- Apply cashback on booking completion
CREATE TRIGGER on_booking_completed_cashback
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION apply_gold_cashback();
```

---

## 6. Testing Checklist

### Fleet Management
- [ ] Add a second vehicle from dashboard
- [ ] View vehicle grid layout
- [ ] Click vehicle card to open HUD
- [ ] Verify health badges show correctly
- [ ] Test "Add Vehicle" inline form

### Subscription System
- [ ] Visit `/membership` page
- [ ] Click "Upgrade to Autopilot Gold"
- [ ] Verify subscription updates in database
- [ ] Complete a booking as Gold member
- [ ] Check wallet for 5% cashback
- [ ] View "Total Cashback Earned" banner

### Proactive AI
- [ ] Set vehicle mileage to 58,000
- [ ] Go to `/assistant`
- [ ] Type "proactive"
- [ ] Verify 60k service alert appears
- [ ] Click "Get 3 Quotes" button
- [ ] Test oil change reminder (4,500 miles since last service)

### View Switcher
- [ ] Add a vehicle
- [ ] Register a business
- [ ] Reload page
- [ ] Verify switcher appears in navbar
- [ ] Click dropdown
- [ ] Switch to "Business" view
- [ ] Verify URL changes to `/business/dashboard`
- [ ] Switch back to "Personal"
- [ ] Verify URL changes to `/dashboard`

---

## 7. API Integration

### Subscription Management Actions

```typescript
// app/membership/actions.ts

export async function upgradeSubscription(tier: string) {
  // 1. Update subscription tier
  await supabase.from('subscriptions').upsert({
    user_id: user.id,
    tier: tier,
    status: 'active',
    current_period_end: Date.now() + 30 days
  });
  
  // 2. Award bonus CarCoins
  const bonusAmount = tier === 'gold' ? 1000 : 2500;
  await updateWallet(user.id, bonusAmount);
  
  // 3. Revalidate paths
  revalidatePath('/membership');
  revalidatePath('/dashboard');
}
```

---

## 8. Future Enhancements

### Planned Features
1. **Family Plans**: Share Gold across household
2. **Annual Discounts**: 2 months free with yearly billing
3. **Loyalty Points**: Earn points for consistent maintenance
4. **Fleet Comparisons**: Compare health across vehicles
5. **Smart Notifications**: Push alerts for due maintenance
6. **Calendar Integration**: Sync service dates with Google/Apple Calendar

### Business Opportunities
- **Partner Perks**: Exclusive deals for Gold members
- **Priority Booking**: Jump the queue at participating shops
- **Concierge Service**: White-glove appointment coordination
- **Fleet Discounts**: Save 10% when servicing multiple vehicles

---

## 9. Files Changed

```
app/membership/
  page.tsx              - Membership tiers page
  SubscriptionCard.tsx  - Subscription tier card
  actions.ts            - Upgrade/cancel actions

app/dashboard/page.tsx  - Multi-vehicle grid layout

app/assistant/actions.ts - Proactive maintenance logic

components/
  navbar.tsx            - Added Gold link
  ViewSwitcher.tsx      - Dropdown component
  ViewSwitcherWrapper.tsx - Client-side wrapper

supabase/migrations/
  create_subscription_system.sql - Database schema

app/layout.tsx          - Wrapped Navbar in Suspense
```

---

## 10. Revenue Model

### Monthly Recurring Revenue (MRR)
```
100 users:
  - 70 Free ($0)
  - 25 Gold ($19/mo) = $475/mo
  - 5 Platinum ($49/mo) = $245/mo
  Total MRR: $720

1,000 users:
  - 700 Free ($0)
  - 250 Gold = $4,750/mo
  - 50 Platinum = $2,450/mo
  Total MRR: $7,200

10,000 users:
  Total MRR: $72,000/mo ($864k/year)
```

### Value Proposition
- **For Users**: Save time, earn cash back, peace of mind
- **For Businesses**: Increased bookings from Gold members
- **For Platform**: Recurring revenue + transaction fees

---

## Support
Need help? Visit `/membership` or contact support@autopilot.app

---

**Built with ❤️ by the AUTOPILOT team**
