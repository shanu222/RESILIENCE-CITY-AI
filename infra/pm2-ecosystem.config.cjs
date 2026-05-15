module.exports = {
  apps: [
    {
      name: "resilience-backend",
      cwd: "./server",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "500M",
      autorestart: true,
      watch: false,
    },
  ],
};
