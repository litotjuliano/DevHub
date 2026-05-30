# DevHub - Architecture & Implementation Guide

**Project:** DevHub - Unified Development Environment Manager  
**Creator:** Lito Juliano  
**Start Date:** May 30, 2026  
**Current Version:** 1.0  
**Status:** Active Development

---

## 🎯 Project Vision

DevHub is a **centralized development environment orchestrator** that manages multiple projects, services, and development workflows from a single web-based dashboard. It eliminates the need for multiple terminal windows and provides real-time monitoring, logging, and control of all services.

**Problem Solved:**
- ❌ Multiple PowerShell windows for different services
- ❌ Manual service startup/shutdown
- ❌ Scattered documentation and credentials
- ❌ No unified logging or monitoring
- ❌ Difficult to test across multiple services

**Solution:**
- ✅ One dashboard for all services
- ✅ One-click service management
- ✅ Integrated testing framework with persistence
- ✅ Real-time unified logging
- ✅ Credential management and quick links

---

## 🏗️ Architecture

### Tech Stack
- **Backend:** Node.js + Express.js (port 8080)
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript
- **Process Management:** Node.js `child_process` API
- **Data Persistence:** Browser localStorage (client-side)
- **File Management:** Node.js `fs` module

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│              Web Browser (http://localhost:8080)    │
│  ┌────────────────────────────────────────────────┐ │
│  │         DevHub Dashboard (dev-dashboard.html)  │ │
│  │  ┌──────────────┬──────────────────────────┐  │ │
│  │  │ Project      │  Service Management      │  │ │
│  │  │ Navigation   │  - Start/Stop/Build      │  │ │
│  │  │              │  - Status monitoring     │  │ │
│  │  │  NexusTravel │  - Real-time logs       │  │ │
│  │  │  NexusCount  │  - Quick links          │  │ │
│  │  └──────────────┴──────────────────────────┘  │ │
│  │  ┌──────────────┬──────────────────────────┐  │ │
│  │  │ Testing      │  Documentation Links    │  │ │
│  │  │ Checklist    │  - Syntax helper        │  │ │
│  │  │ - Persistent │  - File readers         │  │ │
│  │  │ - Auto-save  │  - Claude Code syntax   │  │ │
│  │  └──────────────┴──────────────────────────┘  │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           ▲
                           │ REST API calls
                           ▼
┌─────────────────────────────────────────────────────┐
│     Express.js Server (dev-server.js:8080)         │
│  ┌────────────────────────────────────────────────┐ │
│  │  Route Handlers                                │ │
│  │  - GET /api/projects                           │ │
│  │  - POST /api/projects/:project                 │ │
│  │  - GET /api/config                             │ │
│  │  - GET /api/services                           │ │
│  │  - POST /api/start/:service                    │ │
│  │  - POST /api/stop/:service                     │ │
│  │  - POST /api/build/:service                    │ │
│  │  - POST /api/start-all                         │ │
│  │  - POST /api/stop-all                          │ │
│  │  - GET /api/docs/:doctype                      │ │
│  │  - POST /api/save-test-report                  │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │  Process Management                            │ │
│  │  - Spawn child processes per service           │ │
│  │  - Track process state (running/stopped)       │ │
│  │  - Handle stdout/stderr streams                │ │
│  │  - Graceful shutdown (SIGTERM → SIGKILL)       │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │  Logging System                                │ │
│  │  - In-memory log buffer (150 entries/service)  │ │
│  │  - Real-time stream to client                  │ │
│  │  - Log types: info, success, warning, error    │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           ▲
                           │ Project paths
                           ▼
┌─────────────────────────────────────────────────────┐
│         Managed Projects (C:\Nexus Systems\)        │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  NexusTravel/    │  │  NexusCount/         │   │
│  │  ├─ src/         │  │  ├─ src/             │   │
│  │  ├─ web/         │  │  ├─ web/             │   │
│  │  │  ├─ admin-    │  │  └─ [similar]        │   │
│  │  │  │  portal/   │  │                      │   │
│  │  │  ├─ public-   │  │  test-reports/      │   │
│  │  │  │  website/  │  │  └─ [auto-generated]│   │
│  │  └─ CLAUDE.md    │  │                      │   │
│  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Core Components

### 1. dev-server.js (Express Backend)
**Responsibility:** Service orchestration and API endpoints

**Key Responsibilities:**
- Load project configurations
- Spawn/kill child processes
- Manage service state
- Stream logs to clients
- Save test reports to disk
- Handle graceful shutdown

**Configuration Structure:**
```javascript
const PROJECTS = {
    projectKey: {
        name: 'Display Name',
        description: 'Project description',
        projectRoot: 'C:\\path\\to\\project',
        services: {
            serviceName: {
                name: 'Service Display Name',
                port: 5000,
                path: 'relative/path',
                cmd: 'executable',
                args: ['arg1', 'arg2'],
                url: 'http://localhost:5000',
                swagger: 'http://localhost:5000/swagger',
                description: 'Service description',
                optional: false
            }
        }
    }
}
```

### 2. dev-dashboard.html (Web Interface)
**Responsibility:** User interface and client-side logic

**Key Features:**
- Project navigation (switcher buttons)
- Service cards with status badges
- Real-time log viewer
- Credentials display with copy buttons
- Testing checklist with persistence
- Documentation viewer with syntax helper
- Support guide and timeline

**State Management:**
- Services state: `let services = {}`
- All logs: `let allLogs = {}`
- Projects: `let projects = {}`
- Checklist data: `let checklistData = {}`
- Current project: `let activeProject = 'nexustravel'`

### 3. START-DEVHUB.bat (Windows Batch Launcher)
**Responsibility:** User-friendly startup script

**Features:**
- Checks for Node.js installation
- Installs npm dependencies if needed
- Sets console title
- Launches dev-server.js
- Auto-opens browser to http://localhost:8080

### 4. START-DEVHUB.ps1 (PowerShell Alternative)
**Responsibility:** Cross-shell startup with colored output

**Features:**
- Node.js version checking
- Colored console output
- Dependency installation
- Process launch

---

## 🔄 Service Lifecycle

### Starting a Service

```
User clicks "▶️ Run"
    ↓
POST /api/start/:service
    ↓
Express checks if service already running
    ↓
Spawns child process: spawn(cmd, args, options)
    ↓
Attaches stdout/stderr handlers
    ↓
Adds to processes[service] tracking
    ↓
Logs "Starting..." message
    ↓
2 second delay for initialization
    ↓
Logs "✅ Running on port X" success message
    ↓
Dashboard updates status badge to green
```

### Stopping a Service

```
User clicks "⏹️ Stop"
    ↓
POST /api/stop/:service
    ↓
Express finds process in tracking
    ↓
Sends SIGTERM signal (graceful shutdown)
    ↓
Sets 5-second timeout
    ↓
If still running after 5s, sends SIGKILL
    ↓
Clears from processes[service]
    ↓
Logs success/completion message
    ↓
Dashboard updates status badge to red
```

### Building a Service

```
User clicks "🔨 Build"
    ↓
POST /api/build/:service
    ↓
Determine build command (dotnet or npm)
    ↓
Spawn build process in service directory
    ↓
Capture stdout/stderr in real-time
    ↓
Log each output line
    ↓
On exit code 0: Log "✅ Build successful"
    ↓
On exit code != 0: Log "❌ Build failed"
```

---

## 💾 Data Persistence

### Browser LocalStorage (Client-side)
```javascript
// Testing Checklist
localStorage.setItem('nexusTravel_testingChecklist', JSON.stringify(checklistData))
localStorage.getItem('nexusTravel_testingChecklist')

// Error Log
localStorage.setItem('nexusTravel_errorLog', errorText)
localStorage.getItem('nexusTravel_errorLog')
```

### Disk Storage (Server-side)
```
C:\Nexus Systems\NexusTravel\
├── test-reports/
│   ├── test-report-2026-05-30-143022.md
│   ├── test-report-2026-05-30-155047.md
│   └── [auto-generated with timestamp]
└── [other project files]
```

### In-Memory Logs (Real-time)
```javascript
const logs = {
    backend: [
        { message: '[14:30:22] Server starting', type: 'info' },
        { message: '[14:30:23] Connected to database', type: 'success' }
    ],
    adminPortal: [
        { message: '[14:30:25] Dev server ready', type: 'success' }
    ]
}
// Logs kept to 150 entries per service (FIFO)
```

---

## 🔌 API Endpoints

### Project Management
- `GET /api/projects` - List all projects
- `POST /api/projects/:project` - Switch active project

### Configuration
- `GET /api/config` - Get current project config
- `GET /api/services` - Get service status

### Service Control
- `POST /api/start/:service` - Start a service
- `POST /api/stop/:service` - Stop a service
- `POST /api/build/:service` - Build a service
- `POST /api/start-all` - Start all services
- `POST /api/stop-all` - Stop all services

### Utilities
- `POST /api/open/:service` - Open service URL in browser
- `GET /api/logs/:service` - Get service logs
- `GET /api/docs/:doctype` - Get documentation
- `POST /api/save-test-report` - Save test report

### Health
- `GET /health` - Server health check

---

## 🧪 Testing System

### Checklist Features
1. **Markdown Parsing** - Converts TESTING-CHECKLIST.md into interactive form
2. **Persistent Storage** - Auto-saves to localStorage
3. **Tab Navigation** - Organize by feature (Login, Dashboard, Packages, etc.)
4. **Note Fields** - Each item has editable notes
5. **Error Log** - Textarea for collecting errors
6. **Report Generation** - Creates markdown report with all data
7. **File Saving** - Reports saved to test-reports/ with timestamp

### Test Report Structure
```markdown
# NexusTravel Testing Report

Generated: [timestamp]

## Admin Portal Login
1. ✅ Login with credentials
   **Note:** Successfully logged in
2. ❌ Invalid credentials error
   **Note:** Waiting for fix

## Dashboard Page
[... more items ...]

## Error Log & Additional Notes
[... user-entered errors ...]
```

---

## 🎯 Design Decisions

### Why Multiple Processes Instead of Single Process Manager?
- ✅ Each service runs independently
- ✅ Easier to attach debuggers
- ✅ Services can use different interpreters (dotnet, npm)
- ✅ Independent logging per service
- ✅ Better isolation if one crashes

### Why Browser LocalStorage for Checklist?
- ✅ No database needed
- ✅ Persists across sessions
- ✅ Fast and responsive
- ✅ Works offline
- ❌ Limited to browser (but that's where testing happens)

### Why In-Memory Logs Instead of Files?
- ✅ Real-time streaming to UI
- ✅ Lower disk I/O
- ✅ Auto-cleanup (150 entry limit)
- ❌ Lost on server restart (acceptable for dev tool)

### Why Single dev-server.js for All Projects?
- ✅ One central orchestrator
- ✅ Easy to switch between projects
- ✅ Shared logging and monitoring
- ✅ Scalable: add projects without code changes

---

## 🚀 Adding a New Project

### Step 1: Create Project Folder Structure
```
C:\Nexus Systems\MyProject\
├── src/
├── web/
├── CLAUDE.md
└── OPENSPEC.md
```

### Step 2: Add to dev-server.js
```javascript
myproject: {
    name: 'My Project',
    description: 'Project description',
    projectRoot: 'C:\\Nexus Systems\\MyProject',
    services: {
        backend: {
            name: 'Backend API',
            port: 5000,
            path: '.',
            cmd: 'dotnet',
            args: ['run'],
            url: 'http://localhost:5000',
            description: 'API service'
        }
    }
}
```

### Step 3: Restart DevHub
```powershell
.\START-DEVHUB.bat
```

### Step 4: New project appears in navigation

---

## 🔄 Graceful Shutdown

**On Ctrl+C in dev-server.js:**
1. Receives SIGINT signal
2. Iterates through all processes
3. Sends SIGTERM to each (graceful shutdown)
4. Waits 2 seconds for cleanup
5. Exits with code 0

**Why SIGTERM first?**
- Allows processes to clean up resources
- Flushes buffers
- Closes database connections
- Better for databases and long-running tasks

---

## 🎨 UI/UX Decisions

### Dashboard Layout
- **Header:** Project name, created by
- **Navigation:** Project switcher buttons (inline)
- **Status:** Real-time status cards per service
- **Controls:** Build, Run, Stop buttons inline
- **Quick Links:** Open URL, Swagger, Credentials
- **Logs:** Live stream of all service output
- **Testing:** Integrated checklist with timeline

### Color Coding
- 🟢 **Green:** Running/Success/Complete
- 🔴 **Red:** Stopped/Error/Failed
- 🟡 **Yellow:** Warning/In Progress
- 🔵 **Blue:** Info/Loading

### Responsive Design
- **Desktop:** Multi-column cards, full features
- **Tablet:** 2-column layout, stacked logs
- **Mobile:** Single column, essential info only

---

## 📈 Future Roadmap

### Phase 2 (Next)
- [ ] Database for persistent logs
- [ ] User authentication
- [ ] Multi-user support
- [ ] Service health monitoring
- [ ] Performance metrics

### Phase 3
- [ ] Webhook support (trigger builds on git push)
- [ ] Environment variables UI
- [ ] Service dependency management
- [ ] Automated backup of test reports

### Phase 4
- [ ] Mobile app
- [ ] Slack/Discord integration
- [ ] AI analysis of errors
- [ ] Performance benchmarking

---

## 🔒 Security Considerations

### Current Implementation
- ✅ Runs on localhost only
- ✅ No authentication (development tool)
- ✅ No sensitive data storage
- ✅ Limited to local processes

### Future Production Use
- [ ] Add API authentication
- [ ] Restrict to admin users only
- [ ] Encrypt stored credentials
- [ ] Audit log all actions
- [ ] Network isolation

---

## 📝 Contributing

To add features to DevHub:

1. **Update CLAUDE.md** - Document architectural changes
2. **Update dev-server.js** - Backend changes
3. **Update dev-dashboard.html** - Frontend changes
4. **Test thoroughly** - Test all projects
5. **Update documentation** - README, guides, etc.

---

## 🎓 Learning Resources

- Node.js `child_process`: https://nodejs.org/api/child_process.html
- Express.js: https://expressjs.com/
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- LocalStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

---

**DevHub Architecture Document** ✅  
Ready for development and expansion.
