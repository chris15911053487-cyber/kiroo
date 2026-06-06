const { spawn, execSync } = require('child_process')
const path = require('path')

const root = __dirname

// 先构建前端
console.log('Building frontend...')
try {
  execSync('npm run build', { cwd: root, stdio: 'inherit', shell: false })
} catch (e) {
  console.error('Build failed, using existing dist if available')
}

// 启动后端（后端自动提供前端静态文件）
console.log('Starting server...')
const server = spawn('node', ['server.js'], {
  cwd: path.join(root, 'server'),
  stdio: 'inherit',
  shell: false,
})

function cleanup() {
  server.kill()
  process.exit()
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

console.log('\n✅ 打开浏览器访问: http://localhost:3000\n')
