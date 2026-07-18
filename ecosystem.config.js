module.exports = {
  apps: [{
    name: "gosafe",
    script: "node_modules/.bin/next",
    args: "start",
    cwd: "/home/ubuntu/GoSafe-school-project-",
    kill_timeout: 8000,
    wait_ready: false,
    max_restarts: 5,
    min_uptime: "10s"
  }]
}
