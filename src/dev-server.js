/**
 * Nexus DevHub - Unified Development Environment Manager
 * Manages all services for multiple Nexus Systems projects
 *
 * Projects:
 * - NexusTravel: Travel Package Distribution Platform
 * - NexusCount: Accounting System
 *
 * Start with: node src/dev-server.js
 * Dashboard: http://localhost:8080
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const http = require('http');

const app = express();
const PORT = 8080;

// Project Configurations
const PROJECTS = {
    nexustravel: {
        name: 'NexusTravel',
        description: 'Travel Package Distribution Platform',
        projectRoot: 'C:\\Nexus Systems\\NexusTravel',
        services: {
            backend: {
                name: '.NET Backend API',
                port: 5084,
                path: '.',
                cmd: 'dotnet',
                args: ['run', '--project', 'src/NexusTravel.API/NexusTravel.API.csproj'],
                url: 'http://localhost:5084',
                swagger: 'http://localhost:5084/swagger',
                description: 'REST API (Powers both admin & public site)'
            },
            adminPortal: {
                name: 'Admin Portal',
                port: 3000,
                path: 'web\\admin-portal',
                cmd: 'npm',
                args: ['run', 'dev'],
                url: 'http://localhost:3000',
                description: 'Manage packages, tenants, inquiries (Admin only)'
            },
            publicWebsite: {
                name: 'Public Website',
                port: 3001,
                path: 'web\\public-website',
                cmd: 'npm',
                args: ['run', 'dev'],
                url: 'http://localhost:3001',
                description: 'Customer-facing travel booking site'
            },
            tenantDashboard: {
                name: 'Tenant Dashboard',
                port: 3002,
                path: 'web\\tenant-dashboard',
                cmd: 'npm',
                args: ['run', 'dev'],
                url: 'http://localhost:3002',
                description: 'Agent/Tenant dashboard (Optional)',
                optional: true
            }
        }
    },
    nexuscount: {
        name: 'NexusCount',
        description: 'Accounting System',
        projectRoot: 'C:\\Nexus Systems\\NexusCount',
        services: {
            // Will be configured when NexusCount project is set up
        }
    }
};

// Current active project
let activeProject = 'nexustravel';
let CONFIG = PROJECTS[activeProject];

// Store running processes
const processes = {};
const logs = {};

// Initialize logs
function initializeLogs() {
    Object.keys(CONFIG.services).forEach(key => {
        logs[key] = [];
    });
}

initializeLogs();

// Utility: Check service health
function checkServiceHealth(service) {
    return new Promise((resolve) => {
        const config = CONFIG.services[service];
        if (!config) {
            resolve(false);
            return;
        }

        const healthUrl = service === 'backend'
            ? `http://localhost:${config.port}/health`
            : `http://localhost:${config.port}`;

        const timeout = setTimeout(() => {
            resolve(false);
        }, 2000);

        const req = http.get(healthUrl, { timeout: 2000 }, (res) => {
            clearTimeout(timeout);
            resolve(res.statusCode < 500);
        });

        req.on('error', () => {
            clearTimeout(timeout);
            resolve(false);
        });

        req.on('timeout', () => {
            clearTimeout(timeout);
            req.destroy();
            resolve(false);
        });
    });
}

// Utility: Wait for service health
async function waitForServiceHealth(service, maxWaitMs = 30000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
        if (await checkServiceHealth(service)) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
}

// Utility: Add log entry
function addLog(service, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;

    if (logs[service]) {
        logs[service].push({ message: logEntry, type });
        // Keep last 150 logs
        if (logs[service].length > 150) {
            logs[service].shift();
        }
    }

    console.log(`[${service}] ${message}`);
}

// Utility: Open application
async function openApp(url) {
    try {
        const { default: open } = await import('open');
        await open(url);
    } catch (err) {
        console.error('Failed to open:', err);
    }
}

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes

// Get dashboard
app.get('/', (req, res) => {
    const dashboardPath = path.join(__dirname, 'dev-dashboard.html');
    if (fs.existsSync(dashboardPath)) {
        res.sendFile(dashboardPath);
    } else {
        res.status(404).send('Dashboard not found');
    }
});

// Get projects list
app.get('/api/projects', (req, res) => {
    const projects = {};
    Object.keys(PROJECTS).forEach(key => {
        projects[key] = {
            name: PROJECTS[key].name,
            description: PROJECTS[key].description
        };
    });
    res.json({ projects, activeProject });
});

// Set active project
app.post('/api/projects/:project', (req, res) => {
    const project = req.params.project;
    if (PROJECTS[project]) {
        activeProject = project;
        CONFIG = PROJECTS[project];
        initializeLogs();
        addLog('system', `📁 Switched to project: ${CONFIG.name}`, 'warning');
        res.json({ success: true, message: `Switched to ${CONFIG.name}` });
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});

// Get configuration
app.get('/api/config', (req, res) => {
    const config = {
        project: CONFIG.name,
        description: CONFIG.description,
        services: {}
    };
    Object.keys(CONFIG.services).forEach(key => {
        config.services[key] = {
            name: CONFIG.services[key].name,
            port: CONFIG.services[key].port,
            url: CONFIG.services[key].url,
            description: CONFIG.services[key].description,
            optional: CONFIG.services[key].optional || false
        };
    });
    res.json(config);
});

// Get service status
app.get('/api/services', async (req, res) => {
    const status = {};
    const services = Object.keys(CONFIG.services);

    for (const key of services) {
        const isRunning = processes[key] && !processes[key].killed;
        let isHealthy = false;

        if (isRunning) {
            isHealthy = await checkServiceHealth(key);
        }

        status[key] = {
            name: CONFIG.services[key].name,
            running: isRunning,
            healthy: isHealthy,
            port: CONFIG.services[key].port,
            url: CONFIG.services[key].url,
            swagger: CONFIG.services[key].swagger,
            logs: logs[key] || []
        };
    }
    res.json(status);
});

// Get logs for service
app.get('/api/logs/:service', (req, res) => {
    const service = req.params.service;
    res.json({ logs: logs[service] || [] });
});

// Build service
app.post('/api/build/:service', async (req, res) => {
    const service = req.params.service;
    const config = CONFIG.services[service];

    if (!config) {
        return res.status(404).json({ error: 'Service not found' });
    }

    addLog(service, `[BUILD] Building ${config.name}...`, 'warning');

    try {
        let buildCmd, buildArgs;

        if (service === 'backend') {
            buildCmd = 'dotnet';
            buildArgs = ['build', 'src/NexusTravel.API/NexusTravel.API.csproj'];
        } else {
            buildCmd = 'npm';
            buildArgs = ['run', 'build'];
        }

        const buildProcess = spawn(buildCmd, buildArgs, {
            cwd: path.join(CONFIG.projectRoot, config.path),
            shell: true,
            stdio: 'pipe'
        });

        let output = '';
        buildProcess.stdout.on('data', (data) => {
            output += data.toString();
            addLog(service, data.toString().trim());
        });

        buildProcess.stderr.on('data', (data) => {
            output += data.toString();
            addLog(service, data.toString().trim(), 'error');
        });

        buildProcess.on('close', (code) => {
            if (code === 0) {
                addLog(service, `[OK] ${config.name} built successfully`, 'success');
                res.json({ success: true, message: `${config.name} built successfully` });
            } else {
                addLog(service, `[ERROR] Build failed (exit code: ${code})`, 'error');
                res.status(500).json({ error: 'Build failed', code });
            }
        });

        buildProcess.on('error', (error) => {
            addLog(service, `[ERROR] ${error.message}`, 'error');
            res.status(500).json({ error: error.message });
        });
    } catch (error) {
        addLog(service, `[ERROR] ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Parse testing checklist from markdown
function parseTestingChecklist(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return { error: 'Checklist file not found', modules: [] };
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const modules = [];
        let currentModule = null;
        let currentTest = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Parse module header: ## 1️⃣ AUTHENTICATION & LOGIN (10 Tests)
            if (line.match(/^## [0-9️⃣]/)) {
                if (currentModule) {
                    modules.push(currentModule);
                }
                const match = line.match(/^## (.+?)(?:\s*\((\d+)\s+Tests?\))?$/);
                if (match) {
                    currentModule = {
                        title: match[1].trim(),
                        testCount: parseInt(match[2]) || 0,
                        tests: []
                    };
                    currentTest = null;
                }
            }
            // Parse test header: ### 1.1 SuperAdmin Login
            else if (line.match(/^### [0-9]\.[0-9]/)) {
                if (currentTest && currentModule) {
                    currentModule.tests.push(currentTest);
                }
                const match = line.match(/^### (.+)$/);
                if (match && currentModule) {
                    const title = match[1].trim();
                    const [number, name] = title.split(' ').slice(0, 2).join(' ').split(' ');
                    currentTest = {
                        id: title.split(' ')[0],
                        title: title,
                        steps: [],
                        completed: false,
                        notes: ''
                    };
                }
            }
            // Parse test steps: - [ ] **Test:** or - [ ] text
            else if (line.match(/^- \[/) && currentTest) {
                const step = line.replace(/^- \[ \] /, '').replace(/^- \[x\] /, '').trim();
                if (step) {
                    currentTest.steps.push(step);
                }
            }
        }

        // Add last test and module
        if (currentTest && currentModule) {
            currentModule.tests.push(currentTest);
        }
        if (currentModule) {
            modules.push(currentModule);
        }

        return { modules, lastUpdated: new Date().toISOString() };
    } catch (error) {
        addLog('system', `[ERROR] Failed to parse checklist: ${error.message}`, 'error');
        return { error: error.message, modules: [] };
    }
}

// Scan documentation folder structure
function scanDocsFolder(folderPath, relativePath = '') {
    try {
        if (!fs.existsSync(folderPath)) {
            return { error: 'Docs folder not found', items: [] };
        }

        const items = [];
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });

        entries
            .filter(entry => !entry.name.startsWith('.'))
            .sort((a, b) => {
                // Folders first, then files, alphabetically
                if (a.isDirectory() !== b.isDirectory()) {
                    return a.isDirectory() ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            })
            .forEach(entry => {
                const fullPath = path.join(folderPath, entry.name);
                const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

                if (entry.isDirectory()) {
                    const subItems = scanDocsFolder(fullPath, relPath);
                    if (subItems.items && subItems.items.length > 0) {
                        items.push({
                            type: 'folder',
                            name: entry.name,
                            path: relPath,
                            items: subItems.items
                        });
                    }
                } else if (entry.name.endsWith('.md')) {
                    items.push({
                        type: 'file',
                        name: entry.name,
                        path: relPath,
                        fullPath: fullPath
                    });
                }
            });

        return { items };
    } catch (error) {
        addLog('system', `[ERROR] Failed to scan docs folder: ${error.message}`, 'error');
        return { error: error.message, items: [] };
    }
}

// API endpoint: Get testing checklist
app.get('/api/testing-checklist', (req, res) => {
    const checklistPath = path.join(
        CONFIG.projectRoot,
        'docs/testing/TESTING_CHECKLIST_WITH_CREDENTIALS.md'
    );
    const checklist = parseTestingChecklist(checklistPath);
    res.json(checklist);
});

// API endpoint: Browse documentation folder
app.get('/api/docs/browse', (req, res) => {
    const docsPath = path.join(CONFIG.projectRoot, 'docs');
    const structure = scanDocsFolder(docsPath);
    res.json(structure);
});

// API endpoint: Get specific documentation file
app.get('/api/docs/file', (req, res) => {
    const filePath = req.query.path;

    if (!filePath) {
        return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Prevent path traversal attacks
    if (filePath.includes('..')) {
        return res.status(400).json({ error: 'Invalid path' });
    }

    const fullPath = path.join(CONFIG.projectRoot, 'docs', filePath);

    // Verify the file is within docs folder
    const docsPath = path.join(CONFIG.projectRoot, 'docs');
    if (!fullPath.startsWith(docsPath)) {
        return res.status(400).json({ error: 'Invalid path' });
    }

    try {
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        res.json({
            name: path.basename(fullPath),
            path: filePath,
            content: content,
            size: content.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start service
app.post('/api/start/:service', async (req, res) => {
    const service = req.params.service;
    const config = CONFIG.services[service];

    if (!config) {
        return res.status(404).json({ error: 'Service not found' });
    }

    if (processes[service] && !processes[service].killed) {
        return res.json({
            message: `${config.name} already running on port ${config.port}`,
            url: config.url
        });
    }

    addLog(service, `[START] Starting ${config.name} on port ${config.port}...`, 'warning');

    try {
        const proc = spawn(config.cmd, config.args, {
            cwd: path.join(CONFIG.projectRoot, config.path),
            shell: true,
            detached: false
        });

        processes[service] = proc;

        proc.stdout.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) addLog(service, msg);
        });

        proc.stderr.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) addLog(service, msg, 'error');
        });

        proc.on('error', (error) => {
            addLog(service, `[ERROR] ${error.message}`, 'error');
        });

        proc.on('close', (code) => {
            processes[service] = null;
            addLog(service, `[STOP] ${config.name} stopped (exit code: ${code})`, 'warning');
        });

        setTimeout(() => {
            addLog(service, `[OK] ${config.name} running on port ${config.port}`, 'success');
            if (config.swagger) {
                addLog(service, `[INFO] Swagger Docs: ${config.swagger}`);
            }
            addLog(service, `[INFO] URL: ${config.url}`);
        }, 2000);

        res.json({ success: true, message: `${config.name} starting...`, url: config.url });
    } catch (error) {
        addLog(service, `[ERROR] ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Stop service
app.post('/api/stop/:service', (req, res) => {
    const service = req.params.service;
    const config = CONFIG.services[service];

    if (!config) {
        return res.status(404).json({ error: 'Service not found' });
    }

    const proc = processes[service];
    if (!proc) {
        return res.json({ message: `${config.name} is not running` });
    }

    addLog(service, `[STOP] Stopping ${config.name}...`, 'warning');

    try {
        proc.kill('SIGTERM');

        setTimeout(() => {
            if (proc && !proc.killed) {
                proc.kill('SIGKILL');
            }
        }, 5000);

        processes[service] = null;

        setTimeout(() => {
            addLog(service, `[OK] ${config.name} stopped`, 'success');
        }, 500);

        res.json({ success: true, message: `${config.name} stopped` });
    } catch (error) {
        addLog(service, `[ERROR] ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Start all services (with ordered startup: backend first)
app.post('/api/start-all', async (req, res) => {
    addLog('system', '[START] Starting ALL services (ordered)...', 'warning');

    try {
        // 1. Start backend first
        if (CONFIG.services.backend && !CONFIG.services.backend.optional) {
            addLog('system', '[WAIT] Starting backend first...', 'warning');
            await new Promise(resolve => {
                fetch(`http://localhost:${PORT}/api/start/backend`, { method: 'POST' })
                    .catch(err => console.error('Failed to start backend', err));
                setTimeout(resolve, 1000);
            });

            // 2. Wait for backend health (max 30s)
            addLog('system', '[WAIT] Waiting for backend health check...', 'warning');
            const backendHealthy = await waitForServiceHealth('backend', 30000);

            if (backendHealthy) {
                addLog('system', '[OK] Backend is healthy', 'success');
            } else {
                addLog('system', '[WARN] Backend health check failed, continuing anyway', 'warning');
            }
        }

        // 3. Start frontend services in parallel
        const frontends = Object.keys(CONFIG.services).filter(
            service => service !== 'backend' && !CONFIG.services[service].optional
        );

        addLog('system', '[START] Starting frontend services...', 'warning');
        await Promise.all(
            frontends.map(service =>
                new Promise(resolve => {
                    fetch(`http://localhost:${PORT}/api/start/${service}`, { method: 'POST' })
                        .catch(err => console.error('Failed to start', service, err));
                    setTimeout(resolve, 500);
                })
            )
        );

        addLog('system', '[OK] All services started', 'success');
        res.json({ success: true, message: 'All services started (backend first, then frontends)' });
    } catch (error) {
        addLog('system', `[ERROR] Start-all failed: ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Stop all services
app.post('/api/stop-all', (req, res) => {
    addLog('system', '[STOP] Stopping ALL services...', 'warning');

    let stoppedCount = 0;
    let totalServices = 0;

    Object.keys(CONFIG.services).forEach(service => {
        totalServices++;
        const proc = processes[service];

        if (proc && !proc.killed) {
            try {
                proc.kill('SIGTERM');
                addLog('system', `[STOP] Stopping ${CONFIG.services[service].name}...`, 'warning');
                stoppedCount++;

                // Force kill after 5 seconds if still running
                setTimeout(() => {
                    if (proc && !proc.killed) {
                        proc.kill('SIGKILL');
                        addLog('system', `[FORCE] Force stopped ${CONFIG.services[service].name}`, 'warning');
                    }
                }, 5000);
            } catch (error) {
                addLog('system', `[ERROR] Stopping ${service}: ${error.message}`, 'error');
            }
        }

        processes[service] = null;
    });

    setTimeout(() => {
        addLog('system', `[OK] All services stopped (${stoppedCount}/${totalServices})`, 'success');
    }, 1500);

    res.json({
        success: true,
        message: `All services stopped (${stoppedCount}/${totalServices})`,
        stopped: stoppedCount,
        total: totalServices
    });
});

// Open URL
app.post('/api/open/:service', async (req, res) => {
    const service = req.params.service;
    const config = CONFIG.services[service];

    if (!config) {
        return res.status(404).json({ error: 'Service not found' });
    }

    addLog('system', `[OPEN] Opening ${config.url}...`);
    await openApp(config.url);
    res.json({ success: true });
});

// Save test report
app.post('/api/save-test-report', (req, res) => {
    try {
        const { report, timestamp } = req.body;

        if (!report) {
            return res.status(400).json({ error: 'Report content is required' });
        }

        const testReportsDir = path.join(CONFIG.projectRoot, 'test-reports');

        // Create directory if it doesn't exist
        if (!fs.existsSync(testReportsDir)) {
            fs.mkdirSync(testReportsDir, { recursive: true });
        }

        // Generate filename with timestamp
        const date = new Date(timestamp);
        const dateStr = date.toISOString().replace(/[:.]/g, '-').split('T')[0];
        const timeStr = date.toISOString().split('T')[1].replace(/[:.]/g, '-').substring(0, 6);
        const filename = `test-report-${dateStr}-${timeStr}.md`;
        const filepath = path.join(testReportsDir, filename);

        // Write report to file
        fs.writeFileSync(filepath, report, 'utf-8');

        addLog('testing', `[OK] Test report saved: ${filename}`, 'success');

        res.json({
            success: true,
            filename: filename,
            filepath: filepath,
            message: `Report saved to: ${testReportsDir}`
        });
    } catch (error) {
        addLog('testing', `[ERROR] ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Get project documentation
app.get('/api/docs/:doctype', (req, res) => {
    const doctype = req.params.doctype;
    const projectRoot = CONFIG.projectRoot;

    let filename;
    switch(doctype) {
        case 'openspec':
            filename = 'OPENSPEC.md';
            break;
        case 'testing':
            filename = 'TESTING-CHECKLIST.md';
            break;
        case 'architecture':
            filename = 'CLAUDE.md';
            break;
        case 'design':
            filename = 'DESIGN_SYSTEM.md';
            break;
        default:
            return res.status(400).json({ error: 'Unknown document type' });
    }

    const filePath = path.join(projectRoot, filename);

    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.json({ content, filename });
        } else {
            res.status(404).json({ error: `${filename} not found` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check (all services)
app.get('/api/health', async (req, res) => {
    const health = {};
    const services = Object.keys(CONFIG.services);

    for (const service of services) {
        const isRunning = processes[service] && !processes[service].killed;
        let isHealthy = false;

        if (isRunning) {
            isHealthy = await checkServiceHealth(service);
        }

        health[service] = {
            running: isRunning,
            healthy: isHealthy
        };
    }

    res.json(health);
});

// Health check (DevHub only)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════╗
    ║   [DevHub] Unified Service Management         ║
    ║   Created by Lito Juliano                     ║
    ╚═══════════════════════════════════════════════╝

    Dashboard:  http://localhost:${PORT}
    API:        http://localhost:${PORT}/api

    Project:    ${CONFIG.name}
    Location:   ${CONFIG.projectRoot}

    [Ctrl+C to stop]
    `);

    setTimeout(async () => {
        await openApp(`http://localhost:${PORT}`);
    }, 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n[SHUTDOWN] Stopping all services...\n');

    Object.keys(processes).forEach(service => {
        const proc = processes[service];
        if (proc && !proc.killed) {
            console.log(`   Stopping ${CONFIG.services[service].name}...`);
            proc.kill('SIGTERM');
        }
    });

    setTimeout(() => {
        console.log('\n[OK] All services stopped. Goodbye!\n');
        process.exit(0);
    }, 2000);
});
