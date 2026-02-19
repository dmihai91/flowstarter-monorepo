# Convex Normalized Schema Architecture

## Overview

The Convex database has been refactored to use a **fully normalized schema** with proper separation of concerns. Data is no longer duplicated between Supabase and Convex, and nested objects have been extracted into dedicated tables with foreign key relationships.

## Architecture Principles

### 1. **Single Source of Truth**
- **Supabase**: Project data (name, description, goals, target users, etc.)
- **Convex**: Session state, UI state, agent execution state, temporary wizard data

### 2. **No Data Duplication**
- Project details are stored ONLY in Supabase `projects` table
- Convex references Supabase projects by `projectId`
- No embedded `projectConfig` objects in Convex

### 3. **Fully Normalized**
- Each entity has its own table
- Relationships via foreign keys (`sessionId`, `projectId`, `agentSessionId`)
- No nested objects or arrays of objects

## Table Structure

### Wizard Flow Tables (for UI)

#### `generationSessions`
Main wizard session tracking - minimal data only
- `sessionId` - Unique session ID
- `userId` - User ID  
- `projectId` - Reference to Supabase `projects.id`
- `status` - Session status
- `currentStep` - Current wizard step
- `progress` - Progress percentage
- `templateId`, `previewUrl`, `siteId` - Simple references

**Indexes**: `by_user`, `by_session`, `by_project`, `by_user_status`

#### `wizardUIState`
UI-specific state for the wizard
- `sessionId` (FK → `generationSessions`)
- `hasAIGenerated`, `detailsPhase`, `showSummary`
- `templatePath`, `showAssistantTransition`
- `startedWithTemplate`, `skipLoadingScreen`
- `hasGeneratedSite`, `selectedIndustry`

#### `sessionDesignConfig`
Design configuration during wizard (transient, gets saved to project)
- `sessionId` (FK → `generationSessions`)
- `primaryColor`, `secondaryColor`, `accentColor`
- `fontHeading`, `fontBody`
- `selectedPalette`, `logoUrl`, `logoPrompt`

#### `sessionColorPalettes`
AI-generated color palettes for selection
- `sessionId` (FK → `generationSessions`)
- `paletteIndex`
- `primaryColor`, `secondaryColor`, `accentColor`

#### `sessionDomainConfig`
Domain configuration (transient)
- `sessionId` (FK → `generationSessions`)
- `domain`, `provider`, `domainType`

#### `sessionGenerationSteps`
UI progress steps for generation display
- `sessionId` (FK → `generationSessions`)
- `stepId`, `label`, `stepOrder`
- `status`, `message`
- `startedAt`, `completedAt`

#### `sessionFileStorage`
Reference to Convex Storage for generated files
- `sessionId` (FK → `generationSessions`)
- `codeArchiveId` - Convex Storage ID
- `codeArchiveSize`, `fileCount`
- `totalUncompressedSize`, `fileHash`

#### `sessionFileMetadata`
Metadata for individual files
- `sessionId` (FK → `generationSessions`)
- `filePath`, `sizeBytes`, `hash`

#### `sessionUploadedImages`
User-uploaded images during wizard
- `sessionId` (FK → `generationSessions`)
- `imageUrl`, `imageName`

---

### Coding Agent Tables

#### `codingAgentSessions`
Main agent execution session tracking
- `sessionId` - Unique agent session ID
- `userId` - User ID
- `projectId` - Reference to Supabase `projects.id`
- `generationSessionId` - Optional link to wizard session
- `agentType` - Type of agent ('coding-agent', 'orchestrator', etc.)
- `useOrchestrator`, `useDaytona`, `templateId`
- `status`, `progress`, `currentStep`
- `siteId`, `previewUrl`, `daytonaWorkspaceId`
- `validationPassed`, `error`, `errorStep`

**Indexes**: `by_session`, `by_user`, `by_project`, `by_generation_session`, `by_user_status`

#### `agentExecutionSteps`
Granular step tracking for agent execution
- `agentSessionId` (FK → `codingAgentSessions`)
- `stepId`, `stepName`, `stepType`, `stepOrder`
- `status`, `message`
- `startedAt`, `completedAt`, `durationMs`
- `input`, `output`, `error`, `metadata`

**Indexes**: `by_agent_session`, `by_agent_session_order`, `by_agent_session_status`

#### `agentLLMInteractions`
Complete LLM call history with metrics
- `agentSessionId` (FK → `codingAgentSessions`)
- `stepId` - Optional link to execution step
- `provider`, `model`, `taskType`
- `systemPrompt`, `userPrompt`, `response`
- `latencyMs`, `tokensUsed`, `cost`
- `success`, `error`

**Indexes**: `by_agent_session`, `by_agent_session_time`, `by_step`

#### `agentGeneratedFiles`
File references (not full content - use storageId)
- `agentSessionId` (FK → `codingAgentSessions`)
- `filePath`, `fileType`, `sizeBytes`
- `storageId` - Link to Convex Storage
- `contentPreview` - First 500 chars
- `hash`, `generatedByStep`

**Indexes**: `by_agent_session`, `by_agent_session_path`

#### `agentArchitecturePlans`
Architecture/planning documents
- `agentSessionId` (FK → `codingAgentSessions`)
- `planType` - 'architecture', 'file-structure', etc.
- `content` - The plan text
- `version` - Plan iteration number
- `generatedByModel` - Which LLM generated it

**Indexes**: `by_agent_session`, `by_agent_session_version`

#### `agentTestResults`
Test execution results
- `agentSessionId` (FK → `codingAgentSessions`)
- `testType` - 'validation', 'build', 'lint', 'typecheck'
- `status`, `output`
- `errors`, `warnings`
- `executionTimeMs`

**Indexes**: `by_agent_session`, `by_agent_session_type`

---

### Activity Logging

#### `generationActivityLog`
Activity log for wizard sessions
- `sessionId` (FK → `generationSessions`)
- `timestamp`, `eventType`
- `eventData`, `message`

**Indexes**: `by_session`, `by_session_time`

---

## Data Flow

### During Wizard Flow

1. User starts wizard → Creates entry in `generationSessions`
2. UI state changes → Updates `wizardUIState`
3. User picks colors → Creates entries in `sessionColorPalettes`
4. User customizes design → Updates `sessionDesignConfig`
5. User configures domain → Updates `sessionDomainConfig`
6. Agent generates code → Creates `codingAgentSessions` + related tables
7. Files generated → Creates `sessionFileStorage` + `sessionFileMetadata`
8. Wizard complete → Project data saved to **Supabase** `projects` table

### During Code Generation

1. Agent starts → Creates entry in `codingAgentSessions`
2. Reads project details from **Supabase** via `projectId`
3. Each step tracked in `agentExecutionSteps`
4. Each LLM call logged in `agentLLMInteractions`
5. Plans saved in `agentArchitecturePlans`
6. Files saved via `agentGeneratedFiles` with `storageId` reference
7. Tests run → Saved in `agentTestResults`
8. Complete → Updates `codingAgentSessions` status

---

## Benefits of Normalization

### ✅ **Advantages**

1. **No Duplication** - Project data lives in one place (Supabase)
2. **Queryable History** - Can analyze LLM usage, costs, agent behavior
3. **Efficient Storage** - No embedded objects bloating main tables
4. **Flexible Queries** - Join tables as needed for specific views
5. **Scalable** - Add new tracking without modifying main tables
6. **Clear Ownership** - Each table has one clear purpose

### 📊 **Use Cases Enabled**

- Track LLM costs per session, user, or project
- Analyze agent performance metrics
- Debug failed generations step-by-step
- View architecture plan evolution
- Audit complete agent behavior
- Calculate token usage statistics
- Monitor test pass/fail rates

---

## Migration Strategy

### Phase 1: Add New Tables (DONE ✅)
- New tables added to schema
- Indexes created for efficient queries
- Python client created
- React hooks created

### Phase 2: Dual Write
- Update Python agent to write to BOTH old and new tables
- Update UI to read from new tables with fallback to old
- Monitor for issues

### Phase 3: Data Migration
- Script to migrate existing data from old to new tables
- Validate data integrity

### Phase 4: Deprecate Old Structure
- Remove old nested objects from schema
- Remove old read paths from UI
- Clean up legacy code

### Phase 5: Cleanup
- Remove migration compatibility code
- Update documentation
- Performance optimization

---

## API Usage

### Python (Agent)

```python
from convex.agent_state import ConvexAgentStateClient

client = ConvexAgentStateClient(convex_url)

# Create session
client.create_session(
    session_id="abc123",
    user_id="user_xyz",
    agent_type="coding-agent",
    use_orchestrator=True,
    project_id="proj_456"
)

# Add execution step
client.add_execution_step(
    agent_session_id="abc123",
    step_id="step_1",
    step_name="Generate Architecture Plan",
    step_type="planning",
    step_order=1
)

# Log LLM interaction
client.log_llm_interaction(
    agent_session_id="abc123",
    provider="openai",
    model="gpt-4",
    task_type="planning",
    success=True,
    tokens_used=1500,
    cost=0.045
)
```

### React (UI)

```typescript
import {
  useCompleteAgentState,
  useAgentProgress,
  useAgentLLMStats,
} from '@/hooks/useCodingAgentState';

function AgentDashboard({ sessionId }: { sessionId: string }) {
  const state = useCompleteAgentState(sessionId);
  const progress = useAgentProgress(sessionId);
  const llmStats = useAgentLLMStats(sessionId);

  return (
    <div>
      <h2>Progress: {progress?.progress}%</h2>
      <p>Status: {progress?.status}</p>
      <p>Current: {progress?.currentStep?.stepName}</p>
      
      <h3>LLM Usage</h3>
      <p>Total Calls: {llmStats?.totalCalls}</p>
      <p>Total Tokens: {llmStats?.totalTokens}</p>
      <p>Total Cost: ${llmStats?.totalCost.toFixed(4)}</p>
    </div>
  );
}
```

---

## Summary

The new normalized architecture provides:
- **Clean separation** between Supabase (source of truth for projects) and Convex (session/execution state)
- **Full observability** of agent execution with detailed tracking
- **Efficient storage** with no data duplication
- **Flexible querying** with proper indexes
- **Scalable design** that can grow with new requirements

All project data is stored in Supabase, while Convex handles transient session state and detailed execution tracking.
