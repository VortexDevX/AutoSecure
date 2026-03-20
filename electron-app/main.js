const { app, BrowserWindow, protocol, net, session } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { pathToFileURL } = require('url');

let splashWindow;
let mainWindow;
let backendProcess;

const isPackaged = app.isPackaged;
const BACKEND_PORT = 5000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

const frontendDir = isPackaged
  ? path.join(process.resourcesPath, 'frontend', 'out')
  : path.join(__dirname, '..', 'frontend', 'out');

// ─── Dynamic Route Mapping ─────────────────────────────────
// Next.js static export only generates HTML for the params in
// generateStaticParams (e.g. /policies/dummy.html). We map any
// dynamic [id] segment to the pre-rendered "dummy" fallback so
// that Next.js client-side router can boot and useParams() can
// pick up the real ID from the URL.
const DYNAMIC_ROUTES = [
  { pattern: /^\/policies\/([^/]+)\/edit(\/?)$/, fallback: '/policies/dummy/edit.html' },
  { pattern: /^\/policies\/([^/]+)(\/?)$/, fallback: '/policies/dummy.html' },
  { pattern: /^\/licenses\/([^/]+)\/edit(\/?)$/, fallback: '/licenses/dummy/edit.html' },
  { pattern: /^\/licenses\/([^/]+)(\/?)$/, fallback: '/licenses/dummy.html' },
];

function resolveFrontendPath(urlPath) {
  // Decode URI components
  const decoded = decodeURIComponent(urlPath);

  // Check dynamic route patterns first
  for (const route of DYNAMIC_ROUTES) {
    if (route.pattern.test(decoded)) {
      const fallbackFile = path.join(frontendDir, route.fallback);
      if (fs.existsSync(fallbackFile)) {
        return fallbackFile;
      }
    }
  }

  // Try exact file
  const exactFile = path.join(frontendDir, decoded);
  if (fs.existsSync(exactFile) && fs.statSync(exactFile).isFile()) {
    return exactFile;
  }

  // Try as directory with index.html
  const indexFile = path.join(frontendDir, decoded, 'index.html');
  if (fs.existsSync(indexFile)) {
    return indexFile;
  }

  // Try with .html extension
  const htmlFile = path.join(frontendDir, decoded + '.html');
  if (fs.existsSync(htmlFile)) {
    return htmlFile;
  }

  // Fallback to root index.html (SPA behavior)
  return path.join(frontendDir, 'index.html');
}

// ─── Custom Protocol ────────────────────────────────────────
// Register `app://` scheme BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      codeCache: true,
    },
  },
]);

// ─── Splash Screen ──────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 440,
    height: 520,
    frame: false,
    transparent: false,
    resizable: false,
    center: true,
    show: false,
    backgroundColor: '#f6f6f8',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashPath = path.join(__dirname, 'splash.html');
  splashWindow.loadFile(splashPath);
  splashWindow.once('ready-to-show', () => splashWindow.show());
}

function updateSplash(percent, text, activeStep, doneSteps) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    const title = `${percent}|${text}|${activeStep}|${doneSteps.join(',')}`;
    splashWindow.webContents
      .executeJavaScript(`document.title = ${JSON.stringify(title)};`)
      .catch(() => {});
  }
}

// ─── Backend ────────────────────────────────────────────────
function startBackend() {
  const backendServerPath = isPackaged
    ? path.join(process.resourcesPath, 'backend', 'dist', 'server.js')
    : path.join(__dirname, '..', 'backend', 'dist', 'server.js');

  const backendCwd = isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '..', 'backend');

  if (!fs.existsSync(backendServerPath)) {
    console.error(`Backend file not found: ${backendServerPath}`);
    updateSplash(0, 'Error: Backend not found!', '', []);
    return;
  }

  console.log(`Starting backend from: ${backendServerPath}`);

  if (isPackaged) {
    backendProcess = spawn(process.execPath, [backendServerPath], {
      cwd: backendCwd,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    });
  } else {
    backendProcess = spawn('node', [backendServerPath], {
      cwd: backendCwd,
      env: { ...process.env },
    });
  }

  backendProcess.stdout.on('data', (data) => console.log(`[Backend]: ${data.toString().trim()}`));
  backendProcess.stderr.on('data', (data) => console.error(`[Backend Error]: ${data.toString()}`));
  backendProcess.on('error', (err) => console.error(`[Backend Spawn Error]: ${err.message}`));
  backendProcess.on('exit', (code) => console.log(`Backend exited with code ${code}`));
}

// ─── Health Check Polling ───────────────────────────────────
function waitForBackend(maxRetries = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const poll = () => {
      attempts++;
      const req = http.get(`${BACKEND_URL}/api/v1`, (res) => resolve());
      req.on('error', () => {
        if (attempts >= maxRetries) reject(new Error('Backend did not start in time'));
        else setTimeout(poll, 500);
      });
      req.setTimeout(2000, () => {
        req.destroy();
        if (attempts >= maxRetries) reject(new Error('Backend timed out'));
        else setTimeout(poll, 500);
      });
    };
    poll();
  });
}

// ─── Main Window ────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Load via our custom app:// protocol
  mainWindow.loadURL('app://-');

  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
    }, 800);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Boot Sequence ──────────────────────────────────────────
async function boot() {
  updateSplash(10, 'Initializing application...', 'init', []);
  await delay(600);

  updateSplash(25, 'Starting backend server...', 'backend', ['init']);
  startBackend();
  await delay(500);

  updateSplash(40, 'Connecting to database...', 'db', ['init', 'backend']);
  try {
    await waitForBackend(60);
  } catch (err) {
    console.error('Backend failed to start:', err.message);
    updateSplash(40, 'Error: Backend connection failed', '', ['init']);
    return;
  }

  updateSplash(70, 'Backend ready!', 'db', ['init', 'backend']);
  await delay(300);

  updateSplash(85, 'Loading user interface...', 'frontend', ['init', 'backend', 'db']);
  createMainWindow();
  updateSplash(95, 'Almost there...', 'frontend', ['init', 'backend', 'db']);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── App Lifecycle ──────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Register the custom protocol handler
    session.defaultSession.protocol.handle('app', (request) => {
      const url = new URL(request.url);
      const urlPath = url.pathname;

      // Resolve the file path (with dynamic route fallback)
      const filePath = resolveFrontendPath(urlPath);

      // Security: ensure path stays within frontendDir
      const relative = path.relative(frontendDir, filePath);
      const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative);
      if (!isSafe) {
        return new Response(null, { status: 404, statusText: 'Not Found' });
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });

    createSplashWindow();
    setTimeout(() => boot(), 300);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createSplashWindow();
        setTimeout(() => boot(), 300);
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
