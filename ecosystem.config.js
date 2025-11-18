module.exports = {
  apps: [
    {
      name: "blax-frontend",
      script: "npm",
      args: "start",
      cwd: "/var/www/frontend",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
