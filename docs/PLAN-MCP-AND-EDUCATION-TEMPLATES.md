# Plan: MCP Server Fix & Template Coverage (Coaches, Fitness Trainers, Online Trainers)

**Created:** 2026-02-12  
**Status:** Planning

---

## Part 0: Restructure — MCP Server & Showcase Inside Flowstarter Library

**Target:** The MCP server and showcase app should live **inside** `flowstarter-library`, not as separate top-level apps.

### Current Structure
```
apps/
├── flowstarter-library/    # templates, docs
├── flowstarter-showcase/    # standalone
└── mcp-server/              # standalone
```

### Target Structure
```
apps/flowstarter-library/
├── mcp-server/              # MCP server (moved from apps/mcp-server)
├── showcase/                # Showcase app (moved from apps/flowstarter-showcase)
├── templates/
│   └── example/
├── docs/
├── package.json
├── project.json
└── ...
```

### Migration Steps

1. **Move mcp-server:** `apps/mcp-server` → `apps/flowstarter-library/mcp-server`
2. **Move showcase:** `apps/flowstarter-showcase` → `apps/flowstarter-library/showcase`
3. **Update MCP server paths:** `TEMPLATES_DIR` becomes `path.resolve(__dirname, '..', 'templates', 'example')` (relative to mcp-server root)
4. **Update Nx project configs:** Create/update `project.json` in flowstarter-library to define `mcp-server` and `showcase` as nested projects, or use `apps/flowstarter-library/mcp-server/project.json` and `apps/flowstarter-library/showcase/project.json`
5. **Update root package.json scripts:** Point `dev:library` and `dev:showcase` to new paths
6. **Update pnpm-workspace:** May need to add `apps/flowstarter-library/mcp-server` and `apps/flowstarter-library/showcase` if they have their own package.json
7. **Remove old directories:** Delete `apps/mcp-server` and `apps/flowstarter-showcase` after move

### Nx Consideration

Nx discovers projects by default from `apps/*` and `packages/*`. After the move, projects will be at:
- `apps/flowstarter-library/mcp-server`
- `apps/flowstarter-library/showcase`

Nx should discover these if each has a `project.json`. The `cwd` in project.json targets must use the new paths (e.g. `apps/flowstarter-library/mcp-server`).

### Part 0 Implementation Checklist

- [ ] **0.1** Move `apps/mcp-server` → `apps/flowstarter-library/mcp-server`
- [ ] **0.2** Move `apps/flowstarter-showcase` → `apps/flowstarter-library/showcase`
- [ ] **0.3** Update `mcp-server` project.json `cwd` to `apps/flowstarter-library/mcp-server`
- [ ] **0.4** Update `showcase` project.json `cwd` to `apps/flowstarter-library/showcase`
- [ ] **0.5** Update root `package.json` scripts (`dev:library`, `dev:showcase`)
- [ ] **0.6** Delete `apps/mcp-server` and `apps/flowstarter-showcase` (after move verified)
- [ ] **0.7** Verify pnpm/nx workspace still discovers projects

---

## Part 1: Make the MCP Server Work

### 1.1 Root Cause: Template Path Mismatch

**Problem:** The MCP server looks for templates at `apps/flowstarter-library/templates` but the actual templates live under `templates/example/` (e.g. `tutor-online`, `dental-clinic`, `legal-services`).

The `TemplateFetcher` only scans **direct children** of `TEMPLATES_DIR`. It finds:
- `example/` (a directory) — no `package.json` or `config.json` at its root → **skipped**
- Result: **0 templates loaded**

**Fix:** Update `TEMPLATES_DIR` to point to the template containers. After Part 0 restructure, MCP server lives at `flowstarter-library/mcp-server`:

| File | Change To |
|------|-----------|
| `mcp-server/src/server.ts` | `path.resolve(__dirname, '..', '..', 'templates', 'example')` |
| `mcp-server/src/http-server.ts` | same |

*(From `mcp-server/src/`, `../..` = flowstarter-library root, so `templates/example` resolves correctly.)*

**Alternative:** Make `TemplateFetcher` recursively scan subdirectories. This is more flexible but adds complexity. The simple path fix is recommended first.

---

### 1.2 Config File Support

**Problem:** Some templates use `template.json` (e.g. `dental-clinic`, `restaurant-page`) while the parser expects `config.json`.

**Fix:** In `template-fetcher.ts` and `template-parser.ts`, add fallback logic:
- Check for `config.json` first
- If missing, check for `template.json`

---

### 1.3 Authentication & Environment

**Required for MCP server start:**
- `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in `.env`

**For local development without auth:**
```env
DISABLE_AUTH=true
```

**Verification steps:**
1. Copy `.env.example` to `.env`
2. Add Clerk keys or set `DISABLE_AUTH=true` for testing
3. Start: `pnpm nx run @flowstarter/mcp-server dev:http`
4. Check: `curl http://localhost:3001/health`
5. List templates: `curl http://localhost:3001/api/templates`

---

### 1.4 Template Parser Compatibility

**Astro templates:** The parser expects `src/` directory. Templates like `tutor-online`, `dental-clinic` use `src/` — ✅ compatible.

**Templates with `config.json` vs `template.json`:** Add parser support for both filenames.

---

### 1.5 Implementation Checklist (MCP Server)

*Prerequisite: Part 0 restructure complete (mcp-server inside flowstarter-library).*

- [ ] **1.5.1** Update `TEMPLATES_DIR` in `server.ts` to `path.resolve(__dirname, '..', '..', 'templates', 'example')`
- [ ] **1.5.2** Update `TEMPLATES_DIR` in `http-server.ts` to match
- [ ] **1.5.3** In `template-fetcher.ts`: accept `template.json` OR `config.json` when detecting templates
- [ ] **1.5.4** In `template-parser.ts`: read `config.json` or fallback to `template.json`
- [ ] **1.5.5** Ensure `.env` is configured (Clerk or `DISABLE_AUTH=true`)
- [ ] **1.5.6** Run tests: `pnpm nx run @flowstarter/mcp-server test`
- [ ] **1.5.7** Manual smoke test: start server, list templates, scaffold one

---

## Part 2: Dedicated Template Strategy

**Approach:** Have **dedicated templates** for each audience — not just metadata extensions. Three distinct categories:

| Category | Target | Templates |
|----------|--------|-----------|
| **Coaches** | Life, business, career, executive coaches | `coach-pro` (dedicated) |
| **Fitness trainers** | Personal trainers, gyms, fitness instructors | `fitness-coach` (dedicated, exists) |
| **Online trainers** | People who teach skills online (courses, workshops, lessons) | `edu-course-creator`, `edu-skills-instructor` |

*No dedicated templates for academic educators (tutors, K–12). Focus is on online trainers only.*

---

## Part 2A: Dedicated Coach Template

### 2A.1 Purpose

**Coaches** focus on transformation, accountability, and 1-on-1 sessions — not teaching structured skills. Life coaches, business coaches, career coaches, executive coaches need a template that emphasizes:
- Personal story and credibility
- Transformation/results
- Session packages and booking
- Testimonials from clients

### 2A.2 Template: `coach-pro`

**Status:** To be created (dedicated template)

**Pages:**
- Home (hero, transformation promise, social proof)
- About (story, credentials, philosophy)
- Services/Offerings (coaching packages, 1-on-1, group)
- Testimonials (client success stories)
- Booking (Calendly/Cal.com)
- Contact

**Content emphasis:**
- Trust, authenticity, transformation
- Services as packages (not courses)
- Client outcomes over curriculum

**Integrations:** Booking, newsletter, payments (for packages)

---

## Part 2B: Dedicated Fitness Trainer Template

### 2B.1 Purpose

**Fitness trainers** focus on physical training, workouts, gyms, personal training. Distinct from coaches (mindset) and educators (skills).

### 2B.2 Template: `fitness-coach`

**Status:** ✅ Exists — ensure it is clearly the **dedicated** fitness trainer template

**Current:** Has config.json, booking, newsletter, pricing, testimonials. Category: fitness. UseCase: fitness, personal-trainer, gym, wellness, coaching.

**Actions:**
- Position as the **dedicated** fitness trainer template (not a generic coach)
- Add tags: `["fitness", "personal-trainer", "gym", "trainer", "workout", "athletic"]`
- Ensure description says "Dedicated template for fitness trainers and personal trainers"
- Consider adding `slug` or `name` like "Fitness Trainer Pro" if not already

---

## Part 2C: Dedicated Online Trainer Templates

### 2C.1 Purpose

**Online trainers** teach skills online — courses, workshops, lessons. Different from coaches (transformation) and fitness trainers (physical training).

*No dedicated templates for academic educators (tutors, K–12). Focus is on online trainers only.*

| Persona | Teaches | Key Needs |
|--------|---------|-----------|
| **Course creator** | Online courses (Udemy, Teachable-style) | Course catalog, pricing, signup |
| **Skills instructor** | Coding, photography, music, crafts, workshops | Lessons/skills catalog, booking |

### 2C.2 Templates

#### `edu-course-creator` — To be created

**Focus:** Online course creators (Udemy, Teachable, Kajabi-style). Course catalog, pricing, testimonials, video embed.

**Pages:** Home, Courses, Pricing, About, Contact/Booking

**Content:** `content/courses.md`, `content/pricing.md`, course cards, video embeds

---

#### `edu-skills-instructor` — To be created (optional)

**Focus:** Instructors who teach specific skills online (coding, photography, music, crafts). Lessons/workshops rather than full courses.

**Pages:** Home, Skills/Lessons, About, Booking, Contact

**Content:** Lessons as cards, workshop offerings, booking integration

---

### 2C.3 Recommended Approach

**Phase 1:** Create `edu-course-creator` (course creators)

**Phase 2 (optional):** Create `edu-skills-instructor` (skills instructors)

---

## Part 3: Implementation Checklists

### 3.1 Coach Template Checklist

- [ ] **3.1.1** Create `templates/example/coach-pro/` as dedicated coach template
- [ ] **3.1.2** Add config.json: category `coaching`, tags `["coach", "life-coach", "business-coach", "career-coach", "executive-coach"]`
- [ ] **3.1.3** Content: transformation-focused hero, about story, services/packages, testimonials
- [ ] **3.1.4** Integrations: booking, newsletter, payments
- [ ] **3.1.5** Add palettes, thumbnails, full structure per templates-system SKILL

---

### 3.2 Fitness Trainer Template Checklist

- [ ] **3.2.1** Update `fitness-coach/config.json`: ensure description says "Dedicated template for fitness trainers and personal trainers"
- [ ] **3.2.2** Add tags: `["fitness", "personal-trainer", "gym", "trainer", "workout", "athletic"]`
- [ ] **3.2.3** Add slug/name "Fitness Trainer Pro" or similar if needed

---

### 3.3 Online Trainer Templates Checklist

**edu-course-creator (new):**
- [ ] **3.3.1** Create `templates/example/edu-course-creator/`
- [ ] **3.3.2** Add config.json: category `education`, tags `["online-trainer", "course", "creator", "udemy", "teachable", "instructor"]`
- [ ] **3.3.3** Content: courses, pricing, testimonials, integrations
- [ ] **3.3.4** Full template structure per SKILL

**edu-skills-instructor (optional):**
- [ ] **3.3.5** Create `templates/example/edu-skills-instructor/` for coding, photography, etc.

---

## Part 4: Dependencies & Order

```
0. Restructure (Part 0)        ← MCP server & showcase inside flowstarter-library
1. Fix MCP server (Part 1)     ← Path fix, config.json support
2. Dedicated templates:
   a. coach-pro                ← New dedicated template for coaches
   b. fitness-coach            ← Polish as dedicated fitness trainer template (exists)
   c. edu-course-creator       ← New template for online trainers (course creators)
   d. edu-skills-instructor    ← Optional: online skills instructors (coding, photography, etc.)
```

---

## Summary

**Infrastructure:**
| Item | Effort | Priority |
|------|--------|----------|
| Restructure (MCP + showcase inside library) | Medium | **High** |
| MCP path fix + config.json support | Small | **High** |

**Dedicated templates:**
| Template | Status | Effort | Priority |
|----------|--------|--------|----------|
| **coach-pro** | New | Large | **High** |
| **fitness-coach** | Exists — polish as dedicated fitness trainer | Small | **High** |
| **edu-course-creator** | New — online trainers (course creators) | Large | **High** |
| **edu-skills-instructor** | New (optional) — online skills instructors | Large | Low |

---

## References

- `flowstarter-library/mcp-server/README.md` — MCP server setup (after Part 0)
- `apps/flowstarter-library/docs/MCP-INTEGRATION.md` — Integration flow
- `apps/flowstarter-library/docs/TEMPLATE-CREATION.md` — Template creation
- `apps/flowstarter-library/.claude/skills/templates-system/SKILL.md` — Template structure
