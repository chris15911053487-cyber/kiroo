const { spawn } = require('child_process')
const path = require('path')

const root = __dirname

// 后端
const server = spawn('node', ['server.js'], {
  cwd: path.join(root, 'server'),
  stdio: 'inherit',
  shell: false,
})

// 前端
const vite = spawn('npx', ['vite', '--host', '0.0.0.0'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
})

function cleanup() {
  server.kill()
  vite.kill()
  process.exit()
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)
