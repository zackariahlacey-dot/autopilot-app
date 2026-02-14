# AUTOPILOT Viral Growth & Gamification System 🎮🚗

## Overview
Complete gamification platform with referral rewards, loyalty ranks, and PWA mobile support.

---

## 1. 'Refer a Friend' System (/refer)

### Features
- **Unique Referral Codes**: Auto-generated for each user (e.g., `ZACK3A2B`)
- **$20 Reward**: Both referrer and friend get 20 CarCoins ($20 value)
- **Share Options**:
  - Copy link to clipboard
  - Email integration
  - Twitter/Facebook share buttons
- **Real-time Stats**:
  - Total friends invited
  - Completed referrals
  - Current CarCoin balance

### Database Tables
```sql
-- referrals table
id, referrer_id, referral_code, referred_user_id, status, reward_amount
```

### How It Works
1. User visits `/refer` page
2. System generates unique code (or retrieves existing)
3. User shares link: `https://autopilot.app/auth/sign-up?ref=ZACK3A2B`
4. Friend signs up using link
5. Both accounts receive 20 CarCoins bonus

---

## 2. CarCoin Wallet System 🪙

### Features
- **Starting Balance**: 50 CarCoins (5000 cents) on signup
- **Exchange Rate**: 1 CarCoin = $1.00
- **Wallet Display**: Glowing amber card with animated effects
- **Transaction History**: Full audit trail

### Integration Points
- **Vehicle HUD**: Top-left card shows balance
- **Booking Flow**: Can apply coins for discounts
- **Referral Bonuses**: Auto-credited on completion

### Database Tables
```sql
-- user_wallets
id, user_id, balance, lifetime_earned

-- wallet_transactions
id, user_id, amount, type, description, booking_id, referral_id
```

### Transaction Types
- `signup_bonus`: Initial 50 coins
- `referral_bonus`: +20 coins per referral
- `service_discount`: Spending coins on bookings
- `loyalty_reward`: Bonus for rank achievements
- `booking_cashback`: Rewards from completed services

---

## 3. Loyalty Rank System 🏆

### Ranks & Requirements
| Rank | Icon | Requirement | Perks |
|------|------|-------------|-------|
| **Beginner** | 🚗 | Start journey | Basic access |
| **Pro Driver** | ⭐ | 90 days at 100% health | 10% priority booking, exclusive deals |
| **Expert** | 👑 | 180 days at 100% health | 15% priority, VIP support, free inspections |
| **Legend** | 🏆 | 365 days at 100% health | 25% priority, concierge, lifetime warranty |

### Rank Display
- **Vehicle HUD**: Shows current rank card
- **Progress Bar**: Days remaining to next rank
- **Badges**: Visual icons based on achievements
- **Stats**:
  - Health streak (consecutive days)
  - Total services completed

### Database Tables
```sql
-- loyalty_ranks
id, user_id, current_rank, health_streak_days, total_services, lifetime_spent, badges
```

### Rank Advancement Logic
- Health score must be 100% continuously
- Auto-update on vehicle maintenance
- Streak resets if health drops below 100%
- Badges stored as JSONB array

---

## 4. PWA (Progressive Web App) 📱

### Features
- **'Add to Home Screen' prompt** on mobile
- **Custom AUTOPILOT icon** (emerald-to-cyan gradient)
- **Offline capability** (basic caching)
- **App shortcuts**:
  - My Garage
  - Find Services
  - AI Assistant

### Files Created
```
public/
  manifest.json       - PWA configuration
  icon-192.png        - Small icon (192x192)
  icon-512.png        - Large icon (512x512)
```

### Manifest Configuration
```json
{
  "name": "AUTOPILOT - Smart Car Maintenance",
  "short_name": "AUTOPILOT",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#000000"
}
```

### Mobile Experience
- **Splash Screen**: Black with AUTOPILOT logo
- **Status Bar**: Dark with emerald accent
- **Gestures**: Swipe navigation enabled
- **Orientation**: Portrait-primary

---

## 5. Integration Points

### Vehicle HUD
```tsx
// Top row (new)
<CarCoinWallet balance={5000} userId={user.id} />
<LoyaltyBadge rank="pro_driver" healthStreakDays={45} totalServices={8} />
```

### Navbar
- New "Refer & Earn" button (purple, with icon)
- Links to `/refer` page

### Booking Flow (Future Enhancement)
```tsx
// Apply CarCoins at checkout
<button onClick={() => applyCoins(50)}>
  Use 50 CarCoins (-$50.00)
</button>
```

---

## 6. Database Migration

### Run This SQL
```sql
-- Execute in Supabase SQL Editor
\i supabase/migrations/create_gamification_system.sql
```

### Tables Created
1. `user_wallets` - CarCoin balances
2. `wallet_transactions` - Transaction history
3. `referrals` - Referral tracking
4. `loyalty_ranks` - User ranks & streaks

### Auto-Triggers
- `create_user_wallet()` - Runs on new user signup
- Gives 50 CarCoins welcome bonus
- Creates initial loyalty rank

---

## 7. Testing Checklist

### Referral System
- [ ] Generate referral code
- [ ] Copy link to clipboard
- [ ] Share via email
- [ ] Sign up with referral code
- [ ] Verify both accounts get 20 coins

### CarCoin Wallet
- [ ] View balance on vehicle HUD
- [ ] Check transaction history
- [ ] Expand wallet card for details
- [ ] Navigate to `/refer` from wallet

### Loyalty Ranks
- [ ] View current rank badge
- [ ] Check health streak counter
- [ ] Update vehicle maintenance (health to 100%)
- [ ] Verify streak increments daily
- [ ] Test rank upgrade (simulate 90 days)

### PWA
- [ ] Visit site on mobile
- [ ] See 'Add to Home Screen' prompt
- [ ] Install app
- [ ] Launch from home screen
- [ ] Test app shortcuts
- [ ] Verify offline caching

---

## 8. Viral Growth Strategy

### Why This Works
1. **Double-Sided Incentive**: Both parties get $20
2. **Real Value**: CarCoins = actual service discounts
3. **Social Proof**: Referral count shown publicly
4. **Gamification**: Ranks create competition
5. **Mobile-First**: PWA makes sharing easy

### Expected Metrics
- **Referral Rate**: 15-25% of users invite friends
- **Conversion Rate**: 40-60% of invites sign up
- **Retention**: Loyalty ranks boost 30-day retention by 2x

---

## 9. Next Steps

### Enhancements
1. **Redeem CarCoins**: Integrate into booking flow
2. **Leaderboard**: Show top-ranked users
3. **Achievements**: Unlock badges for milestones
4. **Push Notifications**: Alert for rank upgrades
5. **Social Sharing**: Auto-post rank achievements

### Business Metrics to Track
- Daily active users (DAU)
- Referral conversion rate
- CarCoin redemption rate
- Rank distribution (% in each tier)
- Lifetime value (LTV) per rank

---

## Files Changed
```
app/refer/
  page.tsx              - Referral page
  ReferralCard.tsx      - Share card component

components/
  CarCoinWallet.tsx     - Wallet display
  LoyaltyBadge.tsx      - Rank card
  navbar.tsx            - Added "Refer & Earn" link

app/garage/[id]/page.tsx - Added wallet & loyalty to HUD

app/layout.tsx          - Updated PWA metadata

public/
  manifest.json         - PWA config
  icon-192.png          - App icon (small)
  icon-512.png          - App icon (large)

supabase/migrations/
  create_gamification_system.sql - Database schema
```

---

## Support
For questions or issues, contact support@autopilot.app

---

**Built with ❤️ by the AUTOPILOT team**
