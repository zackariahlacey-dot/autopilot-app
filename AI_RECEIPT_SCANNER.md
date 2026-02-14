# AUTOPILOT AI Receipt Scanner (Legacy Data Import) 📄✨

## Overview
Complete AI-powered receipt scanning system for importing legacy service history. Uses mock OCR to extract service details from uploaded images, with membership-gated unlimited scanning.

---

## 1. Import Page (`/garage/import`)

### Features
- **Clean Upload UI** with camera icon
- **Dramatic scanning animation** (laser effect)
- **Mock AI extraction** of service details
- **Confirmation card** before import
- **Membership lock** (1 free scan, unlimited for Gold)

### User Flow
```
1. Select vehicle from dropdown
2. Upload receipt image (photo or file)
3. Watch scanning animation (3 seconds)
4. Review extracted data
5. Confirm or cancel
6. Instant addition to Digital Logbook
```

---

## 2. Mock OCR Extraction

### Extracted Data
```typescript
{
  service: 'Full Synthetic Oil Change',
  date: 'May 12, 2023',
  price: 89.99,
  shop: 'Local Quick Lube',
  mileage: 45230
}
```

### How It Works
```typescript
// 3-second "scanning" delay for dramatic effect
setTimeout(() => {
  const mockData = {
    service: 'Full Synthetic Oil Change',
    date: 'May 12, 2023',
    price: 89.99,
    shop: 'Local Quick Lube',
    mileage: 45230,
  };
  setExtractedData(mockData);
  setIsScanning(false);
}, 3000);
```

**Future Enhancement**: Replace with real OCR API (Google Vision, AWS Textract, or Tesseract.js)

---

## 3. Scanning Animation

### Laser Effect
- **Purple border** pulsing around image
- **Horizontal line** scanning vertically
- **"Scanning Receipt..."** text with pulsing icon
- **Dark overlay** for focus

### CSS Animation
```css
@keyframes scan {
  0% { top: 0; }
  50% { top: calc(100% - 4px); }
  100% { top: 0; }
}

.animate-scan {
  animation: scan 2s linear infinite;
}
```

### Visual Design
```
┌─────────────────────┐
│ [Scanning Receipt]  │ ← Pulsing purple border
│  ─────────────      │ ← Moving laser line
│ [Receipt Image]     │
│                     │
└─────────────────────┘
   "AI is extracting service details"
```

---

## 4. Membership Lock

### Free Tier Limit
- **1 free scan** to try the feature
- Counter shows: "1 scan remaining"
- After first scan: Upgrade modal

### Gold Tier Benefits
- **Unlimited scanning**
- Import entire service history
- No restrictions
- Gold badge on feature

### Upgrade Modal
```
🌟 Free Scan Used

You've used your free receipt scan.
Upgrade to Autopilot Gold for unlimited scanning!

✓ Unlimited receipt scans
✓ 5% cashback on services  
✓ Track up to 5 vehicles

[Upgrade Now] [Maybe Later]
```

---

## 5. Data Import Logic

### Transaction Creation
```typescript
await supabase.from('transactions').insert({
  user_id: user.id,
  vehicle_id: vehicleId,
  service_name: 'Full Synthetic Oil Change',
  amount: 8999, // cents
  business_name: 'Local Quick Lube',
  completed_at: '2023-05-12',
  type: 'imported_receipt',
  notes: 'Imported via AI Receipt Scanner'
});
```

### Vehicle Updates
**If service type contains "oil"**:
- Update `last_oil_change` date
- Set `mileage_at_last_oil`

**If service type contains "detail" or "wash"**:
- Update `last_detail` date

**If mileage provided**:
- Update vehicle `mileage`

### Logbook Integration
- Imported receipts appear in Digital Logbook
- Mixed with future services
- Sorted by date (chronological)
- Updates "Total Investment" card

---

## 6. Garage Integration

### "Scan Old Receipts" CTA
Added to main Garage page (`/dashboard`):

```tsx
// Prominent banner at top of page
<Link href="/garage/import">
  📄 Scan Old Receipts
  [GOLD badge]
  "Import your service history with AI-powered scanning"
  →
</Link>
```

**Design**:
- Purple/pink gradient background
- Camera icon in circle
- Gold badge to indicate premium feature
- Hover animation (scale + translate)

---

## 7. Database Schema

### New Transaction Type
```sql
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('service', 'imported_receipt'));
```

**Types**:
- `service`: Real booking completed through platform
- `imported_receipt`: Legacy data imported via scanner

### Migration
```sql
-- Run this in Supabase SQL Editor
\i supabase/migrations/add_imported_receipt_type.sql
```

---

## 8. Testing Checklist

### Basic Flow
- [ ] Visit `/garage/import`
- [ ] Select a vehicle
- [ ] Upload any image file
- [ ] Watch 3-second scanning animation
- [ ] Verify extracted data displays correctly
- [ ] Click "Confirm & Add to Logbook"
- [ ] Verify redirect to vehicle HUD
- [ ] Check Digital Logbook for imported receipt

### Free Tier Limit
- [ ] Scan first receipt (should work)
- [ ] Try to scan second receipt
- [ ] Verify "Free Scan Used" modal appears
- [ ] Click "Upgrade Now"
- [ ] Verify redirect to `/membership`

### Gold Tier
- [ ] Upgrade to Gold
- [ ] Return to `/garage/import`
- [ ] Verify "Unlimited" messaging
- [ ] Scan multiple receipts
- [ ] Verify no limit modal

### Data Integrity
- [ ] Check `transactions` table for new row
- [ ] Verify `type = 'imported_receipt'`
- [ ] Check vehicle `last_oil_change` updated (for oil services)
- [ ] Verify "Total Investment" increased on HUD

---

## 9. Real OCR Integration (Future)

### Option 1: Google Cloud Vision API
```typescript
import vision from '@google-cloud/vision';

async function extractReceiptData(imageBuffer: Buffer) {
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection(imageBuffer);
  const text = result.textAnnotations?.[0]?.description;
  
  // Parse extracted text
  return parseReceiptText(text);
}
```

### Option 2: AWS Textract
```typescript
import AWS from 'aws-sdk';

async function extractReceiptData(imageBuffer: Buffer) {
  const textract = new AWS.Textract();
  const response = await textract.analyzeExpense({
    Document: { Bytes: imageBuffer }
  }).promise();
  
  return parseTextractResponse(response);
}
```

### Option 3: Tesseract.js (Client-Side)
```typescript
import Tesseract from 'tesseract.js';

async function extractReceiptData(image: File) {
  const { data: { text } } = await Tesseract.recognize(image, 'eng');
  return parseReceiptText(text);
}
```

---

## 10. Business Value

### Retention
- **Solves data migration pain** for new users
- Users can see full vehicle history in one place
- Increases perceived value of platform

### Upsell Opportunity
- **Perfect freemium hook**: 1 free scan
- Natural upgrade path to Gold
- High conversion: Users who import history are invested

### Competitive Advantage
- **Unique feature** not offered by competitors
- Lowers switching barrier from manual tracking
- Positions AUTOPILOT as "complete solution"

---

## 11. User Stories

### Story 1: New User with History
```
As a new user,
I have 5 years of service receipts in a shoebox,
I want to quickly import them all,
So I can see my complete vehicle history.

Solution: Scan receipts → Gold upgrade → Unlimited import
```

### Story 2: Switching from Another App
```
As a user switching from another platform,
I don't want to manually re-enter all my data,
I want to scan my old records,
So I can migrate seamlessly.

Solution: AI Receipt Scanner makes migration effortless
```

### Story 3: Tax Deductions
```
As a business owner,
I need detailed service history for tax purposes,
I want to import old receipts,
So I have a complete digital record.

Solution: Scanned receipts appear in Digital Logbook with dates/amounts
```

---

## 12. Files Created

```
app/garage/import/
  page.tsx              - Import page with vehicle selector
  ReceiptScanner.tsx    - Client component with upload/scan UI
  actions.ts            - Server action to save imported receipts

app/dashboard/page.tsx  - Added "Scan Old Receipts" CTA banner

supabase/migrations/
  add_imported_receipt_type.sql - Database schema update
```

---

## 13. Future Enhancements

### Phase 2: Real OCR
- Integrate Google Vision API
- Train on automotive receipts
- Extract: service, date, price, shop, mileage, VIN

### Phase 3: Bulk Import
- Upload multiple receipts at once
- Batch processing queue
- Progress indicator

### Phase 4: Smart Parsing
- Recognize different receipt formats
- Auto-categorize services (oil, brakes, tires)
- Extract warranty information

### Phase 5: Mobile Camera
- Native camera integration
- Real-time scanning
- Instant feedback

---

## 14. Metrics to Track

### Usage Metrics
- **Scans per user** (free vs Gold)
- **Conversion rate** (free scan → Gold upgrade)
- **Imported receipts** per vehicle
- **Time to first scan** (onboarding funnel)

### Quality Metrics
- **Extraction accuracy** (once real OCR added)
- **Manual corrections** needed
- **Abandoned scans** (uploaded but not confirmed)

### Business Metrics
- **Upgrade attribution** (did scan feature drive Gold?)
- **Retention lift** (users with imported history)
- **CAC payback** (value of feature vs cost)

---

## Support
Need help? Visit `/garage/import` or contact support@autopilot.app

---

**Built with ❤️ by the AUTOPILOT team**
