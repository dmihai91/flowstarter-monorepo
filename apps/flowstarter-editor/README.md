<p align="center">
  <img
    width="200"
    height="200"
    alt="Flowstarter Logo"
    src="public/flowstarter-logo.svg"
  />
</p>

<h1 align="center">Flowstarter Editor</h1>

<p align="center">
  AI-powered code creation and editing platform by Flowstarter.
</p>

---

## Overview

Flowstarter Editor is an AI-powered full-stack development platform designed to help developers build modern Node.js applications with speed and precision. It combines intelligent code generation, project management, and deployment tools into a streamlined workflow.

The editor uses **OpenRouter** as a unified AI gateway, giving you access to all major AI models (Claude, GPT, DeepSeek, and more) through a single API key.

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/flowstarter/flowstarter-editor.git
cd flowstarter-editor
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

**Required:**
- `OPEN_ROUTER_API_KEY` - Get from [OpenRouter](https://openrouter.ai/settings/keys) - Primary model provider
- `ANTHROPIC_API_KEY` - Get from [Anthropic](https://console.anthropic.com/settings/keys) - For Claude Agent SDK
- `GROQ_API_KEY` - Get from [Groq](https://console.groq.com/keys) - For fast inference

### 4. Start Convex (Backend)

In a separate terminal, start the Convex development server:

```bash
pnpm convex:dev
```

### 5. Run the Development Server

```bash
pnpm dev
```

The application will be available at: http://localhost:5173

---

## Architecture

### Tech Stack

- **Frontend:** React 18 + Remix + Vite
- **Backend:** Convex (real-time database & serverless functions)
- **AI Integration:** OpenRouter (unified gateway to all AI providers)
- **Code Execution:** WebContainers (in-browser Node.js runtime)
- **Styling:** UnoCSS + Tailwind

### Key Components

```
app/
├── components/         # React components
│   ├── chat/          # Chat interface components
│   ├── editor/        # Code editor & orchestration
│   ├── workbench/     # File tree, preview, terminal
│   └── @settings/     # Settings panels
├── lib/
│   ├── modules/llm/   # LLM provider (OpenRouter)
│   ├── services/      # Agent & orchestrator services
│   ├── stores/        # Nanostores state management
│   └── hooks/         # React hooks
├── routes/            # Remix routes & API endpoints
└── types/             # TypeScript definitions

convex/                # Convex backend functions
├── schema.ts          # Database schema
├── conversations.ts   # Conversation management
├── messages.ts        # Message storage
├── projects.ts        # Project management
└── orchestrations.ts  # Agent orchestration state
```

---

## Core Capabilities

- **AI-Powered Code Generation:** Generate and edit code using state-of-the-art AI models through OpenRouter
- **Unified Model Access:** Access Claude, GPT, DeepSeek, and 100+ other models with a single API key
- **Real-time Collaboration:** Convex-powered backend for instant state synchronization
- **In-Browser Development:** Full Node.js runtime via WebContainers - no local setup required
- **Intelligent Orchestration:** Agent-based task execution and code modifications
- **Production-Ready Deployment:** Containerized workflow with Docker, Cloudflare Pages, Vercel, and Netlify
- **Git Integration:** Clone, commit, and push directly from the editor
- **MCP Support:** Extensible through Model Context Protocol servers

---

## Supported AI Models

Through OpenRouter, Flowstarter provides access to:

### Featured Models
- **Claude Opus 4.5 / Sonnet 4.5** - Anthropic's latest models
- **GPT-5.2 Pro / Thinking / Instant** - OpenAI's flagship models
- **DeepSeek-R1** - Advanced reasoning model

### All Providers via OpenRouter
OpenRouter aggregates 100+ models from Anthropic, OpenAI, Google, Meta, Mistral, Cohere, and more. Browse available models at [openrouter.ai/models](https://openrouter.ai/models).

---

## Deployment

### Run with Docker

```bash
# Development build
pnpm dockerbuild
docker compose --profile development up

# Production build
pnpm dockerbuild:prod
docker compose --profile production up
```

### Deploy to Cloudflare Pages

```bash
pnpm deploy
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm convex:dev` | Start Convex backend |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint codebase |
| `pnpm typecheck` | Type check TypeScript |

### Environment Variables

See [`.env.example`](.env.example) for all configuration options.

**Required:**
- `OPEN_ROUTER_API_KEY` - OpenRouter API key (primary model provider)
- `ANTHROPIC_API_KEY` - Anthropic API key (Claude Agent SDK)
- `GROQ_API_KEY` - Groq API key (fast inference)
- `VITE_CONVEX_URL` - Convex deployment URL

**Optional:**
- `VITE_GITHUB_ACCESS_TOKEN` - For GitHub integration
- `VITE_FLOWSTARTER_MCP_URL` - MCP server URL
- `VITE_LOG_LEVEL` - Logging verbosity

---

## License

See [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with care by the Flowstarter Team
</p>
