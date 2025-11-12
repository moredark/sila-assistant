module.exports = {
  apps: [
    {
      name: "sila-tg-bot",
      script: "dist/index.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
        HOST: "0.0.0.0",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      merge_logs: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      watch_options: {
        follow: false,
        ignore: ["node_modules", "logs", "data/*.db*"],
      },
    },
  ],
};
