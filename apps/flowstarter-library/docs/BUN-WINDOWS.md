# Using Bun on Windows

Bun is now installed and configured on your system! 🎉

## ✅ Installation Complete

**Location:** `C:\Users\popes\.bun\bin\bun.exe`  
**Version:** 1.3.4  
**PATH:** Added permanently

## 🚀 Quick Start

### Verify Installation

```powershell
bun --version
# Output: 1.3.4
```

**Note:** You may need to restart your terminal if `bun` command is not found.

### Basic Commands

```powershell
# Install dependencies
bun install

# Run a script
bun run script.js

# Run a package.json script
bun run dev

# Run with watch mode
bun run --watch script.js

# Execute a file directly
bun script.ts  # TypeScript works out of the box!
```

## 📁 Using Bun in This Project

### MCP Server (mcp-server/)

```powershell
cd mcp-server

# Install dependencies
bun install

# Build TypeScript
bun run build

# Run locally
bun run build/index.js --mode=http

# Run tests
bun test
```

### Thumbnail Scripts (Repository Root)

While thumbnail scripts use Node.js (for Playwright compatibility), you can still use Bun:

```powershell
# This works but npm is recommended
bun run scripts/update-thumbnails.js

# Recommended (uses Node.js)
npm run thumbnails:update
```

## 🔄 Bun vs npm/pnpm

### When to use Bun:
- ✅ MCP server development (`mcp-server/`)
- ✅ Running TypeScript directly
- ✅ Fast dependency installation
- ✅ Production (Docker already uses Bun)

### When to use npm:
- ✅ Thumbnail generation scripts (Playwright compatibility)
- ✅ When you need specific npm features
- ✅ CI/CD pipelines (more standardized)

## 🎯 Common Tasks

### Update Bun

```powershell
bun upgrade
```

### Check Bun Info

```powershell
bun --help
```

### Install a Package

```powershell
# Install and add to dependencies
bun add package-name

# Install as dev dependency
bun add -d package-name

# Install globally
bun add -g package-name
```

### Run Scripts Faster

Bun is significantly faster than npm/pnpm:

```powershell
# ~3x faster install
bun install

# Compare to:
npm install
pnpm install
```

## 🐛 Troubleshooting

### "bun: command not found"

**Solution 1:** Restart your terminal

**Solution 2:** Manually add to PATH for current session:
```powershell
$env:Path = "C:\Users\popes\.bun\bin;$env:Path"
```

**Solution 3:** Verify PATH is set permanently:
```powershell
[Environment]::GetEnvironmentVariable("Path", "User")
# Should contain: C:\Users\popes\.bun\bin
```

### Reinstall Bun

```powershell
# Uninstall
Remove-Item -Recurse -Force C:\Users\popes\.bun

# Reinstall
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Check Bun Installation

```powershell
Get-Command bun
# Should show: C:\Users\popes\.bun\bin\bun.exe
```

## 📚 Learning Resources

- **Official Docs:** https://bun.sh/docs
- **GitHub:** https://github.com/oven-sh/bun
- **Discord:** https://bun.sh/discord

## 🎓 Key Features

### 1. TypeScript Native
```powershell
# No compilation needed!
bun run app.ts
```

### 2. Built-in Test Runner
```powershell
# Create test.ts
bun test
```

### 3. Package Management
```powershell
# Works with package.json
bun install

# Creates bun.lockb (faster than package-lock.json)
```

### 4. Development Server
```powershell
# Hot reload built-in
bun --watch run server.ts
```

## 🚀 Next Steps

1. **Try it in MCP server:**
   ```powershell
   cd mcp-server
   bun run build
   bun run build/index.js --mode=http
   ```

2. **Compare speeds:**
   ```powershell
   # Time npm install
   Measure-Command { npm install }
   
   # Time bun install
   Measure-Command { bun install }
   # Usually 2-3x faster!
   ```

3. **Explore Bun APIs:**
   - Fast file I/O
   - Built-in SQLite
   - Native fetch
   - WebSocket support

## 💡 Pro Tips

1. **Use `bunx` instead of `npx`:**
   ```powershell
   bunx playwright install  # Faster than npx
   ```

2. **Bun works with existing npm projects:**
   - Just run `bun install` in any npm project
   - package.json compatibility

3. **Environment variables:**
   ```powershell
   # Bun automatically loads .env files
   bun run script.ts  # No need for dotenv package
   ```

4. **Check what's using Bun:**
   ```powershell
   # Docker containers
   docker ps | Select-String "bun"
   ```

Enjoy the speed! ⚡
