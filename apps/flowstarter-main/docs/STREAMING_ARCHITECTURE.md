# Streaming Architecture - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          StreamingSteps Component                        │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Step 1: Generate Architecture Plan              │  │  │
│  │  │  🚀 Starting architecture planning [TYPING...]   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Step 2: Generate Code Files [Pending]           │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Props: {steps, currentStep}
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│           useStreamingWebsiteGeneration Hook                    │
│                                                                 │
│  State:                    Event Processing:                   │
│  • steps[]                 • step_start    → Update status     │
│  • currentStep             • step_progress → Update message    │
│  • isGenerating            • step_complete → Mark complete     │
│  • progress                • error         → Set error         │
│  • result                  • done          → Finalize          │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ SSE Events Stream
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              API Route: /api/ai/agent/stream                    │
│                                                                 │
│  async function event_generator():                             │
│    for await event in orchestrator_stream:                     │
│      yield f"data: {json.dumps(event)}\n\n"                    │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Python Generator
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│         Orchestrator Agent (orchestrator_agent.py)              │
│                                                                 │
│  async def execute_plan():                                      │
│    for step in steps:                                           │
│      await callback({"stage": "step_start", ...})               │
│      await callback({"stage": "step_progress", ...})            │
│      # Execute step logic                                       │
│      await callback({"stage": "step_progress", ...})            │
│      await callback({"stage": "step_complete", ...})            │
└─────────────────────────────────────────────────────────────────┘
```

## Event Flow Sequence

```
User clicks "Generate"
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 1. React: Call generate() from hook                             │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. Hook: Open SSE connection to /api/ai/agent/stream            │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. API: Forward request to Python orchestrator                  │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. Orchestrator: Start executing steps                          │
│    ├─ Step 1 Start → SSE Event → UI Update → Typewriter         │
│    ├─ Step 1 Progress → SSE Event → UI Update → Typewriter      │
│    ├─ Step 1 Progress → SSE Event → UI Update → Typewriter      │
│    ├─ Step 1 Complete → SSE Event → UI Update → Show ✅         │
│    │                                                             │
│    ├─ Step 2 Start → SSE Event → UI Update → Typewriter         │
│    ├─ Step 2 Progress → SSE Event → UI Update → Typewriter      │
│    └─ ... (continue for all 10 steps)                           │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. Final: {"status": "done", "data": {siteId, files, ...}}      │
└──────────────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. UI: Display completed result, enable download/preview        │
└──────────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
EnhancedGenerationProgress
    │
    ├── parsePlan() → Display architecture plan
    │
    └── StreamingSteps
            │
            ├── For each step:
            │       │
            │       ├── Status Icon (CheckCircle2/Loader2/XCircle/Circle)
            │       │
            │       ├── Step Name
            │       │
            │       ├── Message → If current step → ResponseStream (typewriter)
            │       │                              → Else → Plain text
            │       │
            │       └── Step Data (files count, score, etc.)
            │
            └── Styling: Dynamic colors based on status
```

## State Management

```
useStreamingWebsiteGeneration Hook
    │
    ├── State Variables
    │   ├── isGenerating: boolean
    │   ├── progress: GenerationProgress | null
    │   ├── steps: GenerationStep[]
    │   ├── currentStep: number
    │   ├── error: string | null
    │   └── result: GenerationResult | null
    │
    ├── Functions
    │   ├── updateStep(stepNum, status, message, data)
    │   ├── updateStepMessage(stepNum, message)  ← NEW
    │   ├── generate(projectDetails, templateInfo)
    │   └── reset()
    │
    └── Event Handlers
        ├── step_start    → setCurrentStep, updateStep(in-progress)
        ├── step_progress → updateStepMessage (typewriter effect)
        ├── step_complete → updateStep(completed)
        ├── step_skipped  → updateStep(skipped)
        ├── error         → setError
        └── done          → setResult, setIsGenerating(false)
```

## Typewriter Effect Flow

```
Backend emits:
{"stage": "step_progress", "step": 2, "message": "🎨 Applying design"}
    ↓
SSE streams to frontend
    ↓
Hook receives event
    ↓
updateStepMessage(2, "🎨 Applying design")
    ↓
Update steps[1].message = "🎨 Applying design"
    ↓
StreamingSteps re-renders
    ↓
For step 2 (current):
    <ResponseStream 
      textStream="🎨 Applying design"
      mode="typewriter"
      speed={80}
    />
    ↓
ResponseStream displays character-by-character animation:
"🎨" → "🎨 A" → "🎨 Ap" → "🎨 App" → ... → "🎨 Applying design"
    ↓
User sees typewriter effect in real-time
```

## Data Structures

### GenerationStep
```typescript
{
  id: string;              // "1", "2", etc.
  name: string;            // "Generate Architecture Plan"
  status: "pending" | "in-progress" | "completed" | "skipped" | "error";
  message?: string;        // Current message with typewriter effect
  data?: {                 // Optional metadata
    plan?: string;
    files?: number;
    score?: number;
    passed?: boolean;
    // ... other step-specific data
  };
}
```

### Progress Event
```typescript
{
  stage: "step_start" | "step_progress" | "step_complete" | "step_skipped" | "error" | "done";
  step?: number;           // 1-10
  name?: string;           // Step name
  message?: string;        // Display message
  data?: StepData;         // Optional metadata
}
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────┐
│ Optimization Strategy                                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Selective Re-rendering                                   │
│    - Only current step uses ResponseStream                  │
│    - Completed steps render static text                     │
│    - React.memo on StreamingSteps if needed                 │
│                                                             │
│ 2. requestAnimationFrame                                    │
│    - ResponseStream uses RAF for smooth 60fps              │
│    - No blocking on main thread                             │
│                                                             │
│ 3. SSE Keep-alive                                           │
│    - Periodic ": keepalive\n\n" prevents timeout            │
│    - 0.1s timeout in queue check                            │
│                                                             │
│ 4. Minimal State Updates                                    │
│    - updateStepMessage only touches one step                │
│    - No full steps array recreation                         │
│                                                             │
│ 5. Event Batching                                           │
│    - Backend sends events at natural pace                   │
│    - No artificial throttling needed                        │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

```
Error can occur at multiple levels:

┌─────────────────────────────────────────────────────────────┐
│ Backend Orchestrator                                        │
│   • Step execution fails                                    │
│   • emit: {"stage": "error", "message": "..."}              │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ API Route                                                   │
│   • Catches exception                                       │
│   • yield: {"status": "error", "message": "..."}            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ React Hook                                                  │
│   • Detects error status/stage                              │
│   • setError(message)                                       │
│   • setIsGenerating(false)                                  │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ UI Component                                                │
│   • Displays error state                                    │
│   • Red error banner                                        │
│   • Failed step shows XCircle icon                          │
└─────────────────────────────────────────────────────────────┘
```

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Test Level      │ What to Test                              │
├─────────────────┼───────────────────────────────────────────┤
│ Unit            │ - StreamingSteps renders all statuses    │
│                 │ - updateStepMessage updates correctly     │
│                 │ - ResponseStream animates text            │
├─────────────────┼───────────────────────────────────────────┤
│ Integration     │ - Hook processes SSE events correctly     │
│                 │ - Component updates on state changes      │
│                 │ - Error states propagate properly         │
├─────────────────┼───────────────────────────────────────────┤
│ E2E             │ - Full generation flow completes          │
│                 │ - All 10 steps show and animate           │
│                 │ - Final result displays correctly         │
├─────────────────┼───────────────────────────────────────────┤
│ Visual          │ - Typewriter effect is smooth             │
│                 │ - Colors match design system              │
│                 │ - Dark mode works correctly               │
│                 │ - Mobile responsive                       │
└─────────────────────────────────────────────────────────────┘
```

---

This architecture enables real-time, engaging progress updates that keep users informed and engaged throughout the website generation process.
