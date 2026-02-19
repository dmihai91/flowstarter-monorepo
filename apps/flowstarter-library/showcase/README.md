# Templates Showcase

Interactive preview application for browsing and comparing all templates in the Flowstarter Library.

## Purpose

This is a **developer and stakeholder tool** that provides:
- **Live Template Previews**: View all templates with real data and interactions
- **Visual Comparison**: Compare designs, layouts, and features side-by-side
- **Device Testing**: Preview templates on desktop, tablet, and mobile viewports
- **Theme Switching**: Toggle between light and dark themes
- **Quality Assurance**: Verify templates work correctly before deployment

**Note**: This is NOT the Flowstarter platform itself - it's an internal tool for template development and review.

## Quick Start

1. **Build the showcase:**
   ```bash
   bun install
   bun run build
   ```

2. **Copy to MCP server:**
   ```bash
   xcopy dist\* ..\mcp-server\public\ /E /I /Y
   ```

3. **Build templates (one-time):**
   ```bash
   cd ../templates/local-business-pro
   bun install
   bun run build
   
   cd ../personal-brand-pro
   bun install
   bun run build
   
   cd ../saas-product-pro
   bun install
   bun run build
   ```

4. **Start the MCP server:**
   ```bash
   cd ../mcp-server
   bun start
   ```

5. **Open showcase:**
   Visit http://localhost:3001

## Features

- **Live Previews**: Click any template to see a live preview
- **Theme Switcher**: Change preview themes on the fly
- **Device Modes**: Preview on desktop, tablet, or mobile
- **Simple Interface**: Designed for internal use by Dorin

## Architecture

```
Templates Showcase (Port 5173)
        ↓ HTTP Requests
    MCP Server (Port 3100)
        ↓ Reads & Serves
    Template Files
```

The showcase is a React application that:
1. **Lists templates** via `/api/templates` endpoint
2. **Shows thumbnails** (pre-generated images)
3. **Displays live previews** by embedding built templates in iframes
4. **Communicates** with MCP server for template metadata

Templates are served from `/api/templates/:slug/live` endpoint with assets properly proxied.

## Relationship to Flowstarter Platform

| Component | Purpose | Users |
|-----------|---------|-------|
| **Flowstarter Platform** | AI-powered website builder for non-technical users | Business owners, entrepreneurs |
| **Templates Showcase** (this) | Template preview and comparison tool | Developers, designers, QA |
| **MCP Server** | API that provides templates to both | Backend service |

The showcase helps developers verify that templates work correctly before they're made available on the Flowstarter platform.
