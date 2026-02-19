# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Flowstarter Library is a template repository for an AI-powered website builder targeting non-technical users. It consists of three main components:

1. **Templates** - Production-ready website templates built with TanStack Start (React 19)
2. **MCP Server** - Model Context Protocol server that exposes templates programmatically
3. **Templates Showcase** - React-based preview interface for browsing templates

The repository is structured as a monorepo using Bun workspaces.

## Development Setup

**Prerequisites**: This project uses **Bun** (not npm/pnpm) for package management.

### Install Bun (if not already installed)

```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### Quick Start

**The repository has two separate development servers:**

1. **Showcase** (`bun run dev:showcase`) - Visual preview at http://localhost:5173
2. **MCP Server** (`bun run dev:mcp`) - API server for platform integration (stdio mode)

**For most development work (templates/showcase):**

```bash
# Install all dependencies
bun install

# Start showcase dev server
bun run dev:showcase
```

**For platform integration (MCP server):**

```bash
# In another terminal
bun run dev:mcp
```

## Common Commands

### Building

```bash
# Build all templates
bun run build:templates

# Build MCP server
bun run build:mcp

# Build showcase app
bun run build:showcase
```

### MCP Server

```bash
cd mcp-server

# Build TypeScript
bun run build

# Run in stdio mode (default)
bun start

# Run in HTTP mode
bun run start:http

# Test with MCP Inspector
bun run inspect

# Run tests
bun test                # Run once
bun run test:watch      # Watch mode
bun run test:ui         # UI mode
bun run test:coverage   # With coverage
```

### Working with Templates

```bash
# Navigate to a template
cd templates/local-business-pro
# or cd templates/personal-brand-pro
# or cd templates/saas-product-pro

# Install dependencies
bun install

# Start development server (runs on port 3000)
cd start
bun dev

# Build production version
bun run build
```

### Docker

```bash
# Build and start all services (cross-platform)
bun run docker:dev

# Rebuild from scratch
bun run docker:dev:rebuild

# Manual Docker commands
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f mcp-server

# Stop services
docker-compose down
```

### Utilities

```bash
# Generate template thumbnails (uses Node.js for Playwright)
npm run thumbnails:generate

# Update existing thumbnails
npm run thumbnails:update
```

## Architecture

### Template Structure

Each template (local-business-pro, personal-brand-pro, saas-product-pro) follows this pattern:

```
template-name/
├── start/                    # TanStack Start app
│   ├── src/
│   │   ├── routes/          # Page routes (TanStack Router)
│   │   └── styles/          # Global styles
│   ├── app.config.ts        # TanStack Start configuration
│   └── package.json
├── content.md               # All text content with template variables
├── config.json              # Template metadata (id, category, defaults)
├── package.json             # Template-level dependencies
└── README.md
```

**Key Concepts**:
- Templates use TanStack Start (not Next.js or plain Vite)
- All content lives in `content.md` with variable placeholders like `{{PROJECT_NAME}}`
- Each template's app code is in the `start/` subdirectory
- Build artifacts go to `.vinxi/` (not `dist/` or `build/`)

### Template Variables

Templates support automatic variable replacement:
- `{{PROJECT_NAME}}` - Business/product name
- `{{PROJECT_DESCRIPTION}}` - Brief description
- `{{TARGET_USERS}}` - Target audience
- `{{BUSINESS_GOALS}}` - Business objectives
- `{{PROJECT_NAME_SLUG}}` - URL-friendly version
- `{{YEAR}}` - Current year

These are replaced at generation time by the platform or `scripts/generate-template.js`.

### MCP Server Architecture

The MCP server (`mcp-server/`) is the bridge between the Flowstarter platform and templates:

**Startup Flow**:
1. Validates Clerk authentication configuration (required)
2. Scans all template directories
3. Extracts metadata from README.md, config.json, content.md, package.json
4. Builds complete file trees (excludes node_modules, .git, .vinxi, build artifacts)
5. Caches metadata in memory

**Available Tools**:
- `list_templates` - Get all templates with metadata
- `get_template_details` - Get comprehensive details for one template
- `scaffold_template` - Get complete file tree + contents for project creation
- `search_templates` - Search by keywords/category

**Authentication**:
- **Clerk authentication is REQUIRED** - server will not start without it
- All tool calls require a valid Clerk session token via `_sessionToken` parameter
- Returns 401 if token missing/invalid, 403 if no permissions

**File Structure**:
```
src/
├── index.ts              # Entry point, validates Clerk config
├── server.ts             # MCP server setup
├── http-server.ts        # HTTP transport (for production)
├── tools/                # Tool implementations
│   ├── list.ts
│   ├── details.ts
│   ├── scaffold.ts
│   └── search.ts
├── utils/
│   ├── auth.ts           # Clerk authentication
│   ├── template-fetcher.ts    # Scans and indexes templates
│   ├── template-parser.ts     # Extracts metadata
│   └── file-reader.ts         # Builds file trees
└── types/
    └── templates.ts      # TypeScript definitions
```

### Tech Stack

**Templates**:
- Framework: TanStack Start (full-stack React)
- React: 19
- Styling: Tailwind CSS with custom color palette
- Icons: Lucide React
- TypeScript: Full type safety
- Build: Vinxi (Vite-based)

**MCP Server**:
- Runtime: Bun
- Language: TypeScript
- Framework: @modelcontextprotocol/sdk
- Auth: @clerk/backend
- Testing: Vitest (38 tests)

**Showcase**:
- Framework: Vite + React 18
- Styling: Tailwind CSS

## Testing

The MCP server has comprehensive test coverage:

```bash
cd mcp-server
bun test
```

**Test Files**:
- `utils/auth.test.ts` - Clerk configuration and authentication (7 tests)
- `utils/file-reader.test.ts` - File tree building and LOC counting (9 tests)
- `utils/template-fetcher.test.ts` - Template loading, metadata, search (22 tests)

All tests use Vitest and run in Bun's native test runner.

## Environment Variables

### MCP Server (.env in mcp-server/)

**Required**:
```env
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

**Optional**:
```env
NODE_ENV=production
HTTP_PORT=3001
HTTP_HOST=0.0.0.0
CORS_ORIGIN=*
```

## Deployment

### Docker (Recommended)

The Dockerfile builds a single image containing:
- Built MCP server
- Built showcase app (served from public/)
- All template source files

```bash
# From repository root
docker build -t flowstarter-library .
docker run -it --rm \
  -e CLERK_SECRET_KEY="your_key" \
  -e CLERK_PUBLISHABLE_KEY="your_key" \
  -p 3001:3001 \
  flowstarter-library
```

Or use docker-compose:
```bash
docker-compose up -d
```

### Vercel (Templates)

Individual templates can be deployed to Vercel:
```bash
cd templates/local-business-pro
vercel deploy
```

## Important Notes

### When Working with Templates

1. **Run commands from the template directory**, not the repository root
2. **Development server must be started from `start/` subdirectory**: `cd start && bun dev`
3. **Build artifacts go to `.vinxi/`**, not `dist/` or `build/`
4. **Content changes go in `content.md`**, not in component files
5. **Never commit generated test templates** (test-*/, my-*-test/) - they're .gitignored

### When Working with MCP Server

1. **Clerk auth is required** - server will not start without CLERK_SECRET_KEY
2. **Test files are in `src/utils/`** with `.test.ts` extension
3. **Tests must pass before committing** - run `bun test`
4. **HTTP mode is for production** - use stdio mode for local MCP testing
5. **Template scanning happens at startup** - restart server after adding templates

### Build Scripts

- `scripts/build-all-templates.js` - Builds all templates in parallel
- `scripts/generate-template.js` - Creates new project from template with variable replacement
- `scripts/generate-template-thumbnails.js` - Uses Playwright to capture screenshots (requires Node.js)
- `scripts/dev.ps1` / `scripts/dev.sh` - Starts all services for development

## Troubleshooting

**"Module not found" in templates**: Ensure you've run `bun install` in both the template root AND the `start/` directory.

**MCP server won't start**: Check that `.env` exists in `mcp-server/` with valid Clerk keys.

**Docker build fails**: Ensure you're building from repository root, not a subdirectory.

**Tests fail in MCP server**: Make sure you're using Bun to run tests (`bun test`), not Node.js.

**Template dev server 404s**: Ensure you're running from the `start/` subdirectory, not the template root.
