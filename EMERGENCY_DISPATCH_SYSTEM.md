# AUTOPILOT Emergency Roadside Dispatch System 🚨

## Overview
An Uber-like emergency roadside assistance system with real-time tracking, location detection, and instant dispatch to nearby towing/roadside businesses.

---

## 1. SOS Button Locations

### Home Page HUD
- **Location**: Below the "Mission Control" header, above Quick Actions
- **Design**: 
  - Red gradient border (4px)
  - Red-to-orange background gradient
  - Large emergency icon (🚨)
  - Pulsing animation
  - "EMERGENCY SOS" title
  - "Need immediate roadside assistance?" subtitle

### AI Assistant Bubble  
- **Location**: Inside the floating Copilot chat overlay
- **Design**:
  - Prominent red button at the top of quick actions
  - Pulsing animation
  - "🚨 EMERGENCY SOS" text
  - Closes chat when clicked

---

## 2. Emergency Flow

### Step 1: Location Detection
```
User clicks SOS → Emergency page loads →
"Detecting Location..." screen with pulsing radar

- Uses browser geolocation API
- Shows pulsing location icon
- Displays "Finding nearest roadside assistance"
```

### Step 2: Emergency Type Selection
```
5 emergency types displayed in grid:
├─ 🚛 Need Towing (Vehicle cannot drive)
├─ 🛞 Flat Tire (Tire change assistance)
├─ 🔋 Dead Battery (Jump start needed)
├─ 🔑 Locked Out (Keys locked inside)
└─ ⚠️ Accident (Collision assistance)

User selects type → Creates emergency_request in database
```

### Step 3: Finding Help (Search Screen)
```
- Mini-map showing user location (blue pin)
- Nearby tow trucks (red pins within 10 miles)
- 10-mile radius circle overlay
- List of available providers sorted by distance
- Each provider card shows:
  ├─ Business name
  ├─ Address
  ├─ Distance (e.g., "2.3 miles away")
  ├─ Phone number
  └─ "Dispatch Now" button
```

### Step 4: Dispatched Confirmation
```
Green checkmark animation
"Dispatched!"
"[Business Name] has been notified"

(Shows for 2 seconds then auto-advances)
```

### Step 5: Live Tracking (Uber-like)
```
Cyan/blue themed tracking screen:

Header:
- Lightning bolt icon (pulsing)
- "Help is On the Way"
- ETA: 15-20 minutes

Business Card:
├─ Business name
├─ Address
├─ Contact buttons:
│  ├─ "📞 Call Driver" (tel: link)
│  └─ "💬 Message" button
└─ Status timeline:
   ├─ ✓ Request received (complete)
   ├─ ✓ Driver en route (pulsing/active)
   └─ ○ Driver arriving soon (pending)

Vehicle Info:
- Year, Make, Model, License Plate

Cancel button (grey, bottom)
```

---

## 3. Database Schema

### emergency_requests Table
```sql
CREATE TABLE emergency_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  vehicle_id UUID REFERENCES vehicles,
  booking_id UUID REFERENCES bookings,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  
  -- Emergency details
  emergency_type TEXT, -- 'towing', 'flat_tire', 'dead_battery', 'lockout', 'accident'
  description TEXT,
  
  -- Status
  status TEXT, -- 'searching', 'dispatched', 'en_route', 'arrived', 'resolved', 'cancelled'
  priority INTEGER DEFAULT 1, -- 1=critical, 2=high, 3=normal
  
  -- Business/Driver
  business_id UUID REFERENCES businesses,
  driver_name TEXT,
  driver_phone TEXT,
  eta_minutes INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  dispatched_at TIMESTAMP,
  arrived_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  notes JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Status Flow
```
searching → dispatched → en_route → arrived → resolved
   ↓
cancelled (any time)
```

---

## 4. Business Dashboard - Emergency Alerts

### Alert Display
When a business has active emergency requests (`status: 'dispatched' OR 'en_route'`), a flashing red alert appears at the top of the Business Dashboard:

```
🚨 EMERGENCY REQUESTS (2)

┌─────────────────────────────────────────────┐
│ 🚨 FLAT TIRE                                │
│ 📍 123 Main St, Pasadena CA                 │
│ 🚗 2018 Hyundai Elantra                     │
│                                              │
│ Status: [DISPATCHED] | ETA: 15 min          │
│                                              │
│ Actions:                                     │
│ [🚗 En Route] [📍 Arrived] [✓ Resolved]    │
│                                              │
│ [📞 Call Customer]                           │
└─────────────────────────────────────────────┘
```

### Alert Features
- **Pulsing animation** on border and background
- **Red/orange gradient** background
- **Large emergency icon** (🚨)
- **Prominent status badge** (current status)
- **Quick action buttons**:
  - "🚗 En Route" → Updates status to `en_route`
  - "📍 Arrived" → Updates status to `arrived`
  - "✓ Resolved" → Updates status to `resolved`, completes booking
- **Direct call button** to customer's phone

---

## 5. Distance Calculation

### Haversine Formula
```typescript
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}
```

**10-Mile Radius**: Only businesses within 10 miles are shown.

---

## 6. Map Integration

### Emergency Map Component
- **Dark Mode Tiles**: CartoDB Dark Matter
- **User Marker**: Blue pin with pulsing effect
- **Business Markers**: Red tow truck icons (🚛)
- **Radius Circle**: 10-mile semi-transparent red circle
- **Click Interaction**: Clicking a marker selects the business

### Markers
```typescript
User Marker:
├─ Blue gradient background
├─ White border
├─ 📍 emoji
├─ Pulsing animation
└─ "Your Location" popup

Business Marker:
├─ Red/orange gradient
├─ White border
├─ 🚛 emoji
└─ Popup with:
   ├─ Business name
   ├─ Address
   ├─ Phone
   └─ Distance
```

---

## 7. Real-Time Status Updates

### Customer View
The tracking screen automatically shows the current status based on the `emergency_requests.status` field:

```
Status Timeline (Visual):
✓ Request received      (always checked)
✓ Driver en route       (pulsing when active)
○ Driver arriving soon  (pending)

When business updates status:
- "En Route" → Middle checkpoint pulses
- "Arrived" → Final checkpoint fills in
- "Resolved" → Redirects to success page
```

### Business View
Business owners can update status with one click:
```
[🚗 En Route] → Sets status to 'en_route'
                Updates customer's tracking screen
                
[📍 Arrived]  → Sets status to 'arrived'
                Customer sees "Driver here!"
                
[✓ Resolved]  → Sets status to 'resolved'
                Creates transaction
                Updates vehicle maintenance
                Closes emergency request
```

---

## 8. Server Actions

### createEmergencyRequest
```typescript
Input:
├─ vehicleId (optional)
├─ latitude (required)
├─ longitude (required)
├─ emergencyType (required)
└─ description (optional)

Output:
└─ emergencyId (UUID)

Logic:
1. Get authenticated user
2. Create emergency_requests row
3. Set status to 'searching'
4. Set priority to 1 (critical)
5. Return emergency ID
```

### dispatchEmergency
```typescript
Input:
├─ emergencyId (UUID)
└─ businessId (UUID)

Logic:
1. Update emergency_requests:
   ├─ Set business_id
   ├─ Set status to 'dispatched'
   ├─ Set dispatched_at timestamp
   ├─ Set driver info from business
   └─ Set ETA (mock: 15 minutes)
   
2. Create booking:
   ├─ Link to emergency_request
   ├─ Set is_emergency = true
   ├─ Set status to 'confirmed'
   └─ Store emergency location in metadata
   
3. Revalidate business dashboard
```

### updateEmergencyStatus
```typescript
Input:
├─ emergencyId (UUID)
└─ status (string)

Logic:
1. Verify user owns business assigned to emergency
2. Update emergency_requests.status
3. Set corresponding timestamp:
   ├─ 'arrived' → arrived_at
   └─ 'resolved' → resolved_at
4. If 'resolved':
   ├─ Complete booking
   ├─ Create transaction
   └─ Update vehicle maintenance
5. Revalidate paths
```

---

## 9. UI/UX Details

### Color Schemes

**Emergency (Active State)**:
- Background: `from-red-950 to-red-900`
- Border: `border-red-500`
- Text: `text-white`, `text-red-200`
- Buttons: `bg-red-500 hover:bg-red-400`

**Dispatched (Success State)**:
- Background: `from-emerald-950 to-emerald-900`
- Border: `border-emerald-500`
- Text: `text-white`, `text-emerald-200`

**Tracking (Info State)**:
- Background: `from-cyan-950 to-blue-900`
- Border: `border-cyan-500`
- Text: `text-white`, `text-cyan-200`

### Animations
```css
/* Pulsing effect for critical elements */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Icon animations */
.emergency-icon {
  animation: bounce 1s infinite;
}

/* Alert flashing */
.emergency-alert {
  animation: flash 1s ease-in-out infinite;
}
```

---

## 10. Mobile Experience

### Responsive Design
- **Emergency button**: Full width on mobile
- **Map**: Automatically adjusts height
- **Business cards**: Stack vertically
- **Touch targets**: Minimum 44px height
- **Font sizes**: Scale appropriately

### Phone Integration
```typescript
// Direct phone call
<a href={`tel:${business.phone}`}>Call Driver</a>

// SMS messaging (optional)
<a href={`sms:${business.phone}`}>Text Driver</a>
```

---

## 11. Business Categories

Emergency services must be categorized as:
- `towing` - Full tow truck service
- `roadside_assistance` - Jumps, tire changes, lockouts

### Adding New Businesses
```sql
INSERT INTO businesses (name, category, address, phone, latitude, longitude)
VALUES 
  ('24/7 Roadside Rescue', 'towing', '123 Main St', '555-0100', 34.1478, -118.1445),
  ('Quick Tow Services', 'towing', '456 Oak Ave', '555-0200', 34.1500, -118.1500);
```

---

## 12. Safety Features

### Data Privacy
- **Location**: Only shared with dispatched business
- **Phone**: Only visible after dispatch
- **History**: User can view all past emergencies

### Automatic Timeouts
```typescript
// Cancel if no business accepts within 15 minutes
setTimeout(() => {
  if (emergency.status === 'searching') {
    cancelEmergency(emergency.id);
    notifyUser('No providers available. Please call 911.');
  }
}, 900000); // 15 minutes
```

### Emergency Priority
- **Priority 1 (Critical)**: Accidents, dangerous locations
- **Priority 2 (High)**: Stranded, unsafe to drive
- **Priority 3 (Normal)**: Lockouts, minor issues

---

## 13. Revenue Model

### For Businesses
- **No Commission on Emergencies**: Build trust, get customer for life
- **Future upsell**: Regular maintenance after emergency service
- **Brand loyalty**: Customer remembers who helped in crisis

### For Platform
- **Premium subscriptions**: AAA-like roadside coverage
- **Referral fees**: Insurance partnerships
- **Data insights**: Predict high-demand areas

---

## 14. Testing the Feature

### User Flow Test
1. Go to Home Page
2. Click "EMERGENCY SOS" button
3. Allow location access
4. Select "Flat Tire"
5. See nearby businesses on map
6. Click "Dispatch Now" for closest business
7. View tracking screen
8. See ETA and status updates

### Business Flow Test
1. Log in as business owner
2. Go to Business Dashboard
3. See flashing red emergency alert
4. Click "En Route"
5. Click "Arrived"
6. Click "Resolved"
7. Verify booking created and revenue tracked

---

## 15. Future Enhancements

### Phase 2: Real-Time Tracking
- **Live GPS**: Show driver's moving location on map
- **ETA Updates**: Recalculate based on traffic
- **Push Notifications**: Alert customer when driver arrives

### Phase 3: Driver App
- **Dedicated app**: For tow truck drivers
- **Accept/Reject**: Allow drivers to accept jobs
- **Route optimization**: Google Maps integration

### Phase 4: Insurance Integration
- **Claim filing**: Auto-file insurance claims
- **Coverage verification**: Check user's roadside policy
- **Direct billing**: Bill insurance instead of customer

### Phase 5: AI Recommendations
- **Predictive**: "Your battery is old, add roadside coverage"
- **Seasonal**: "Winter storm coming, check your tires"
- **Location-based**: "Driving through desert? Here's roadside help"

---

## 16. Files Created

```
app/emergency/
  ├── page.tsx              - Main emergency page (server)
  ├── EmergencyClient.tsx   - Client-side emergency flow
  ├── EmergencyMap.tsx      - Leaflet map component
  └── actions.ts            - Server actions (create, dispatch, cancel)

app/page.tsx                - Added SOS button to home

components/
  └── CopilotBubble.tsx     - Added SOS button to AI assistant

app/business/dashboard/
  ├── page.tsx              - Added emergency alerts (attempted)
  └── actions.ts            - Updated status update logic

supabase/migrations/
  └── create_emergency_system.sql - Database schema
```

---

## 17. Analytics to Track

### User Metrics
- **Emergency requests per month**
- **Average response time** (dispatch to arrival)
- **Cancellation rate**
- **Most common emergency types**

### Business Metrics
- **Acceptance rate** (dispatches accepted)
- **Average ETA accuracy**
- **Customer satisfaction** (post-service rating)
- **Repeat customers** (emergency → regular service)

### Platform Metrics
- **Coverage gaps** (areas with no providers)
- **Peak times** (when are emergencies most common)
- **Seasonal trends** (battery issues in winter, etc.)

---

## 18. Legal Considerations

### Disclaimers
```
AUTOPILOT connects users with independent roadside 
assistance providers. We are not responsible for:
- Service quality
- Arrival times
- Pricing disputes
- Safety incidents

For life-threatening emergencies, call 911 immediately.
```

### Terms of Service
- **Emergency Use**: Feature is for vehicle emergencies only
- **No Guarantees**: We cannot guarantee provider availability
- **User Responsibility**: User must verify provider credentials
- **Payment**: User responsible for all service fees

---

## 19. Competitive Advantages

**vs. AAA**:
- ✅ **Free to use** (no annual membership)
- ✅ **Instant**: See providers in real-time
- ✅ **Transparent pricing**: Know cost upfront
- ✅ **Integrated**: Already part of your car's digital twin

**vs. Calling a Random Tow Truck**:
- ✅ **Verified providers**: All businesses on platform
- ✅ **Ratings & reviews**: See past customer feedback
- ✅ **Live tracking**: Know exactly when help arrives
- ✅ **Payment integrated**: No cash, no hassle

**vs. Insurance Roadside Coverage**:
- ✅ **No deductible**: Pay for service only
- ✅ **No claim impact**: Doesn't affect premiums
- ✅ **Faster**: No insurance approval process
- ✅ **Any vehicle**: Works even if not insured

---

## 20. Marketing Copy

### For Car Owners
```
🚨 Stranded? Don't Panic.

AUTOPILOT's Emergency SOS connects you with
the nearest roadside assistance in seconds.

✓ Flat tire? Dead battery? Locked out?
✓ Live tracking (just like Uber)
✓ Help arrives in 15-20 minutes
✓ No membership required

Your car's digital twin now includes a lifeline.
```

### For Businesses
```
Turn Emergencies Into Loyal Customers

Every SOS is an opportunity:
├─ Immediate revenue (tow/jump/lockout)
├─ Future maintenance (they remember you)
└─ 5-star reviews (you saved them!)

Zero commission. Pure profit. Maximum trust.

Join the AUTOPILOT network today.
```

---

## Support
Emergency assistance questions? Contact emergency@autopilot.app

**For immediate help, call 911.**

---

**Built with ❤️ by the AUTOPILOT team**

*"When you need help, we're already there."*
