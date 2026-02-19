# Flowstarter MCP Server

Model Context Protocol (MCP) server that exposes Flowstarter Library to the platform and editor for template discovery, browsing, and scaffolding.

## Overview

This MCP server provides programmatic access to all Flowstarter Library, enabling:
- **Platform**: Display available templates with rich metadata
- **Editor**: Scaffold complete projects with selected templates
- **AI Assistants**: Help users discover and select appropriate templates

## Features

- 📦 **Template Discovery**: List all available templates with metadata
- 🔍 **Search & Filter**: Find templates by keywords, category, or use case
- 📊 **Rich Metadata**: File counts, LOC statistics, tech stack information
- 🏗️ **Complete Scaffolding**: Get all template files and contents for project creation
- ⚡ **Fast**: In-memory caching with on-demand file loading

## Available Tools

### `list_templates`
List all available Flowstarter Library with metadata.

**Input**: None

**Output**:
```json
{
  "templates": [
    {
      "slug": "local-business-pro",
      "displayName": "Local Business Pro",
      "description": "Premium template for local businesses",
      "category": "local-business",
      "useCase": ["Restaurants", "Cafes", "Salons", "Gyms"],
      "fileCount": 147,
      "totalLOC": 14500
    }
  ]
}
```

### `get_template_details`
Get comprehensive details about a specific template.

**Input**:
```json
{
  "slug": "local-business-pro"
}
```

**Output**: Complete template object with metadata, config, file tree, and package.json

### `scaffold_template`
Get complete file structure and contents for scaffolding a template in the editor.

**Input**:
```json
{
  "slug": "local-business-pro"
}
```

**Output**:
```json
{
  "scaffold": {
    "template": { /* complete template metadata */ },
    "files": [
      {
        "path": "app/page.tsx",
        "content": "...",
        "type": "file"
      },
      // ... all other files
    ]
  }
}
```

### `search_templates`
Search templates by keywords, category, or use case.

**Input**:
```json
{
  "query": "restaurant"
}
```

**Output**: Array of matching templates with metadata

## Installation

```bash
bun install
bun run build
```

### Authentication Setup (Required)

⚠️ **Authentication is REQUIRED**. The server will not start without Clerk configuration.

1. **Create a Clerk Account**: Sign up at [clerk.com](https://clerk.com)
2. **Get API Keys**: Navigate to [Clerk Dashboard](https://dashboard.clerk.com) > API Keys
3. **Configure Environment**:

```bash
cp .env.example .env
# Edit .env and add your Clerk keys
```

**Environment Variables**:
```env
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
```

**Authentication Behavior**:
- Server requires `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` to start
- All tool calls require a valid Clerk session token
- Returns **401 Unauthorized** if token is missing or invalid
- Returns **403 Forbidden** if user doesn't have permissions

## Deployment

### Docker Deployment (Recommended for Production)

The server can be deployed as a Docker container for easy deployment to any infrastructure.

**Quick Start with Docker Compose:**
```bash
# 1. Create environment file
cd mcp-server
cp .env.example .env

# 2. Add your Clerk credentials to .env
# 3. Build and run from repository root
cd ..
docker-compose up -d

# 4. View logs
docker-compose logs -f mcp-server
```

**Using Docker CLI:**
```bash
# Build from repository root
cd /path/to/flowstarter-library
docker build -t flowstarter-library .

# Run
docker run -it --rm \
  -e CLERK_SECRET_KEY="your_secret_key" \
  -e CLERK_PUBLISHABLE_KEY="your_publishable_key" \
  mcp-server
```

📖 **See [DOCKER.md](./DOCKER.md) for complete deployment guide including:**
- Production deployment strategies
- Kubernetes deployment examples
- Cloud platform deployment (AWS, GCP, Azure)
- Troubleshooting and best practices

## Usage

### With MCP Inspector (Testing)

```bash
bun run inspect
```

This opens the MCP Inspector UI for testing all tools interactively.

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "flowstarter-library": {
      "command": "node",
      "args": [
        "/path/to/flowstarter-library/mcp-server/build/index.js"
      ]
    }
  }
}
```

### Programmatic Usage

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// ... use the server in your application
```

## Integration Examples

### Platform Integration

```typescript
// Connect to MCP server
const client = new MCPClient();
await client.connect('http://localhost:3000');

// If Clerk authentication is enabled, include session token
const sessionToken = await clerk.session.getToken();

// List templates for display
const { templates } = await client.callTool('list_templates', {
  _sessionToken: sessionToken // Include if auth is enabled
});

// Display template cards
templates.forEach(template => {
  renderTemplateCard({
    name: template.displayName,
    description: template.description,
    useCase: template.useCase,
    stats: `${template.fileCount} files, ${template.totalLOC} LOC`
  });
});
```

### Editor Integration

```typescript
// User selects a template
const selectedSlug = 'local-business-pro';

// Get user's Clerk session token (if auth is enabled)
const sessionToken = await clerk.session.getToken();

// Get complete scaffold data
const { scaffold } = await client.callTool('scaffold_template', {
  slug: selectedSlug,
  _sessionToken: sessionToken // Include if auth is enabled
});

// Create project with all files
scaffold.files.forEach(file => {
  fs.writeFileSync(
    path.join(projectDir, file.path),
    applyVariableReplacements(file.content, {
      PROJECT_NAME: userProjectName,
      PROJECT_DESCRIPTION: userDescription,
      // ... other variables
    })
  );
});

// Install dependencies
exec('bun install', { cwd: projectDir });
```

## Template Structure

Each template includes:
- **README.md**: Description, features, use cases
- **config.json**: Template configuration
- **content.md**: Content structure and text
- **package.json**: Dependencies and scripts
- **Complete file tree**: All source files (excluding node_modules, build artifacts)

## Templates Included

### Local Business Pro
- **Category**: Local Business
- **Use Cases**: Restaurants, Cafes, Salons, Gyms, Service businesses
- **Files**: 147
- **LOC**: ~14,500

### Personal Brand Pro
- **Category**: Personal Brand
- **Use Cases**: Consultants, Freelancers, Coaches, Executives
- **Files**: 148
- **LOC**: ~14,500

### SaaS Product Pro
- **Category**: SaaS Product
- **Use Cases**: Software products, Web applications, Digital services
- **Files**: 145
- **LOC**: ~14,500

## Development

```bash
# Install dependencies
bun install

# Set up environment (required)
cp .env.example .env
# Add your Clerk keys to .env

# Build
bun run build

# Watch mode
bun run dev

# Test with inspector
bun run inspect
```

## Testing

The server includes comprehensive test coverage using Vitest.

### Run Tests

```bash
# Run all tests once
bun test

# Run tests in watch mode (re-runs on file changes)
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage report
bun run test:coverage
```

### Test Coverage

The test suite covers:

- **File Reader** (9 tests)
  - Building file trees
  - Excluding node_modules and build artifacts
  - Sorting directories before files
  - Counting lines of code by extension

- **Template Fetcher** (22 tests)
  - Loading all 3 templates
  - Template metadata validation
  - File tree generation
  - Search functionality (by name, use case, category)
  - Category filtering

- **Authentication** (7 tests)
  - Auth requirement validation
  - Clerk configuration checks
  - Function availability tests

**Total: 38 tests, all passing ✓**

### Test Output Example

```
✓ src/utils/file-reader.test.ts (9 tests)
✓ src/utils/template-fetcher.test.ts (22 tests)
✓ src/utils/auth.test.ts (7 tests)

Test Files  3 passed (3)
     Tests  38 passed (38)
```

## Authentication

### Clerk Integration

The server uses Clerk for authentication when `CLERK_SECRET_KEY` is configured.

**How it works**:
1. Platform/Editor obtains Clerk session token from authenticated user
2. Session token is included in tool calls via `_sessionToken` parameter
3. Server verifies token with Clerk API
4. If valid, request is processed; if invalid, 401 error is returned

**Session Token Format**:
```typescript
await client.callTool('list_templates', {
  _sessionToken: 'sess_xxxxxxxxxxxxxxxxxxxxx'
});
```

**Token Verification**:
- Validates session is active
- Extracts user ID and email
- Logs authenticated requests

**Error Responses**:

401 Unauthorized (No token):
```json
{
  "error": "Unauthorized: Authentication required. Please provide a valid Clerk session token.",
  "statusCode": 401,
  "code": "UNAUTHORIZED"
}
```

401 Unauthorized (Invalid token):
```json
{
  "error": "Unauthorized: Invalid or expired session token.",
  "statusCode": 401,
  "code": "INVALID_TOKEN"
}
```

403 Forbidden (No permissions):
```json
{
  "error": "Forbidden: You do not have permission to access this resource.",
  "statusCode": 403,
  "code": "FORBIDDEN"
}
```

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts           # Main entry point
│   ├── types/
│   │   └── templates.ts   # TypeScript interfaces
│   ├── utils/
│   │   ├── template-fetcher.ts   # Template scanner
│   │   ├── template-parser.ts    # Metadata parser
│   │   └── file-reader.ts        # File tree builder
│   └── tools/
│       ├── list.ts        # list_templates
│       ├── details.ts     # get_template_details
│       ├── scaffold.ts    # scaffold_template
│       └── search.ts      # search_templates
├── build/                 # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Performance

- **Template loading**: < 2s on startup
- **list_templates**: < 50ms
- **get_template_details**: < 10ms
- **scaffold_template**: < 1s (includes reading all files)
- **search_templates**: < 20ms

## Future Enhancements

- [ ] HTTP/SSE transport for remote access
- [x] Docker container deployment
- [ ] Template preview images
- [ ] Template versioning
- [ ] Custom template support
- [ ] Template analytics

## License

MIT

## Support

For questions and support, visit [Flowstarter](https://flowstarter.app)
