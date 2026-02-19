# Flowstarter Editor Skills

This directory contains skill documentation for AI agents working on the Flowstarter Editor codebase. Each skill file provides guidelines, best practices, and code examples for specific domains.

## Available Skills

| Skill | Description |
|-------|-------------|
| [clean-code-skill.md](./clean-code-skill.md) | Writing clean, maintainable TypeScript code |
| [frontend-skill.md](./frontend-skill.md) | Building React components with Nanostores and UnoCSS |
| [backend-skill.md](./backend-skill.md) | Building APIs with Remix, Convex, and Daytona |
| [design-skill.md](./design-skill.md) | Creating professional, accessible UI designs |
| [flowops-skill.md](./flowops-skill.md) | Building agents using the FlowOps framework |
| [gretly-skill.md](./gretly-skill.md) | Working with the Gretly orchestration engine |
| [testing-skill.md](./testing-skill.md) | Writing unit and E2E tests with Vitest and Playwright |

## Quick Reference

### Tech Stack

- **Frontend:** React 19 + Remix + Vite + TypeScript
- **Styling:** UnoCSS + Tailwind + CSS Variables
- **State:** Nanostores (NOT Redux/Zustand)
- **Backend:** Convex (real-time database) + Node.js/Express
- **Code Execution:** Daytona (cloud sandboxes)
- **AI:** OpenRouter + Anthropic Claude SDK + Groq
- **Testing:** Vitest (unit) + Playwright (E2E)

### Key Conventions

```
Naming:
├── Components: PascalCase (FileTree.tsx)
├── Hooks: usePrefix (useFileTree.ts)
├── Stores: camelCase (files.ts)
├── Types: PascalCase (FileEntry)
└── Constants: SCREAMING_SNAKE_CASE (MAX_RETRIES)

File Limits:
├── Maximum 250 lines per file
├── Maximum 20 lines per function
└── Split by responsibility when exceeded

State Management:
├── Use nanostores (atom, map, computed)
├── Use useStore from @nanostores/react
└── Actions are plain functions, not methods
```

### Project Structure

```
flowstarter-editor/
├── app/
│   ├── components/     # React components
│   ├── lib/
│   │   ├── flowops/    # Generic agent framework
│   │   ├── flowstarter/# App-specific agents
│   │   ├── gretly/     # Orchestration engine
│   │   ├── stores/     # Nanostores state
│   │   ├── services/   # Backend services
│   │   └── hooks/      # Custom React hooks
│   ├── routes/         # Remix routes & API
│   └── types/          # TypeScript types
├── convex/             # Convex backend
├── __tests__/          # Test files
└── e2e/                # Playwright tests
```

## Usage

When working on the codebase, reference the appropriate skill:

1. **Writing a new component?** → See [frontend-skill.md](./frontend-skill.md) and [design-skill.md](./design-skill.md)
2. **Building an API endpoint?** → See [backend-skill.md](./backend-skill.md)
3. **Creating a new agent?** → See [flowops-skill.md](./flowops-skill.md)
4. **Working on site generation?** → See [gretly-skill.md](./gretly-skill.md)
5. **Writing tests?** → See [testing-skill.md](./testing-skill.md)
6. **Refactoring code?** → See [clean-code-skill.md](./clean-code-skill.md)

## Adding New Skills

To add a new skill:

1. Create a new file: `<skill-name>-skill.md`
2. Follow the existing skill format:
   - Overview section
   - Core concepts
   - Code examples
   - Best practices
   - Checklist
3. Add entry to this README
4. Keep skills focused on one domain
