module.exports = {
  apps: [
    {
      name: 'flowstarter-main',
      cwd: '/Users/darius91/flowstarter-monorepo/apps/flowstarter-main',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      // Restart policy
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      // Logging
      out_file: '/Users/darius91/.pm2/logs/flowstarter-main-out.log',
      error_file: '/Users/darius91/.pm2/logs/flowstarter-main-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
