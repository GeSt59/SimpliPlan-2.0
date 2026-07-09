module.exports = {
  apps: [
    {
      name: "SimpliPlan",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/SimpliPlan",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
