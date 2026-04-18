const path = require('path');

const ROOT = __dirname;
const LOG_DIR = path.join(process.env.HOME || '', '.pm2', 'logs');

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
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
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
      name: 'flowstarter-code',
      cwd: path.join(ROOT, 'apps/flowstarter-code'),
      script: 'node_modules/.bin/next',
      args: 'dev -p 3001',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      max_memory_restart: '1G',
      ...commonRestart,
      out_file: path.join(LOG_DIR, 'flowstarter-code-out.log'),
      error_file: path.join(LOG_DIR, 'flowstarter-code-error.log'),
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
