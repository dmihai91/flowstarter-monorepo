# Flowstarter Library

The official template library for [Flowstarter](https://flowstarter.app) - an AI-powered website builder for non-technical users.

This repository contains premium, production-ready website templates built with modern web technologies. Each template features sophisticated design, smooth animations, and is optimized for conversions.

## 🎯 Available Templates

### 1. Local Business Pro
**Perfect for:** Restaurants, cafes, salons, gyms, and service businesses

A premium template designed to help local businesses attract customers with a stunning, modern web presence. Features beautiful menu displays, testimonials, service showcases, and contact forms.

📂 [View Template](./local-business-pro)

### 2. Personal Brand Pro
**Perfect for:** Consultants, freelancers, coaches, and executives

Establish a strong professional online presence with this elegant personal branding template. Includes portfolio showcase, testimonials, service offerings, and professional contact forms.

📂 [View Template](./personal-brand-pro)

### 3. SaaS Product Pro
**Perfect for:** Software products, web applications, and digital services

A conversion-optimized template for SaaS businesses. Features comprehensive pricing tables, feature showcases, FAQ sections, and compelling call-to-action elements.

📂 [View Template](./saas-product-pro)

## ✨ Template Features

All templates include:

- 🎨 **Premium Design** - Sophisticated gradients and modern styling
- 📱 **Fully Responsive** - Perfect on all devices
- 🚀 **TanStack Start** - Modern full-stack React framework
- ✨ **Smooth Animations** - Professional transitions and effects
- 💼 **Professional Forms** - Beautiful contact and lead capture
- 📊 **SEO Optimized** - Built for search engine visibility
- 🎯 **Conversion Focused** - Designed to turn visitors into clients
- 🔧 **Easy Customization** - Simple template variable system
- 🌍 **i18n Support** - Multi-language ready

## 🛠️ Tech Stack

- **Framework**: TanStack Start
- **React**: 19
- **Styling**: Tailwind CSS with custom color palette
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Deployment**: Vercel ready

## 🚀 Quick Start

### Prerequisites

This project uses **Bun** as the package manager and runtime:

```bash
# Install Bun (if not already installed)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Development Server

The repository has **two separate development servers**:

1. **Showcase** - Visual preview interface for browsing templates (http://localhost:5173)
2. **MCP Server** - API server for Flowstarter platform integration (stdio mode)

**For Template Development (Most Common)**

```bash
# Install dependencies
bun install

# Start showcase dev server
bun run dev:showcase
# Opens at http://localhost:5173
```

**For Platform Integration Development**

```bash
# In another terminal: Start MCP server
bun run dev:mcp
# Runs in stdio mode (watch mode)
```

**Option 2: Run Individual Templates**

Each template can be developed independently:

```bash
# Navigate to a template
cd templates/local-business-pro
# or cd templates/personal-brand-pro
# or cd templates/saas-product-pro

# Install dependencies
bun install

# Start development server (must be in start/ directory)
cd start
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view your site.

### Docker Deployment

For production-like environment:

```bash
# Build and start all services
bun run docker:dev

# Or rebuild from scratch
bun run docker:dev:rebuild
```

Services will be available at:
- MCP Server: http://localhost:3001
- Showcase: http://localhost:3001 (static)

## 📝 Customization

### Content Management

Each template uses a centralized `content.md` file containing all text content:
- Navigation labels
- Hero sections
- Feature descriptions
- Testimonials
- FAQ items
- Contact information
- Footer text

Simply edit `content.md` to customize content without touching code files.

### Template Variables

All templates support automatic variable replacement:

- `{{PROJECT_NAME}}` - Your business/product name
- `{{PROJECT_DESCRIPTION}}` - Brief description
- `{{TARGET_USERS}}` - Your target audience
- `{{BUSINESS_GOALS}}` - Your business objectives
- `{{PROJECT_NAME_SLUG}}` - URL-friendly version
- `{{YEAR}}` - Current year

### Styling

- Colors defined in `app/globals.css`
- Easy gradient and color scheme modifications
- Fully responsive design

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradients (#5e72e4 → #825ee4)
- **Success**: Emerald tones (#2dce89)
- **Info**: Cyan accents (#11cdef)
- **Warning**: Orange highlights (#fb6340)

### Design Elements
- Premium cards with elevated shadows
- Glassmorphism effects
- Micro-interactions and hover states
- Professional typography
- Smooth scroll animations

## 📦 Deployment

Deploy to Vercel with one command:

```bash
vercel deploy
```

Or connect your Git repository for automatic deployments on push.

## 🔌 MCP Server

This repository includes a **Model Context Protocol (MCP) server** that exposes templates programmatically to the Flowstarter platform and editor.

### What is the MCP Server?

The MCP server acts as a bridge between your application and the template repository, providing:
- **Template Discovery**: List all available templates with metadata
- **Template Scaffolding**: Get complete file structure and contents for project creation
- **Search & Filter**: Find templates by keywords or use case
- **Clerk Authentication**: Optional user authentication for secure access

### How It Works

```
Platform/Editor
      ↓
 [MCP Client]
      ↓
  MCP Server ←→ Clerk Auth (optional)
      ↓
 [Scans & Indexes]
      ↓
Template Files
```

**Startup Process**:
1. Scans all template directories (`local-business-pro`, `personal-brand-pro`, `saas-product-pro`)
2. Extracts metadata from README.md, config.json, content.md, package.json
3. Builds complete file tree for each template (excludes node_modules, .git)
4. Caches metadata in memory for fast access
5. Validates Clerk authentication if configured

**Request Flow**:
1. Client sends tool call (e.g., `list_templates`, `scaffold_template`)
2. Server verifies Clerk session token (if auth enabled)
3. Retrieves data from cache or reads files on-demand
4. Returns structured JSON response

### Available Tools

- **`list_templates`**: Get all templates with metadata (name, description, file count, LOC)
- **`get_template_details`**: Get comprehensive details for a specific template
- **`scaffold_template`**: Get complete file tree + contents for editor scaffolding
- **`search_templates`**: Search templates by keywords or category

### Quick Start

```bash
cd mcp-server
bun install
bun run build

# Optional: Configure Clerk authentication
cp .env.example .env
# Add CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY

bun start
```

### Usage Example

```typescript
// Platform lists templates
const { templates } = await mcpClient.callTool('list_templates', {
  _sessionToken: clerkSessionToken // if auth enabled
});

// Editor scaffolds a project
const { scaffold } = await mcpClient.callTool('scaffold_template', {
  slug: 'local-business-pro',
  _sessionToken: clerkSessionToken
});

// scaffold.files contains all template files with content
scaffold.files.forEach(file => {
  fs.writeFileSync(file.path, file.content);
});
```

### Authentication

The server **requires Clerk authentication** for all requests:

- ⚠️ Server will not start without Clerk API keys configured
- All tool calls require a valid Clerk session token
- Returns **401 Unauthorized** if token is missing or invalid
- Returns **403 Forbidden** if user doesn't have permissions

Get Clerk API keys from [clerk.com](https://clerk.com) and configure in `.env`.

📖 **Full Documentation**: [mcp-server/README.md](./mcp-server/README.md)

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│               👥 Non-Technical Users                      │
│         (Business Owners, Entrepreneurs, etc.)            │
└────────────────────────────┬────────────────────────────────┘
                           │
                           ↓ Natural Language
                           │ ("I need a restaurant website")
┌────────────────────────────────────────────────────────────┐
│          🤖 Flowstarter Platform (AI-Powered)              │
│    - Understands user requirements via AI chat           │
│    - Suggests appropriate templates                      │
│    - Customizes content automatically                    │
│    - Generates complete website (no coding needed)       │
└────────────────────────────┬────────────────────────────────┘
                           │
                           ↓ MCP Protocol
┌────────────────────────────────────────────────────────────┐
│        🔌 MCP Server (Template API - Port 3100)          │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │List Templates│  │Get Details   │  │Scaffold Project│  │
│  └──────────────┘  └───────────────┘  └────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                           │
                           ↓ Reads & Indexes
┌────────────────────────────────────────────────────────────┐
│          🎨 Website Templates (This Repo)               │
│  ┌────────────────┐ ┌──────────────┐ ┌─────────────────┐  │
│  │Local Business  │ │Personal Brand│ │SaaS Product Pro│  │
│  │      Pro       │ │     Pro       │ │                 │  │
│  └────────────────┘ └──────────────┘ └─────────────────┘  │
└────────────────────────────────────────────────────────────┘
                           │
                           ↓ Builds & Displays
┌────────────────────────────────────────────────────────────┐
│       👁️  Template Showcase (Port 5173)                 │
│        Live preview & comparison interface               │
└────────────────────────────────────────────────────────────┘
```

### How It Works

1. **User Interaction**: Non-technical users describe their needs to Flowstarter using natural language
2. **AI Processing**: Flowstarter's AI understands requirements and selects the best template
3. **Template Discovery**: MCP Server provides available templates and their metadata
4. **Customization**: AI automatically customizes content, colors, and structure based on user input
5. **Deployment**: Complete, production-ready website is generated and deployed

**No coding knowledge required** - Users simply describe what they want, and Flowstarter handles the rest.

## 📁 Repository Structure

```
flowstarter-library/
├── templates/                    # Production-ready templates
│   ├── local-business-pro/       # For restaurants, cafes, services
│   │   ├── start/                # TanStack Start app
│   │   │   ├── src/routes/       # Page routes
│   │   │   ├── src/components/   # UI components
│   │   │   └── src/styles/       # Global styles
│   │   ├── public/               # Images, fonts, etc.
│   │   ├── config.json           # Template metadata
│   │   ├── content.md            # Customizable content
│   │   └── package.json          # Dependencies
│   ├── personal-brand-pro/       # For professionals, consultants
│   └── saas-product-pro/         # For software products
│
├── mcp-server/       # MCP API server
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── http-server.ts        # HTTP transport
│   │   ├── tools/                # MCP tools (list, scaffold, etc.)
│   │   └── types/                # TypeScript definitions
│   └── README.md                 # Server documentation
│
├── templates-showcase/           # Preview interface
│   └── src/                      # React app for live demos
│
├── scripts/                      # Build automation
│   ├── build-all-templates.js    # Build all templates
│   └── generate-template-thumbnails.js # Create preview images
│
├── docs/                         # Documentation
└── Dockerfile                    # Container setup
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

These templates are provided for use with [Flowstarter](https://flowstarter.app).

## 🆘 Support

For questions and support, visit [Flowstarter](https://flowstarter.app)

---

Built with ❤️ using [Flowstarter](https://flowstarter.app)
