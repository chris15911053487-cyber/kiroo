// 停止 3000 端口的进程
const { execSync } = require('child_process');

function tryShell(cmd, shell) {
  try {
    return execSync(cmd, { shell, encoding: 'utf8', stdio: 'pipe' });
  } catch { return ''; }
}

// 尝试多种方式找 PID
let pid = null;

// 方式1: cmd.exe
const r1 = tryShell('netstat -ano | findstr :3000', 'C:\\Windows\\System32\\cmd.exe');
if (r1) {
  const m = r1.match(/LISTENING\s+(\d+)/);
  if (m) pid = m[1];
}

// 方式2: 直接读 /proc 找
if (!pid) {
  try {
    const fs = require('fs');
    const dirs = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d));
    for (const d of dirs) {
      try {
        const cmdline = fs.readFileSync(`/proc/${d}/cmdline`, 'utf8');
        if (cmdline.includes('server.js') || (cmdline.includes('node') && cmdline.includes('3000'))) {
          pid = d;
          break;
        }
      } catch {}
    }
  } catch {}
}

// 找到就杀
if (pid) {
  console.log('Found PID:', pid);
  try {
    process.kill(parseInt(pid), 'SIGKILL');
    console.log('Killed. Port 3000 freed.');
  } catch (e) {
    console.log('Kill failed, try running: taskkill /F /PID', pid);
  }
} else {
  console.log('No node process found on port 3000 (port might already be free).');
}
