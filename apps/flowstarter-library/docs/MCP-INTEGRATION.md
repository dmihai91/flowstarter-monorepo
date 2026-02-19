# MCP Server Integration with Flowstarter UI

This guide explains how the Flowstarter Next.js application integrates with the MCP templates server to fetch and display templates.

## Architecture Overview

```
┌─────────────────────────────────┐
│   Flowstarter Next.js App       │
│   (localhost:3000)               │
│                                  │
│  ┌─────────────────────────┐    │
│  │  Templates Page (UI)    │    │
│  └──────────┬──────────────┘    │
│             │ fetch()            │
│  ┌──────────▼──────────────┐    │
│  │ /api/local-templates    │    │
│  │ (API Route)             │    │
│  └──────────┬──────────────┘    │
│             │                    │
│  ┌──────────▼──────────────┐    │
│  │ TemplatesServiceClient  │    │
│  │ (MCP Client Wrapper)    │    │
│  └──────────┬──────────────┘    │
│             │ MCP SDK            │
└─────────────┼────────────────────┘
              │ HTTP + MCP Protocol
              │ (Streamable HTTP)
┌─────────────▼────────────────────┐
│   MCP Templates Server           │
│   (localhost:3001)               │
│                                  │
│  ┌─────────────────────────┐    │
│  │  MCP Tools              │    │
│  │  - list_templates       │    │
│  │  - get_template_details │    │
│  │  - scaffold_template    │    │
│  │  - search_templates     │    │
│  └─────────────────────────┘    │
└──────────────────────────────────┘
```

## Components

### 1. MCP Client (`src/lib/templates/mcp-client.ts`)

A TypeScript client that wraps the MCP SDK to communicate with the MCP server using Streamable HTTP transport.

**Key Features:**
- Connects to MCP server via HTTP
- Handles authentication by passing Clerk session tokens
- Provides typed interfaces for all template operations
- Auto-connects on first method call
- Proper cleanup with disconnect method

**Methods:**
```typescript
- listTemplates(): Promise<McpTemplateListItem[]>
- getTemplateDetails(slug: string): Promise<McpTemplateDetails>
- scaffoldTemplate(slug: string): Promise<McpScaffoldData>
- searchTemplates(query: string): Promise<McpTemplateListItem[]>
```

### 2. Templates Service Client (`src/lib/templates/templates-service-client.ts`)

Updated to use the MCP client instead of direct filesystem access. Maintains backward compatibility with existing code.

**Configuration:**
```typescript
constructor(sessionToken?: string) {
  this.mcpUrl = process.env.MCP_SERVER_URL || 'http://localhost:3001';
  this.sessionToken = sessionToken || null;
}
```

### 3. API Route (`src/app/api/local-templates/route.ts`)

Server-side API endpoint that:
1. Authenticates the user via Clerk
2. Gets the user's session token
3. Creates an authenticated MCP client
4. Fetches templates from MCP server
5. Returns templates to the frontend

### 4. Templates Page (UI)

Existing UI components continue to work without changes:
- `TemplateRecommendations.tsx` - Fetches from `/api/local-templates`
- Display logic remains the same
- No breaking changes to existing functionality

## Authentication Flow

```
1. User visits templates page (authenticated via Clerk)
2. Frontend calls GET /api/local-templates
3. API route validates authentication
4. API route gets Clerk session token
5. API route creates MCP client with token
6. MCP client calls MCP server with token in tool arguments
7. MCP server validates token with Clerk
8. MCP server returns templates
9. API route returns templates to frontend
10. UI displays templates
```

## Setup Instructions

### 1. Start MCP Server

```bash
cd flowstarter-templates/mcp-server

# Copy environment file
cp .env.example .env

# Add your Clerk keys to .env
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# For local testing without auth (development only)
# DISABLE_AUTH=true

# Build and start
bun run build
bun run build/index.js --mode=http
```

Server will start on `http://localhost:3001`

### 2. Configure Flowstarter App

```bash
cd flowstarter

# Add to .env or .env.local
MCP_SERVER_URL=http://localhost:3001

# Restart the Next.js dev server
bun run dev
```

### 3. Verify Integration

1. Open Flowstarter at `http://localhost:3000`
2. Navigate to the templates page
3. Templates should load from the MCP server
4. Check browser DevTools Network tab for `/api/local-templates` calls
5. Check MCP server console for incoming requests

## Development Tips

### Local Testing Without Authentication

For local development, you can disable authentication on the MCP server:

```bash
# In mcp-server/.env
DISABLE_AUTH=true
```

**⚠️ NEVER use this in production!**

### Debugging

**MCP Server Logs:**
```bash
# The MCP server logs to stderr
node build/index.js --mode=http 2>&1 | tee server.log
```

**Check MCP Server Health:**
```bash
curl http://localhost:3001/health
```

**Test MCP Endpoint:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
```

### Common Issues

**Port Conflicts:**
- MCP server: Port 3001
- Flowstarter app: Port 3000
- If either port is in use, update the respective `.env` file

**Authentication Errors:**
- Ensure Clerk keys match in both `.env` files
- Check that session token is being passed correctly
- Verify user is logged in to Flowstarter

**CORS Issues:**
- MCP server has CORS enabled by default (`*`)
- For production, update `CORS_ORIGIN` to your domain

## Environment Variables

### MCP Server (`mcp-server/.env`)
```env
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
HTTP_PORT=3001
HTTP_HOST=0.0.0.0
CORS_ORIGIN=*
```

### Flowstarter App (`flowstarter/.env.local`)
```env
MCP_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Production Deployment

### MCP Server
1. Deploy using Docker (see `DOCKER.md`)
2. Use HTTPS endpoint
3. Configure proper CORS origin
4. Enable Clerk authentication (never use `DISABLE_AUTH=true`)

### Flowstarter App
1. Update `MCP_SERVER_URL` to production MCP server URL
2. Ensure Clerk keys match across both services
3. Test authentication flow in staging first

### Example Production Config

**MCP Server:**
```env
MCP_SERVER_URL=https://mcp.yourapp.com
CORS_ORIGIN=https://yourapp.com
```

**Flowstarter App:**
```env
MCP_SERVER_URL=https://mcp.yourapp.com
```

## API Reference

### MCP Tools

#### `list_templates`
Lists all available templates with metadata.

**Arguments:**
```json
{
  "_sessionToken": "clerk_session_token"
}
```

**Response:**
```json
{
  "templates": [
    {
      "slug": "local-business-pro",
      "displayName": "Local Business Pro",
      "description": "Professional template for local businesses",
      "category": "local-business",
      "useCase": ["restaurant", "retail", "services"],
      "fileCount": 45,
      "totalLOC": 1500
    }
  ]
}
```

#### `get_template_details`
Get comprehensive details about a specific template.

**Arguments:**
```json
{
  "slug": "local-business-pro",
  "_sessionToken": "clerk_session_token"
}
```

#### `scaffold_template`
Get complete file structure with contents for a template.

**Arguments:**
```json
{
  "slug": "local-business-pro",
  "_sessionToken": "clerk_session_token"
}
```

#### `search_templates`
Search templates by keywords.

**Arguments:**
```json
{
  "query": "restaurant",
  "_sessionToken": "clerk_session_token"
}
```

## Image Support

The MCP server now supports thumbnail and preview images for templates:

### Endpoints
- **Thumbnail**: `GET /api/templates/{slug}/thumbnail`
- **Preview**: `GET /api/templates/{slug}/preview`

### How It Works
1. Each template directory can contain `thumbnail.png` and/or `preview.png`
2. The `list_templates` tool checks for these files
3. If found, URLs are included in the response
4. The Flowstarter UI automatically displays these images

### Adding Images
See `TEMPLATE-IMAGES.md` for detailed instructions on creating and adding template images.

### Current Status
- ✅ HTTP endpoints for serving images
- ✅ Metadata includes `thumbnailUrl` and `previewUrl`
- ✅ Placeholder files created for all templates
- ⏳ Real images need to be added (currently empty placeholders)

## Future Enhancements

- [ ] Variable replacement support in templates
- [ ] Auto-generate preview images from templates
- [ ] Caching layer for improved performance
- [ ] WebSocket support for real-time updates
- [ ] Template versioning
- [ ] Custom template uploads
- [ ] Multiple preview images (carousel)
- [ ] Animated previews (GIF or video)

## Troubleshooting

### Templates Not Loading

1. Check MCP server is running: `curl http://localhost:3001/health`
2. Check Flowstarter app has correct `MCP_SERVER_URL`
3. Check browser console for errors
4. Check API route logs in terminal
5. Verify authentication is working

### Authentication Failures

1. Ensure user is logged in to Flowstarter
2. Check Clerk keys match in both `.env` files
3. Try with `DISABLE_AUTH=true` for testing (dev only)
4. Check MCP server logs for auth errors

### Performance Issues

1. Check network latency between app and MCP server
2. Consider adding caching layer
3. Monitor MCP server resource usage
4. Optimize template metadata if needed

## Support

For issues or questions:
1. Check MCP server logs
2. Check Flowstarter app logs
3. Review this integration guide
4. Check individual component documentation
