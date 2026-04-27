/**
 * PM2 ecosystem for the feature/concierge-pivot worktree.
 *
 * Manages:
 *   - flowstarter-main    (Next.js production) -> 3000
 *   - flowstarter-library (Node preview)       -> 2000
 *   - t3-code-server      (Bun WebSocket)      -> 3774
 *   - t3-code-web         (Vite)               -> 5733
 *
 * t3-code-server + t3-code-web are tightly coupled to apps/t3-code and
 * the effect@beta.50 overrides that live on this branch.
 */

const path = require('path');

const ROOT = __dirname;
const LOG_DIR = path.join(process.env.HOME || '', '.pm2', 'logs');

// Shared auth seed. Must match the `T3CODE_AUTH_TOKEN` piped into T3 via its
// bootstrap envelope (scripts/dev-flowstarter-code-host.sh). Production should
// inject via pm2 ecosystem env_production or a .env shim at pm2 startup.
const T3CODE_AUTH_TOKEN = process.env.FLOWSTARTER_CODE_AUTH_TOKEN || '';

const commonRestart = {
  autorestart: true,
  watch: false,
  restart_delay: 3000,
  max_restarts: 10,
  min_uptime: '10s',
};

const commonLog = {
  log_date_format: 'YYYY-MM-DD HH:mm:ss',
  merge_logs: true,
};

module.exports = {
  apps: [
    {
      name: 'flowstarter-main',
      cwd: path.join(ROOT, 'apps/flowstarter-main'),
      script: '/Users/darius91/.nvm/versions/node/v25.8.0/bin/pnpm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '1G',
      ...commonRestart,
      out_file: path.join(LOG_DIR, 'flowstarter-main-out.log'),
      error_file: path.join(LOG_DIR, 'flowstarter-main-error.log'),
      ...commonLog,
    },
    {
      name: 'flowstarter-library',
      cwd: path.join(ROOT, 'apps/flowstarter-library'),
      script: 'preview-server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PREVIEW_PORT: '2000',
      },
      max_memory_restart: '512M',
      ...commonRestart,
      out_file: path.join(LOG_DIR, 'flowstarter-library-out.log'),
      error_file: path.join(LOG_DIR, 'flowstarter-library-error.log'),
      ...commonLog,
    },
    {
      name: 't3-code-server',
      cwd: ROOT,
      script: 'scripts/dev-flowstarter-code-host.sh',
      interpreter: 'bash',
      env: {
        FLOWSTARTER_CODE_PORT: '3774',
        FLOWSTARTER_CODE_AUTH_TOKEN: T3CODE_AUTH_TOKEN,
      },
      max_memory_restart: '2G',
      ...commonRestart,
      out_file: path.join(LOG_DIR, 't3-code-server-out.log'),
      error_file: path.join(LOG_DIR, 't3-code-server-error.log'),
      ...commonLog,
    },
    {
      name: 't3-code-web',
      cwd: ROOT,
      script: 'scripts/dev-flowstarter-code-web.sh',
      interpreter: 'bash',
      env: {
        FLOWSTARTER_CODE_PORT: '3774',
      },
      max_memory_restart: '2G',
      ...commonRestart,
      out_file: path.join(LOG_DIR, 't3-code-web-out.log'),
      error_file: path.join(LOG_DIR, 't3-code-web-error.log'),
      ...commonLog,
    },
  ],
};
