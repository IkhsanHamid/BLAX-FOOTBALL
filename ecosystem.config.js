module.exports = {
  apps: [
    {
      name: "blax-frontend",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/frontend",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
