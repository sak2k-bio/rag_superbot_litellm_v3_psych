# MASTER CONFIGURATION GUIDE

**Quick Reference for Modifying RAG Superbot + Therapy Craft Mode**

This document provides quick instructions for making common modifications to the application without breaking functionality.

---

## 📋 Table of Contents

1. [UI Component Modifications](#ui-component-modifications)
2. [Backend & API Configuration](#backend--api-configuration)
3. [System Prompts & AI Behavior](#system-prompts--ai-behavior)
4. [Environment Variables](#environment-variables)
5. [API Routes & Security](#api-routes--security)
6. [Payment & Cost Configuration](#payment--cost-configuration)
7. [Quick Tweaks Checklist](#quick-tweaks-checklist)

---

## 🎨 UI Component Modifications

### 1. Main Chat Interface (`src/app/page.tsx`)

#### Component Sizes & Layout
```tsx
// Main container width
<div className="max-w-7xl mx-auto">  // Change max-w-7xl to max-w-6xl, max-w-5xl, etc.

// Message container height
<div className="h-[600px]">  // Adjust height value

// Input box size
<textarea className="min-h-[80px]">  // Change min-h value
```

#### Colors & Styling
```tsx
// Primary gradient colors
className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
// Change: indigo-50, purple-50, pink-50 to your preferred colors

// Button colors
className="bg-purple-600 hover:bg-purple-700"
// Change: purple-600/700 to blue-600/700, green-600/700, etc.

// Text colors
className="text-slate-800 dark:text-slate-100"
```

#### UI Text Changes
```tsx
// Line 124-126: Main title
<h1 className="text-3xl font-bold">
    Therapy Craft <span className="text-purple-600">Studio</span>
</h1>

// Line 127: Subtitle
<p className="text-slate-600">Design custom therapeutic protocols with AI precision</p>
```

### 2. Therapy Craft Page (`src/app/therapy-craft/page.tsx`)

#### Component Sizes
```tsx
// Grid layout (Line 132)
<main className="grid grid-cols-1 lg:grid-cols-12">
// Left column: lg:col-span-5 (5/12 width)
// Right column: lg:col-span-7 (7/12 width)

// Adjust ratio by changing span values (must add up to 12)
```

#### Section Spacing
```tsx
// Section padding (Line 138, 157, 221, etc.)
className="p-6 rounded-2xl"  // Change p-6 to p-4, p-8, etc.

// Section gaps
className="space-y-6"  // Change space-y-6 to space-y-4, space-y-8, etc.
```

#### Button Styling
```tsx
// Generate button (Line 417-424)
className="py-4 bg-gradient-to-r from-purple-600 to-indigo-600"
// Change colors and padding

// Copy button (Line 432-440)
className="px-4 py-2 bg-purple-600 hover:bg-purple-700"
```

### 3. Global Styles (`src/app/globals.css`)

#### Color Scheme
```css
/* Lines 23-90: Tailwind theme colors */
@theme {
  --color-background: 0 0% 100%;  /* White background */
  --color-foreground: 222.2 84% 4.9%;  /* Dark text */
  /* Modify HSL values for custom colors */
}
```

#### Custom Protocol Output Styling
```css
/* Lines 93-118: Protocol display styles */
.list-item {
  margin-left: 1.5rem;  /* Adjust indentation */
  margin-bottom: 0.5rem;  /* Adjust spacing */
}

.prose h2 {
  font-size: 1.5rem;  /* Adjust heading sizes */
}
```

---

## ⚙️ Backend & API Configuration

### 1. LiteLLM Client (`src/lib/litellm-client.ts`)

#### Timeout Settings
```typescript
// Line 80: API timeout
timeout: 300000,  // 5 minutes (300,000ms)
// Reduce for faster failures, increase for longer requests
```

#### Model Configuration
```typescript
// Line 39: Default model
const DEFAULT_MODEL = 'gemini-2.0-flash-lite';
// Change to: 'gpt-4o', 'claude-3-5-sonnet', etc.

// Line 40-41: Default parameters
const DEFAULT_TEMPERATURE = 0.7;  // 0.0 = deterministic, 1.0 = creative
const DEFAULT_MAX_TOKENS = 2048;  // Max response length
```

### 2. Google Sheets Integration (`src/lib/google-sheets.ts`)

#### Sheet Range
```typescript
// Line 42: Target range
range: 'Sheet1!A:E',  // Change sheet name or column range
```

#### Data Columns
```typescript
// Lines 30-37: Column order
[
  data.timestamp,      // Column A
  data.patientId,      // Column B
  data.demographics,   // Column C
  data.diagnosis,      // Column D
  data.protocolSummary // Column E
]
// Add/remove columns as needed
```

### 3. Vector Store (`src/lib/vectorstore.ts`)

#### Collection Settings
```typescript
// Collection name from env: NEXT_PUBLIC_COLLECTION_NAME
// Embedding dimensions: 3072 (for gemini-embedding-001)
// Distance metric: Cosine
```

---

## 🤖 System Prompts & AI Behavior

### 1. Therapy Craft Mode Prompt (`src/app/api/therapy-craft/route.ts`)

#### Main System Prompt (Lines 78-106)
```typescript
const systemPrompt = `
${selectedPersona.instruction}

You are creating a therapy session protocol for professional clinical use.

CRITICAL OUTPUT REQUIREMENTS:
1. Use SIMPLE, CLEAN formatting - this will be read by therapists, not AI systems
2. Use only these heading levels:
   - Main sections: ## Section Name
   - Subsections: ### Subsection Name
3. Use simple bullet points (-) for lists, NO nested bullets
4. Write in clear, professional paragraphs
5. NO dialogue format, NO "Therapist:" or "Patient:" labels
6. NO complex nested structures
7. Focus on: objectives, techniques, interventions, and clinical notes

OUTPUT DEPTH: ${depthInstruction}
`;
```

**To Modify:**
- Add/remove formatting rules
- Change tone (professional → casual, technical → simple)
- Add specific requirements (e.g., "Include homework assignments")

#### Depth Instructions (Lines 20-26)
```typescript
const depthMap: Record<number, string> = {
    1: "Concise output. Use bullet points and brief summaries.",
    2: "Standard professional output. Balanced detail.",
    3: "Detailed output. Include specific examples and rationale.",
    4: "Very detailed. Include dialogue scripts and in-depth clinical reasoning.",
    5: "Extremely detailed and stepwise. Comprehensive guide..."
};
```

**To Modify:** Change descriptions for each depth level

### 2. Persona Definitions (`src/definitions/personas.ts`)

```typescript
export const PERSONAS = [
    {
        id: 'cbt',
        name: 'CBT Therapist',
        description: 'Focuses on identifying and challenging cognitive distortions.',
        instruction: 'You are a CBT therapist...'  // MODIFY THIS
    },
    // Add new personas here
];
```

**To Add New Persona:**
1. Add new object to PERSONAS array
2. Set unique `id`
3. Write custom `instruction` prompt

### 3. RAG Pipeline Prompts (`src/lib/agents.ts`)

#### Query Agent (Lines ~50-70)
```typescript
const prompt = `Analyze this user query and extract key information...`;
```

#### Answer Agent (Lines ~200-250)
```typescript
const prompt = `You are a helpful AI assistant...
Context: ${context}
Question: ${query}`;
```

**To Modify:** Change agent behavior, tone, or instructions

---

## 🔐 Environment Variables

### Required Variables (`.env` or `.env.local`)

```bash
# ============================================
# LITELLM & AI MODELS
# ============================================
LITELLM_PROXY_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
NEXT_PUBLIC_GEMINI_TEMPERATURE=0.7
NEXT_PUBLIC_GEMINI_MAX_TOKENS=2048

# ============================================
# VECTOR DATABASE (QDRANT)
# ============================================
NEXT_PUBLIC_QDRANT_CLOUD_URL=https://your-cluster.cloud.qdrant.io
NEXT_PUBLIC_QDRANT_CLOUD_API_KEY=your_qdrant_api_key
NEXT_PUBLIC_VECTOR_STORE=qdrant
NEXT_PUBLIC_COLLECTION_NAME=therapy_top_12_gemini

# ============================================
# GOOGLE SHEETS INTEGRATION
# ============================================
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'

# ============================================
# OPTIONAL: LOCAL DEVELOPMENT
# ============================================
NEXT_PUBLIC_QDRANT_HOST=localhost
NEXT_PUBLIC_QDRANT_PORT=6333
NEXT_PUBLIC_OLLAMA_HOST=http://localhost:11434
```

### How to Change:

1. **Switch AI Model:**
   ```bash
   NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash-exp
   ```

2. **Adjust Creativity:**
   ```bash
   NEXT_PUBLIC_GEMINI_TEMPERATURE=0.9  # More creative
   NEXT_PUBLIC_GEMINI_TEMPERATURE=0.3  # More focused
   ```

3. **Change Collection:**
   ```bash
   NEXT_PUBLIC_COLLECTION_NAME=my_custom_collection
   ```

---

## 🔌 API Routes & Security

### Active API Routes

| Route | File | Method | Security | Purpose |
|-------|------|--------|----------|---------|
| `/api/chat` | `src/app/api/chat/route.ts` | POST | ⚠️ None | Main RAG chatbot |
| `/api/therapy-craft` | `src/app/api/therapy-craft/route.ts` | POST | ⚠️ None | Generate therapy protocols |
| `/api/documents` | `src/app/api/documents/route.ts` | POST, DELETE | ⚠️ None | Upload/delete documents |
| `/api/sample-documents` | `src/app/api/sample-documents/route.ts` | POST | ⚠️ None | Load sample data |
| `/api/status` | `src/app/api/status/route.ts` | GET | ✅ Read-only | System health check |

### Security Levels

**⚠️ WARNING: Currently NO authentication on any routes!**

#### To Add Authentication:

1. **Install NextAuth.js:**
   ```bash
   npm install next-auth
   ```

2. **Protect Routes:**
   ```typescript
   import { getServerSession } from "next-auth/next";
   
   export async function POST(request: NextRequest) {
       const session = await getServerSession();
       if (!session) {
           return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }
       // ... rest of route
   }
   ```

3. **Add Rate Limiting:**
   ```typescript
   import rateLimit from 'express-rate-limit';
   ```

### API Request/Response Examples

#### `/api/therapy-craft`
```typescript
// Request
{
  demographics: { ageGroup: "18-25", gender: "Male", ... },
  clinical: { diagnosis: ["General Anxiety"], ... },
  personaId: "cbt",
  topic: "Managing work stress",
  sessionNumber: "1",
  depth: 3,
  useRag: true
}

// Response
{
  success: true,
  protocol: "## Session Overview\n...",
  sources: [{ content: "...", metadata: {...} }]
}
```

---

## 💳 Payment & Cost Configuration

### Current Status
**No payment integration implemented.**

### To Add Payments:

1. **Stripe Integration:**
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. **Environment Variables:**
   ```bash
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Create Pricing Plans:**
   ```typescript
   const PLANS = {
       free: { price: 0, requests: 10 },
       pro: { price: 999, requests: 1000 },  // $9.99
       enterprise: { price: 4999, requests: -1 }  // Unlimited
   };
   ```

### Cost Tracking

#### Current API Costs (Estimate):
- **LiteLLM (1minAI):** FREE tier
- **Google Gemini:** ~$0.00015 per request (embeddings)
- **Qdrant Cloud:** FREE tier (1GB)
- **Google Sheets:** FREE

#### To Monitor Costs:
```typescript
// Add to litellm-client.ts
console.log('Token usage - Prompt:', usage.prompt_tokens, 'Completion:', usage.completion_tokens);
```

---

## ✅ Quick Tweaks Checklist

### UI Changes
- [ ] Update app title/subtitle → `src/app/therapy-craft/page.tsx` Line 124-127
- [ ] Change primary colors → Search/replace `purple-600` with your color
- [ ] Adjust component spacing → Modify `p-6`, `space-y-6` classes
- [ ] Resize layout columns → Change `lg:col-span-5` / `lg:col-span-7`

### AI Behavior
- [ ] Modify output format → `src/app/api/therapy-craft/route.ts` Lines 78-106
- [ ] Adjust creativity → `.env`: `NEXT_PUBLIC_GEMINI_TEMPERATURE`
- [ ] Change depth levels → `route.ts` Lines 20-26
- [ ] Add new persona → `src/definitions/personas.ts`

### Data & Storage
- [ ] Change Google Sheet → `.env`: `GOOGLE_SHEET_ID`
- [ ] Modify saved columns → `src/lib/google-sheets.ts` Lines 30-37
- [ ] Switch vector collection → `.env`: `NEXT_PUBLIC_COLLECTION_NAME`

### Performance
- [ ] Adjust API timeout → `src/lib/litellm-client.ts` Line 80
- [ ] Change max tokens → `.env`: `NEXT_PUBLIC_GEMINI_MAX_TOKENS`
- [ ] Modify depth defaults → `src/app/therapy-craft/page.tsx` Line 55

---

## 🚨 Important Notes

### DO NOT Modify:
- Core agent logic in `src/lib/agents.ts` (unless you know what you're doing)
- Vector store initialization in `src/lib/vectorstore.ts`
- Pipeline architecture in `src/lib/pipelines.ts`

### Safe to Modify:
- All UI components and styling
- System prompts and instructions
- Environment variables
- Depth level descriptions
- Persona definitions
- Google Sheets column structure

### Testing After Changes:
```bash
# 1. Check TypeScript
npm run build

# 2. Run dev server
npm run dev

# 3. Test functionality
# - Generate a protocol
# - Check Google Sheets
# - Verify output format
```

---

**Last Updated:** 2026-02-05  
**Version:** 1.1.0 (Therapy Craft Mode)
