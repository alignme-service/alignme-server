module.exports = {
  apps: [
    {
      name: 'nest-app',
      script: 'yarn',
      args: 'start:prod',
      instances: '1',
      exec_mode: 'cluster',
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
    },
  ],
};
