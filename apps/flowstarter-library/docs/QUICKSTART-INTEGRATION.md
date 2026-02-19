# Quick Start: MCP Integration

This is a quick reference for setting up the MCP server integration with Flowstarter.

## Files Changed

### Flowstarter App (Next.js)
- ✅ `src/lib/templates/mcp-client.ts` - New MCP SDK client wrapper
- ✅ `src/lib/templates/templates-service-client.ts` - Updated to use MCP client
- ✅ `src/app/api/local-templates/route.ts` - Updated to pass Clerk auth token
- ✅ `.env.example` - Added `MCP_SERVER_URL=http://localhost:3001`

### MCP Server
- ✅ `src/http-server.ts` - Updated default port to 3001
- ✅ `.env.example` - Updated default port to 3001

## Setup in 3 Steps

### 1. Start MCP Server (Terminal 1)

```bash
cd flowstarter-templates/mcp-server

# For testing without auth
echo "DISABLE_AUTH=true" > .env

# Build and start
npm run build
node build/index.js --mode=http
```

Expected output:
```
✓ Clerk authentication configured and required for all requests
✓ Loaded template: local-business-pro
✓ Loaded template: personal-brand-pro  
✓ Loaded template: saas-product-pro
✓ HTTP server running on http://0.0.0.0:3001
✓ MCP endpoint: http://0.0.0.0:3001/mcp
```

### 2. Configure Flowstarter (Terminal 2)

```bash
cd flowstarter

# Add to .env.local
echo "MCP_SERVER_URL=http://localhost:3001" >> .env.local

# Start dev server  
bun run dev
```

### 3. Test

1. Open http://localhost:3000
2. Log in (if authentication is enabled)
3. Navigate to templates page
4. Templates should load from MCP server

## Verify It's Working

### Check Health Endpoint
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "mcp-server",
  "version": "1.0.0",
  "transport": "streamable-http"
}
```

### Check Templates API
```bash
curl http://localhost:3000/api/local-templates
```

Should return templates from MCP server.

## Architecture

```
User Browser
    ↓
Flowstarter UI (localhost:3000)
    ↓
/api/local-templates (Next.js API Route)
    ↓
TemplatesServiceClient (MCP Client Wrapper)
    ↓
MCP SDK (Streamable HTTP)
    ↓
MCP Server (localhost:3001)
    ↓
Templates (filesystem)
```

## Key Features

✅ **Authentication**: Clerk session tokens passed from UI → API → MCP  
✅ **No Breaking Changes**: Existing UI code works as-is  
✅ **Type Safety**: Full TypeScript support  
✅ **MCP Protocol**: Uses official SDK and Streamable HTTP transport  
✅ **Backward Compatible**: Service client maintains same interface  

## Troubleshooting

**Templates not loading?**
1. Check MCP server is running on port 3001
2. Check `MCP_SERVER_URL` in `.env.local`
3. Check browser console for errors
4. Check both server terminal outputs

**Port conflicts?**
- MCP server uses 3001 (was 3000)
- Flowstarter app uses 3000
- Update ports in respective `.env` files if needed

**Auth errors?**
- Use `DISABLE_AUTH=true` in MCP server `.env` for testing
- Ensure Clerk keys match in production

## Next Steps

- [ ] Test with real authentication (add Clerk keys)
- [ ] Test template selection and preview
- [ ] Deploy MCP server (see `DOCKER.md`)
- [ ] Set up production environment variables

## Documentation

- Full guide: `MCP-INTEGRATION.md`
- Docker deployment: `DOCKER.md`
- Sevalla deployment: `DEPLOY-SEVALLA.md`
