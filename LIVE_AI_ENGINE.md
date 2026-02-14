# AUTOPILOT Live AI Engine 🤖⚡

## Overview
Complete upgrade from mock logic to real AI with GPT-4, streaming responses, database context injection, and function calling capabilities.

---

## 1. Architecture

### Before (Mock Logic)
```
User Message → Keyword Matching → Canned Response
```

### After (Live AI Engine)
```
User Message → Database Context → GPT-4 (Streaming) → Function Calls → Live Response
         ↓
   [Vehicle Data]
   [Service History]
   [Health Score]
         ↓
    AI has full context
```

---

## 2. API Route (`/api/chat`)

### Request Format
```typescript
POST /api/chat
{
  "message": "Is my car okay?",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

### Response Format (Server-Sent Events)
```
data: {"type":"content","content":"Your"}
data: {"type":"content","content":" 2018"}
data: {"type":"content","content":" Hyundai"}
...
data: {"type":"function_call","function":"check_vehicle_health","result":{...}}
data: {"type":"done"}
```

### Features
- ✅ **Streaming responses** (word-by-word)
- ✅ **Function calling** (AI can execute actions)
- ✅ **Context injection** (AI knows your vehicle data)
- ✅ **Conversation history** (remembers previous messages)
- ✅ **Error handling** (graceful failures)

---

## 3. System Prompt

### AI Personality
```
You are AUTOPILOT, a world-class automotive AI assistant.

YOUR CAPABILITIES:
- Access to user's vehicle data and service history
- Can search for nearby automotive shops
- Can request quotes from local businesses
- Can check vehicle health and provide recommendations
- Can help diagnose car problems

YOUR PERSONALITY:
- Professional yet approachable
- Safety-focused and cost-conscious
- Proactive about maintenance recommendations
- Clear and concise in explanations

IMPORTANT GUIDELINES:
- Always prioritize safety over cost
- Recommend regular maintenance to prevent expensive repairs
- Suggest getting multiple quotes for major work
- Be transparent about what you know vs. what requires a mechanic
- Use emojis sparingly and professionally
```

---

## 4. Database Context Injection

### What the AI Knows About You
```typescript
USER VEHICLE INFORMATION:
- Vehicle: 2018 Hyundai Elantra
- Mileage: 58,420 miles
- Health Score: 92%
- Last Oil Change: May 12, 2023
- Last Detail: June 3, 2023

RECENT SERVICE HISTORY:
- Full Synthetic Oil Change at Local Quick Lube on 5/12/2023 ($89.99)
- Brake Pad Replacement at Arise And Shine VT on 6/3/2023 ($249.00)
- Tire Rotation at Quick Tire Shop on 7/15/2023 ($45.00)

CURRENT DATE: February 13, 2026
```

### How It's Fetched
```typescript
// Before sending to AI, fetch from Supabase:
const vehicles = await supabase
  .from('vehicles')
  .select('*')
  .eq('user_id', user.id);

const serviceHistory = await supabase
  .from('transactions')
  .select('service_name, amount, completed_at, business_name')
  .eq('user_id', user.id)
  .order('completed_at', { ascending: false })
  .limit(5);

// Calculate health score in real-time
const healthScore = calculateHealth(vehicle);

// Inject into system prompt
const context = `USER VEHICLE INFORMATION: ...`;
```

---

## 5. Function Calling (AI Tools)

### Available Functions

#### 1. `search_nearby_shops`
**Purpose**: Find automotive shops by category

**Parameters**:
```typescript
{
  category: 'oil_change' | 'detailing' | 'mechanic' | 'tires' | 'towing',
  limit: number (default: 5)
}
```

**Example**:
```
User: "Find me a car wash"
AI: [Calls search_nearby_shops({ category: 'detailing' })]
Result: Lists 5 nearby detailing shops
```

#### 2. `get_service_recommendations`
**Purpose**: Get maintenance recommendations based on mileage and dates

**Parameters**:
```typescript
{
  vehicle_id: string
}
```

**Example**:
```
User: "What service do I need?"
AI: [Calls get_service_recommendations({ vehicle_id: '...' })]
Result: "Oil change (5,200 miles since last), 60k service coming up"
```

#### 3. `request_quotes`
**Purpose**: Create marketplace job to get quotes from local shops

**Parameters**:
```typescript
{
  problem_description: string,
  category: string
}
```

**Example**:
```
User: "My brakes are squeaking"
AI: "I can help you get quotes from local shops."
AI: [Calls request_quotes({ problem_description: 'Brake squeak', category: 'mechanic' })]
Result: Creates marketplace_jobs entry, shops are notified
```

#### 4. `check_vehicle_health`
**Purpose**: Get current health status and alerts

**Parameters**:
```typescript
{
  vehicle_id: string
}
```

**Example**:
```
User: "How's my car?"
AI: [Calls check_vehicle_health({ vehicle_id: '...' })]
Result: Health score, oil life %, detail health %, alerts
```

---

## 6. UI Streaming

### Real-Time Text Display
```typescript
// Word-by-word streaming
"Your" → "Your 2018" → "Your 2018 Hyundai" → ...

// Cursor indicator
"Your car is doing|" (pulsing cursor while streaming)

// Complete
"Your car is doing great! ✓"
```

### Implementation
```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Parse Server-Sent Events
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));
    
    if (data.type === 'content') {
      // Append to message in real-time
      accumulatedContent += data.content;
      updateMessage(accumulatedContent);
    }
  }
}
```

---

## 7. Message Types

### User Messages
```
┌─────────────────────────────────────┐
│ Is my car okay?                     │
└─────────────────────────────────────┘
                                    [👤]
```

### Assistant Messages
```
[A]  ┌─────────────────────────────────┐
     │ Let me check your vehicle...    │
     │                                 │
     │ **Vehicle Health Report**       │
     │ 🚗 2018 Hyundai Elantra         │
     │ 📊 Health Score: 92%            │
     │ ✅ All systems normal           │
     └─────────────────────────────────┘
```

### Function Call Messages
```
[A]  ┌─────────────────────────────────┐
     │ 🔧 check_vehicle_health         │
     │ {                               │
     │   "health_score": 92,           │
     │   "oil_life": 85,               │
     │   "alerts": []                  │
     │ }                               │
     └─────────────────────────────────┘
```

---

## 8. Sample Conversations

### Example 1: Health Check
```
User: "How's my car doing?"

AI: [Calls check_vehicle_health()]

AI Response: "Let me check your vehicle health...

**Vehicle Health Report**
🚗 2018 Hyundai Elantra
📊 Health Score: 92%
🛢️ Oil Life: 85%
🧼 Detail Health: 95%
📏 Mileage: 58,420 miles

✅ All systems normal! Your car is in excellent condition."
```

### Example 2: Find Shops
```
User: "I need a car wash"

AI: [Calls search_nearby_shops({ category: 'detailing', limit: 5 })]

AI Response: "I found 5 nearby detailing shops:

**Arise And Shine VT** ✓
Detailing • 123 Main St, Pasadena
📞 555-0100

**Quick Shine Car Wash**
Detailing • 456 Oak Ave, Hollywood
📞 555-0200

Would you like me to help you book an appointment?"
```

### Example 3: Request Quotes
```
User: "My brakes are squeaking, can you help?"

AI: "Brake squeaking can indicate worn brake pads or rotors. Let me get you quotes from local mechanics."

AI: [Calls request_quotes({ 
  problem_description: 'Brake squeak - needs inspection',
  category: 'mechanic'
})]

AI Response: "✅ I've sent your brake issue to 3 local mechanics. You'll be notified when they send quotes (usually within 30 minutes)!"
```

### Example 4: Service Recommendations
```
User: "What maintenance should I do?"

AI: [Calls get_service_recommendations({ vehicle_id: '...' })]

AI Response: "Based on your vehicle's history:

**Recommended Services:**

**Oil Change** (high priority)
You've driven 5,200 miles since your last oil change

**60,000 Mile Major Service** (medium priority)
You're at 58,420 miles - approaching the 60k milestone

Would you like me to find shops for these services?"
```

---

## 9. Error Handling

### No OpenAI Key
```typescript
if (!process.env.OPENAI_API_KEY) {
  return new Response(
    'AI Assistant not configured. Please add OPENAI_API_KEY to .env.local',
    { status: 503 }
  );
}
```

### API Errors
```typescript
try {
  const stream = await openai.chat.completions.create({...});
} catch (error) {
  console.error('OpenAI error:', error);
  return new Response(
    JSON.stringify({ error: 'AI service unavailable' }),
    { status: 500 }
  );
}
```

### Function Execution Errors
```typescript
try {
  const result = await executeFunction(functionName, args, supabase, userId);
  // Success
} catch (error) {
  console.error('Function error:', error);
  return { error: 'Function execution failed' };
}
```

---

## 10. Security Considerations

### Authentication
- **Required**: Must be logged in to use chat API
- **User verification**: `supabase.auth.getUser()` on every request
- **Scoped queries**: All database queries filtered by `user_id`

### Data Privacy
- **No cross-user data**: AI can only see YOUR vehicles/services
- **Conversation privacy**: History stays in browser (not saved)
- **Function permissions**: Tools only access user's own data

### Rate Limiting (Future)
```typescript
// Add to API route
const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  max: 10, // 10 requests per minute
});

if (rateLimiter.isBlocked(userId)) {
  return new Response('Too many requests', { status: 429 });
}
```

---

## 11. Cost Management

### OpenAI Pricing (GPT-4 Turbo)
- **Input**: ~$0.01 per 1,000 tokens
- **Output**: ~$0.03 per 1,000 tokens

### Average Conversation
```
System Prompt: ~500 tokens ($0.005)
User Message: ~50 tokens ($0.0005)
AI Response: ~200 tokens ($0.006)
---
Total per message: ~$0.01
```

### Optimization Strategies
1. **Limit conversation history**: Only last 10 messages
2. **Compress context**: Only send relevant vehicle data
3. **Cache common responses**: Frequent questions (FAQ)
4. **Use cheaper models**: GPT-3.5 for simple queries
5. **Token limits**: `max_tokens: 1000` cap

---

## 12. Alternative: Anthropic Claude

### Using Claude Instead
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stream = await anthropic.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: message }],
  tools: [...],
});
```

### Why Claude?
- ✅ Better instruction following
- ✅ More natural conversations
- ✅ Better tool use accuracy
- ✅ Competitive pricing
- ❌ Less ecosystem support

---

## 13. Testing the AI

### Setup
1. Get OpenAI API key from https://platform.openai.com/api-keys
2. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
3. Restart dev server: `npm run dev`

### Test Cases

#### Test 1: Basic Conversation
```
User: "Hello"
Expected: Friendly greeting, offers help
```

#### Test 2: Context Awareness
```
User: "What car do I have?"
Expected: "You have a 2018 Hyundai Elantra"
```

#### Test 3: Function Calling
```
User: "Find me a mechanic"
Expected: [Calls search_nearby_shops] → Lists mechanics
```

#### Test 4: Health Check
```
User: "Is my car okay?"
Expected: [Calls check_vehicle_health] → Shows health report
```

#### Test 5: Quote Request
```
User: "I need brake pads replaced"
Expected: [Calls request_quotes] → Creates marketplace job
```

---

## 14. UI/UX Features

### Streaming Indicator
- **Pulsing cursor**: Shows AI is typing
- **Word-by-word**: Text appears gradually
- **Loading state**: "Thinking..." button during response

### Message Styling
```css
User Messages:
- Emerald/cyan gradient background
- Right-aligned
- User avatar (👤)

Assistant Messages:
- Dark zinc background
- Left-aligned
- "A" avatar (cyan/emerald gradient)
- Markdown support (bold, lists)

Function Messages:
- Purple background
- Small text
- JSON preview
```

### Input Features
- **Multi-line**: Textarea (not input)
- **Enter to send**: Shift+Enter for new line
- **Auto-scroll**: Scrolls to bottom on new messages
- **Disabled during loading**: Prevents spam

---

## 15. Future Enhancements

### Phase 2: Advanced Features
- **Voice input**: Speech-to-text
- **Image upload**: "What's wrong with my dashboard?" (photo)
- **Conversation memory**: Save chat history to database
- **Suggested prompts**: Quick action buttons

### Phase 3: AI Capabilities
- **VIN decoder**: Extract full vehicle specs
- **Recall lookup**: Check NHTSA database
- **Price comparison**: "Is $200 fair for oil change?"
- **Appointment scheduling**: Direct calendar integration

### Phase 4: Business AI
- **Shop assistant**: AI for business owners
- **Quote generator**: AI-powered pricing
- **Customer service**: Automated responses
- **Inventory management**: AI predictions

---

## 16. Monitoring & Analytics

### Track These Metrics
```typescript
// Message volume
totalMessages: number;
averageMessagesPerUser: number;

// Function usage
functionCallCounts: Record<string, number>;
mostUsedFunctions: string[];

// Performance
averageResponseTime: number; // ms
streamingLatency: number; // ms

// Costs
totalTokensUsed: number;
estimatedCost: number; // USD
costPerUser: number;

// Quality
thumbsUpRate: number; // %
conversationCompletionRate: number; // %
```

### Logging
```typescript
console.log('[AI] User:', userId);
console.log('[AI] Message:', message.substring(0, 50));
console.log('[AI] Functions:', functionCalls.map(f => f.name));
console.log('[AI] Tokens:', { input: 500, output: 200 });
console.log('[AI] Cost:', '$0.012');
```

---

## 17. Production Checklist

```
[ ] Add OPENAI_API_KEY to production environment
[ ] Set up error tracking (Sentry)
[ ] Add rate limiting (10 messages/minute per user)
[ ] Implement conversation history (save to DB)
[ ] Add thumbs up/down feedback
[ ] Monitor token usage and costs
[ ] Set up alerts for high usage
[ ] Add fallback to mock responses if API fails
[ ] Test all function calls thoroughly
[ ] Add user feedback collection
```

---

## 18. Cost Estimates

### Monthly Cost Projections

**100 Users**:
- 10 messages/user/month = 1,000 messages
- ~$0.01/message = **$10/month**

**1,000 Users**:
- 10 messages/user/month = 10,000 messages
- ~$0.01/message = **$100/month**

**10,000 Users**:
- 10 messages/user/month = 100,000 messages
- ~$0.01/message = **$1,000/month**

### Revenue vs Cost
```
User pays $19/month for Gold
AI costs ~$1/month per active user
---
Profit margin: ~95%
```

---

## 19. Files Created/Modified

### New Files
```
app/api/chat/
  └── route.ts              - AI chat API with streaming

app/assistant/
  └── LiveAssistant.tsx     - Streaming chat UI component

.env.example                - Updated with OPENAI_API_KEY
```

### Modified Files
```
app/assistant/
  └── page.tsx              - Replaced mock logic with live AI

.env.local                  - Added OPENAI_API_KEY placeholder
```

---

## 20. Quick Start Guide

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key (starts with `sk-...`)

### Step 2: Configure Environment
```bash
# Add to .env.local
OPENAI_API_KEY=sk-proj-...your-key-here
```

### Step 3: Restart Server
```bash
npm run dev
```

### Step 4: Test the AI
1. Navigate to `/assistant`
2. Type: "How's my car?"
3. Watch the response stream in real-time
4. See function calls execute

---

## 21. Comparison: Mock vs Live

| Feature | Mock AI | Live AI |
|---------|---------|---------|
| **Intelligence** | Keyword matching | GPT-4 reasoning |
| **Context** | Hardcoded | Real database |
| **Responses** | Canned | Generated |
| **Streaming** | ❌ | ✅ Word-by-word |
| **Function Calls** | ❌ | ✅ 4 tools |
| **Conversation** | ❌ | ✅ Remembers chat |
| **Cost** | Free | ~$0.01/message |
| **Accuracy** | Limited | Very high |

---

## 22. Sample System Prompt

```
You are AUTOPILOT, a world-class automotive AI assistant.

USER VEHICLE INFORMATION:
- Vehicle: 2018 Hyundai Elantra
- Mileage: 58,420 miles
- Health Score: 92%
- Last Oil Change: May 12, 2023
- Last Detail: June 3, 2023

RECENT SERVICE HISTORY:
- Full Synthetic Oil Change at Local Quick Lube on 5/12/2023 ($89.99)
- Brake Pad Replacement at Arise And Shine VT on 6/3/2023 ($249.00)

CURRENT DATE: February 13, 2026

YOUR GOAL: Save the user money and keep their car safe.
```

---

## 23. Response Quality Tips

### Good Responses
✅ "Based on your 2018 Elantra's 58,420 miles..."
✅ "Since your last oil change was in May 2023..."
✅ "I found 3 shops within 5 miles..."

### Bad Responses (Avoid)
❌ "I don't have access to your vehicle data"
❌ "Please consult a professional"
❌ Generic responses without context

### Pro Tips for Prompt Engineering
1. **Be specific**: "Check the user's vehicle health" not "Check health"
2. **Use context**: Always reference actual data
3. **Be proactive**: Suggest actions, don't just answer
4. **Format well**: Use markdown, emojis, structure

---

## 24. Debugging

### Enable Debug Logging
```typescript
// In app/api/chat/route.ts
console.log('[AI DEBUG] User:', user.id);
console.log('[AI DEBUG] Context:', context);
console.log('[AI DEBUG] Messages:', messages);
console.log('[AI DEBUG] Stream chunk:', chunk);
```

### Common Issues

**Issue**: "AI says it doesn't have my vehicle data"
**Fix**: Check system prompt includes context, verify vehicle fetch succeeded

**Issue**: "Streaming doesn't work"
**Fix**: Ensure headers include `Content-Type: text/event-stream`

**Issue**: "Function calls not executing"
**Fix**: Check tool definitions match OpenAI format, verify function names in switch statement

---

## 25. Environment Variables

### Required
```bash
OPENAI_API_KEY=sk-proj-...     # Required for AI chat
NEXT_PUBLIC_SUPABASE_URL=...   # Required for database
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...  # Required
```

### Optional
```bash
ANTHROPIC_API_KEY=...          # If using Claude instead
AI_MODEL=gpt-4-turbo-preview   # Override default model
AI_MAX_TOKENS=1000             # Token limit per response
```

---

## Conclusion

The AUTOPILOT AI Assistant is now powered by **real intelligence**:

✅ **GPT-4 Integration**: World-class language model  
✅ **Streaming Responses**: Real-time word-by-word typing  
✅ **Database Context**: AI knows your vehicle and history  
✅ **Function Calling**: AI can execute real actions  
✅ **Professional UI**: Modern chat interface  

**Setup Time**: 5 minutes (just add OpenAI key)  
**User Experience**: 10x better than mock logic  
**Business Value**: Premium feature worth the $19/month Gold tier  

---

**Built with ❤️ by the AUTOPILOT team**

*"The AI that actually knows your car."*