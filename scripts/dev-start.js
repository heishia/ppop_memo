import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true);
      req.destroy();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForVite(maxAttempts = 30) {
  const ports = [3000, 3001, 3002, 3003, 3004, 3005];
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const port of ports) {
      if (await checkPort(port)) {
        console.log(`Vite server found on port ${port}`);
        return port;
      }
    }
    console.log(`Waiting for Vite server... (attempt ${attempt + 1}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Vite server not found');
}

const port = await waitForVite();

console.log(`Starting Electron with VITE_PORT=${port}`);

spawn('electron', ['.'], {
  cwd: join(__dirname, '..'),
  env: { ...process.env, VITE_PORT: port.toString(), NODE_ENV: 'development' },
  stdio: 'inherit',
  shell: true,
});
