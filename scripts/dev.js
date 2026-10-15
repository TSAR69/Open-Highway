import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const rootDir = join(dirname(__filename), '..');

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════');
console.log('\x1b[36m%s\x1b[0m', '  Starting Open Highway (Local Development)');
console.log('\x1b[36m%s\x1b[0m', '  Backend:  http://localhost:3001');
console.log('\x1b[36m%s\x1b[0m', '  Frontend: http://localhost:5173');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════\n');

const isWindows = process.platform === 'win32';
const cmd = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npm';
const getArgs = (script) => (isWindows ? ['/c', 'npm', 'run', script] : ['run', script]);

const backend = spawn(cmd, getArgs('dev'), {
  cwd: join(rootDir, 'backend'),
  stdio: 'inherit',
});

const frontend = spawn(cmd, getArgs('dev'), {
  cwd: join(rootDir, 'frontend'),
  stdio: 'inherit',
});

function cleanup() {
  if (backend && backend.pid) {
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
      } else {
        backend.kill('SIGTERM');
      }
    } catch {}
  }
  if (frontend && frontend.pid) {
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
      } else {
        frontend.kill('SIGTERM');
      }
    } catch {}
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
