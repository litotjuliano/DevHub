/**
 * Nexus DevHub - Unified Development Environment Manager
 * Manages all services for multiple Nexus Systems projects
 *
 * Projects:
 * - NexusTravel: Travel Package Distribution Platform
 * - NexusCount: Accounting System
 *
 * Start with: node dev-server.js
 * Dashboard: http://localhost:8080
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

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
app.get('/api/services', (req, res) => {
    const status = {};
    Object.keys(CONFIG.services).forEach(key => {
        status[key] = {
            name: CONFIG.services[key].name,
            running: processes[key] && !processes[key].killed,
            port: CONFIG.services[key].port,
            url: CONFIG.services[key].url,
            swagger: CONFIG.services[key].swagger,
            logs: logs[key] || []
        };
    });
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

    addLog(service, `🔨 Building ${config.name}...`, 'warning');

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
                addLog(service, `✅ ${config.name} built successfully`, 'success');
                res.json({ success: true, message: `${config.name} built successfully` });
            } else {
                addLog(service, `❌ Build failed (exit code: ${code})`, 'error');
                res.status(500).json({ error: 'Build failed', code });
            }
        });

        buildProcess.on('error', (error) => {
            addLog(service, `❌ Error: ${error.message}`, 'error');
            res.status(500).json({ error: error.message });
        });
    } catch (error) {
        addLog(service, `❌ Error: ${error.message}`, 'error');
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

    addLog(service, `▶️ Starting ${config.name} on port ${config.port}...`, 'warning');

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
            addLog(service, `❌ Error: ${error.message}`, 'error');
        });

        proc.on('close', (code) => {
            processes[service] = null;
            addLog(service, `⏹️ ${config.name} stopped (exit code: ${code})`, 'warning');
        });

        setTimeout(() => {
            addLog(service, `✅ ${config.name} running on port ${config.port}`, 'success');
            if (config.swagger) {
                addLog(service, `📘 Swagger Docs: ${config.swagger}`);
            }
            addLog(service, `🌐 URL: ${config.url}`);
        }, 2000);

        res.json({ success: true, message: `${config.name} starting...`, url: config.url });
    } catch (error) {
        addLog(service, `❌ Error: ${error.message}`, 'error');
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

    addLog(service, `⏹️ Stopping ${config.name}...`, 'warning');

    try {
        proc.kill('SIGTERM');

        setTimeout(() => {
            if (proc && !proc.killed) {
                proc.kill('SIGKILL');
            }
        }, 5000);

        processes[service] = null;

        setTimeout(() => {
            addLog(service, `✅ ${config.name} stopped`, 'success');
        }, 500);

        res.json({ success: true, message: `${config.name} stopped` });
    } catch (error) {
        addLog(service, `❌ Error stopping: ${error.message}`, 'error');
        res.status(500).json({ error: error.message });
    }
});

// Start all services
app.post('/api/start-all', (req, res) => {
    addLog('system', '🚀 Starting ALL services...', 'warning');

    Object.keys(CONFIG.services).forEach((service, index) => {
        if (!CONFIG.services[service].optional) {
            setTimeout(() => {
                fetch(`http://localhost:${PORT}/api/start/${service}`, { method: 'POST' })
                    .catch(err => console.error('Failed to start', service, err));
            }, index * 1000);
        }
    });

    res.json({ success: true, message: 'Starting all services...' });
});

// Stop all services
app.post('/api/stop-all', (req, res) => {
    addLog('system', '⏹️ Stopping ALL services...', 'warning');

    let stoppedCount = 0;
    let totalServices = 0;

    Object.keys(CONFIG.services).forEach(service => {
        totalServices++;
        const proc = processes[service];

        if (proc && !proc.killed) {
            try {
                proc.kill('SIGTERM');
                addLog('system', `⏹️ Stopping ${CONFIG.services[service].name}...`, 'warning');
                stoppedCount++;

                // Force kill after 5 seconds if still running
                setTimeout(() => {
                    if (proc && !proc.killed) {
                        proc.kill('SIGKILL');
                        addLog('system', `Force stopped ${CONFIG.services[service].name}`, 'warning');
                    }
                }, 5000);
            } catch (error) {
                addLog('system', `Error stopping ${service}: ${error.message}`, 'error');
            }
        }

        processes[service] = null;
    });

    setTimeout(() => {
        addLog('system', `✅ All services stopped (${stoppedCount}/${totalServices})`, 'success');
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

    addLog('system', `🌐 Opening ${config.url}...`);
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

        addLog('testing', `💾 Test report saved: ${filename}`, 'success');

        res.json({
            success: true,
            filename: filename,
            filepath: filepath,
            message: `Report saved to: ${testReportsDir}`
        });
    } catch (error) {
        addLog('testing', `Error saving report: ${error.message}`, 'error');
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════╗
    ║   🚀 Nexus DevHub - Development Manager      ║
    ║      Unified Service Management              ║
    ║      Created by Lito Juliano                 ║
    ╚═══════════════════════════════════════════════╝

    📊 Dashboard: http://localhost:${PORT}
    📡 API: http://localhost:${PORT}/api

    🎯 Active Project: ${CONFIG.name}
    📁 Location: ${CONFIG.projectRoot}

    ⌨️  Ctrl+C to stop
    `);

    setTimeout(async () => {
        await openApp(`http://localhost:${PORT}`);
    }, 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down all services gracefully...\n');

    Object.keys(processes).forEach(service => {
        const proc = processes[service];
        if (proc && !proc.killed) {
            console.log(`   Stopping ${CONFIG.services[service].name}...`);
            proc.kill('SIGTERM');
        }
    });

    setTimeout(() => {
        console.log('\n✅ All services stopped. Goodbye!\n');
        process.exit(0);
    }, 2000);
});
