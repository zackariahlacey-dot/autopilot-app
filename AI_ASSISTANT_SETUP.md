# AI Assistant Setup Guide - AUTOPILOT 🤖

## Quick Setup (5 Minutes)

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...` or `sk-...`)

### Step 2: Add to Environment Variables
Open `.env.local` and add:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

### Step 3: Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test It!
1. Go to http://localhost:3000/assistant
2. Type: "How's my car doing?"
3. Watch the AI respond with streaming text!

---

## Features

### 🧠 What the AI Can Do

1. **Check Vehicle Health**
   - "Is my car okay?"
   - "When do I need an oil change?"
   - "Check my maintenance status"

2. **Find Nearby Shops**
   - "Find me a car wash"
   - "Where's the closest mechanic?"
   - "I need a tire shop"

3. **Request Quotes**
   - "My brakes are squeaking"
   - "I need new tires"
   - "Can you get me quotes for brake service?"

4. **Service Recommendations**
   - "What maintenance do I need?"
   - "What should I do at 60,000 miles?"
   - "Am I due for any services?"

### 💾 What Data the AI Has Access To

- Your vehicle (make, model, year, mileage)
- Current health score
- Last oil change date
- Last detail date
- Recent service history (last 5 services)
- Current date (for time-based calculations)

---

## How It Works

### 1. User Sends Message
```
You: "How's my car?"
```

### 2. System Fetches Context
```typescript
// Automatic context injection
- Fetches your 2018 Hyundai Elantra data
- Calculates health score (92%)
- Gets service history
- Adds to AI prompt
```

### 3. AI Processes with Context
```
AI receives: "User has 2018 Hyundai Elantra, 58,420 miles, 
              last oil change May 2023, health score 92%"
              
AI thinks: "User's car is in good condition but might need 
            oil change soon (9 months since last change)"
```

### 4. AI May Call Functions
```typescript
AI: "Let me check your vehicle health..."
[Calls check_vehicle_health()]
Result: { health_score: 92, oil_life: 85, alerts: [] }
```

### 5. Streaming Response
```
"Your" → "Your 2018" → "Your 2018 Hyundai" → "Your 2018 Hyundai Elantra"
→ "is doing great! Health score: 92%"
```

---

## Troubleshooting

### Issue: "AI Assistant not configured"
**Solution**: Add `OPENAI_API_KEY` to `.env.local`

### Issue: "Unauthorized"
**Solution**: Make sure you're logged in (`/auth/login`)

### Issue: "AI gives generic responses"
**Solution**: Check that vehicle data exists in database

### Issue: "No streaming"
**Solution**: Clear browser cache, restart dev server

### Issue: "Function calls not working"
**Solution**: Check console for errors, verify Supabase connection

---

## Cost Breakdown

### OpenAI Pricing
- **Free Tier**: $5 credit for new accounts
- **Pay-as-you-go**: ~$0.01 per message
- **Monthly estimate**: $10-30 for moderate usage

### Example Usage
```
Scenario: 50 users, 10 messages each = 500 messages
Cost: 500 × $0.01 = $5/month

Revenue: 50 users × $19/month (Gold) = $950/month
AI Cost: $5/month
---
Profit: $945/month (99.5% margin)
```

### Cost Optimization
1. Use GPT-3.5 for simple queries (10x cheaper)
2. Cache common responses
3. Limit conversation history
4. Add rate limiting per user

---

## Advanced Configuration

### Use GPT-3.5 (Cheaper)
```typescript
// In app/api/chat/route.ts
const stream = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo', // Instead of 'gpt-4-turbo-preview'
  // ... rest of config
});
```

### Add More Tools
```typescript
{
  type: 'function',
  function: {
    name: 'book_appointment',
    description: 'Book an appointment at a specific shop',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string' },
        service_id: { type: 'string' },
        date: { type: 'string' },
      },
      required: ['business_id', 'service_id', 'date'],
    },
  },
}
```

### Custom System Prompt
```typescript
// Modify the systemPrompt in app/api/chat/route.ts
const systemPrompt = `
You are AUTOPILOT, but with extra personality:
- Use car puns
- Be enthusiastic about maintenance
- Celebrate when the user keeps their car healthy
`;
```

---

## FAQ

**Q: Can I use Claude instead of GPT-4?**
A: Yes! Install `@anthropic-ai/sdk` and modify the API route.

**Q: Does this save conversation history?**
A: Not yet. History is in browser memory only. Future update will save to database.

**Q: Can the AI book appointments?**
A: Yes! Add a `book_appointment` function and implement the logic.

**Q: What if I don't have an OpenAI key?**
A: The app will show an error. You need a key for the AI to work.

**Q: Is my data private?**
A: Yes. The AI only sees YOUR vehicle data, not other users'.

---

## Support

Questions? Check:
1. OpenAI status: https://status.openai.com
2. Supabase logs: Supabase dashboard
3. Browser console: Check for JavaScript errors
4. Server logs: Check terminal output

---

**Ready to chat with your car? 🚗💬**

Add your OpenAI key and start asking questions!