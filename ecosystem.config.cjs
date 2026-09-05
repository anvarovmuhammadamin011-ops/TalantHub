module.exports = {
  apps: [
    {
      name: "talenthub-server",
      script: "server/index.cjs",
      cwd: __dirname,
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 50,
      restart_delay: 2000,
      min_uptime: "10s",
      max_memory_restart: "700M",
      kill_timeout: 5000,
      out_file: "logs/talenthub-out.log",
      error_file: "logs/talenthub-err.log",
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      shutdown_with_message: true,
    },
  ],
};