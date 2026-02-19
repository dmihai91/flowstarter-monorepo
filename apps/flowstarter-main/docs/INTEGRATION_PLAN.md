# Integration Plan: Normalized Convex Tables

## Status: In Progress

### Completed ✅

1. **Schema Design**
   - Created normalized tables for agent state
   - Created normalized tables for wizard state
   - Removed data duplication (project data only in Supabase)
   - Deployed schema successfully

2. **Python Client**
   - Created `ConvexAgentStateClient` in `convex/agent_state.py`
   - Initialized in `CodingAgentService`

3. **React Hooks**
   - Created `useCodingAgentState` hooks
   - Helper hooks for progress and LLM stats

4. **Partial Backend Integration**
   - Added agent session creation in `generate_website`
   - Added execution step tracking (template loading, planning)
   - Added architecture plan saving

### In Progress 🔄

5. **Complete Backend Integration**
   
   **Files to update:**
   
   a. **`coding-agent/src/services/coding_service.py`**
      - ✅ Add `agent_session_id` parameter
      - ✅ Create agent session at start
      - ✅ Track "Load Templates" step
      - ✅ Track "Create Architecture Plan" step
      - ⏳ Track "Generate Code" step
      - ⏳ Track "Test Code" step
      - ⏳ Save generated files metadata
      - ⏳ Save test results
      - ⏳ Update session status on completion/failure
      - ⏳ Pass `agent_session_id` to orchestrator path
   
   b. **`coding-agent/src/llm_router.py`**
      - ✅ Add `agent_session_id` parameter
      - ✅ Add `agent_state_client` parameter
      - ⏳ Log LLM interactions after each call
      - ⏳ Track tokens, latency, cost
      - ⏳ Link to execution step if provided
   
   c. **`coding-agent/src/ag2_agents.py`**
      - ⏳ Accept `agent_session_id` in `generate_code`
      - ⏳ Pass to `llm_router` calls
      - ⏳ Log files to `agentGeneratedFiles`
      - ⏳ Log test results to `agentTestResults`
   
   d. **`coding-agent/src/routers/agent.py`**
      - ⏳ Extract `projectId` from context
      - ⏳ Pass `project_id` and `generation_session_id` to service
      - ⏳ Return `agent_session_id` in response

### TODO 📋

6. **Frontend Integration**
   
   a. **Update `CodingAgentProgress` component**
      - Read from `useCompleteAgentState` instead of old schema
      - Display execution steps from normalized table
      - Show real-time progress
   
   b. **Create `AgentDashboard` component**
      - Display LLM usage stats
      - Show token costs
      - Display execution timeline
      - Show failed steps with errors
   
   c. **Update wizard flow**
      - Pass `projectId` to agent API
      - Store `agent_session_id` for tracking
      - Link wizard session to agent session

7. **Testing**
   - Run full generation flow
   - Verify all tables are populated
   - Check LLM interactions logged
   - Verify execution steps tracked
   - Test UI displays correct data

8. **Migration & Cleanup**
   - Remove old `agentState.ts.old`
   - Update documentation
   - Add migration script for existing data

---

## Integration Points

### Data Flow

```
User Request
    ↓
Next.js API (route.ts)
    ├── Extract projectId from context
    ├── Pass to Python agent
    ↓
Python Agent (coding_service.py)
    ├── Create agent session in Convex
    ├── Read project details from Supabase
    ├── Track execution steps
    ├── Log LLM interactions
    ├── Save generated files metadata
    ├── Save test results
    ↓
React UI
    ├── Query agent state from Convex
    ├── Display progress
    ├── Show LLM stats
    └── Display execution timeline
```

### Key Foreign Keys

```
codingAgentSessions
    ├── projectId → Supabase projects.id
    └── generationSessionId → Convex generationSessions.sessionId

agentExecutionSteps
    └── agentSessionId → codingAgentSessions.sessionId

agentLLMInteractions
    ├── agentSessionId → codingAgentSessions.sessionId
    └── stepId → agentExecutionSteps.stepId (optional)

agentGeneratedFiles
    └── agentSessionId → codingAgentSessions.sessionId

agentArchitecturePlans
    └── agentSessionId → codingAgentSessions.sessionId

agentTestResults
    └── agentSessionId → codingAgentSessions.sessionId
```

---

## Quick Commands

### Deploy Schema
```bash
npx convex dev --once
```

### Test Agent
```python
python -m pytest coding-agent/tests/test_agent_state.py
```

### Check Convex Data
```bash
npx convex query codingAgentState:getCompleteAgentState '{"sessionId": "xxx"}'
```

---

## Next Steps

1. Complete `llm_router.py` integration
2. Update `ag2_agents.py` to pass session IDs
3. Update API route to pass `projectId`
4. Update UI components
5. Test end-to-end
6. Document for team
