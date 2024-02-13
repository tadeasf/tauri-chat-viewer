module.exports = {
    apps : [{
      name: "messenger-serve",
      script: "npm",
      args: "run caddyServe",
      watch: true,
      env: {
        NODE_ENV: "production",
      },
    }]
  };