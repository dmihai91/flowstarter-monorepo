# Runtime Environments

This project uses different runtimes for different purposes:

## 🐳 Docker (Production/MCP Server)

**Runtime:** Bun  
**Where:** `mcp-server/`  
**Purpose:** Running the MCP server in Docker

```dockerfile
FROM oven/bun:1-alpine
CMD ["bun", "run", "build/index.js", "--mode=http"]
```

### Commands:
```bash
# Build MCP server
cd mcp-server
bun install
bun run build

# Run in Docker
docker-compose build
docker-compose up -d
```

## 💻 Local Development Scripts

**Runtime:** Bun  
**Where:** `scripts/` directory  
**Purpose:** Thumbnail generation, template utilities

### Why Bun?
- Faster execution than Node.js
- Native TypeScript support
- Compatible with Playwright
- Consistent with MCP server

### Commands:
```bash
# Install dependencies
bun install

# Run scripts
bun run thumbnails:update
bun run thumbnails:generate
```

## ⚡ All Scripts Use Bun

All scripts now use Bun for maximum performance:

```bash
# Direct execution
bun run scripts/update-thumbnails.js

# Via package.json scripts
bun run thumbnails:update
```

Bun is fully compatible with CommonJS (`require()`) and provides 2-3x faster execution than Node.js.

## ⚙️ MCP Server Directory

The `mcp-server/` uses Bun exclusively:

```bash
cd mcp-server

# Install with Bun
bun install

# Build TypeScript  
bun run build

# Run locally
bun run build/index.js --mode=http

# Run tests
bun test
```

## 📊 Summary

| Component | Runtime | Why |
|-----------|---------|-----|
| MCP Server (Docker) | **Bun** | Fast, efficient for production |
| MCP Server (Local) | **Bun** | Consistency with Docker |
| Thumbnail Scripts | **Bun** | 2-3x faster, native TypeScript |
| Template Generator | **Bun** | Consistent tooling |

## 🚀 Recommended Setup

1. **Install Bun (Required):**
   - Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`
   - Restart terminal after installation

2. **For MCP Server Development:**
   - Use `bun` commands in `mcp-server/`

3. **For Script Development:**
   - Use `bun` commands in repository root
   - All scripts now use Bun

4. **For Production:**
   - Docker handles everything (uses Bun internally)
   - No additional runtime needed

## 🔧 Troubleshooting

### "bun: command not found" on Windows

If you want to use Bun locally on Windows:

```powershell
# Install via PowerShell
powershell -c "irm bun.sh/install.ps1 | iex"

# Or via npm
npm install -g bun

# Verify
bun --version
```

### Scripts running slow

Make sure you're using Bun, not Node:

```bash
# Fast (Bun)
bun run thumbnails:update

# Slower (Node - not recommended)
node scripts/update-thumbnails.js
```

### Docker not using Bun

Check Dockerfile base image:

```dockerfile
# Should be:
FROM oven/bun:1-alpine

# Not:
FROM node:20-alpine
```

## 📝 Completed Migrations

- [x] Migrated MCP server to Bun
- [x] Migrated thumbnail scripts to Bun  
- [x] All local development uses Bun
- [x] Docker production uses Bun
- [x] Documentation updated

**Result:** 100% Bun runtime across the entire project! ⚡
