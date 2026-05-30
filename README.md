# 🚀 Nexus DevHub

**Unified Development Environment Manager for Nexus Systems Projects**

**Created by:** Lito Juliano  
**Location:** `C:\Nexus Systems\DevHub`  
**Dashboard:** `http://localhost:8080`

---

## 📋 What is Nexus DevHub?

Nexus DevHub is a centralized development tool that manages all your Nexus Systems projects from one dashboard:

- ✅ **NexusTravel** - Travel Package Distribution Platform
- ✅ **NexusCount** - Accounting System
- ✅ More projects to come...

**One tool to rule them all!**

---

## 🚀 Quick Start

### First Time Only

```powershell
cd "C:\Nexus Systems\DevHub"
npm install
```

### Every Development Session

**Option 1: Batch File (Recommended)**
```
Double-click: START-DEVHUB.bat
```

**Option 2: PowerShell**
```powershell
.\START-DEVHUB.ps1
```

**Option 3: Direct Node**
```powershell
node dev-server.js
```

---

## 📊 Dashboard Features

### Project Selector
Switch between projects at the top:
- **NexusTravel** - Travel booking platform
- **NexusCount** - Accounting system

### Service Management
For each project, manage services:
- 🔨 **Build** - Compile the project
- ▶️ **Run** - Start all services
- ⏹️ **Stop** - Stop all services
- 📋 **Logs** - View real-time logs

### Quick Links
- 🌐 **Open URLs** - Click port numbers to open services
- 📘 **Swagger Docs** - View API documentation
- 📋 **Credentials** - Copy login info
- 📊 **Summary Report** - Project status overview

---

## 🎯 Supported Projects

### NexusTravel

**Services:**
- Backend API (port 5084)
- Admin Portal (port 3000)
- Public Website (port 3001)
- Tenant Dashboard (port 3002 - optional)

**Credentials:**
```
Super Admin:
  Email: superadmin@nexustravel.com
  Password: SuperAdmin@123

Admin:
  Email: admin@nexustravel.com
  Password: Admin@123
```

### NexusCount

Coming soon... Configure your services in `dev-server.js`

---

## 🔧 File Structure

```
C:\Nexus Systems\DevHub/
├── dev-server.js              (Main orchestration server)
├── dev-dashboard.html         (Web GUI interface)
├── package.json               (NPM dependencies)
├── START-DEVHUB.bat          (Windows batch launcher)
├── START-DEVHUB.ps1          (PowerShell launcher)
├── README.md                  (This file)
├── .gitignore
└── node_modules/              (Created after npm install)
```

---

## 📚 Documentation

- **README.md** - This file
- **FIRST-TIME-SETUP.md** - 2-minute quick start
- **dev-server.js** - Server configuration & multi-project setup

---

## 🚀 Typical Development Day

### Morning
```
1. Double-click: START-DEVHUB.bat
2. Select project (default: NexusTravel)
3. Click "▶️ Run All Services"
4. Wait ~30 seconds
5. All services running! ✓
```

### During Day
```
- Edit code
- Browser auto-refreshes (frontend)
- Backend auto-reloads (backend)
- Check logs in dashboard if issues
```

### End of Day
```
1. Click "⏹️ Stop All Services"
2. Close browser
3. Done!
```

---

## 🔄 Switching Projects

Click the project selector at the top:
```
[NexusTravel ▼]  [NexusCount]
```

Each project has:
- ✅ Separate services configuration
- ✅ Separate credentials
- ✅ Separate summary report
- ✅ Separate logs

---

## 🛠️ Troubleshooting

### Service Won't Start?
1. Check the **Development Log** at bottom
2. Look for error messages
3. Common causes: SQL Server not running, port conflicts, dependencies missing

### Port Already in Use?
```powershell
# Find process on port
netstat -ano | findstr :5084

# Kill it (replace PID)
taskkill /PID [PID] /F
```

### npm install fails?
```powershell
rmdir node_modules -r -fo
npm install
```

---

## 📝 Adding a New Project

Edit `dev-server.js` and add to `PROJECTS`:

```javascript
const PROJECTS = {
    nexustravel: { ... },
    nexuscount: { ... },
    myproject: {
        name: 'My Project',
        description: 'Description here',
        projectRoot: 'C:\\Path\\To\\Project',
        services: {
            backend: { ... },
            frontend: { ... }
        }
    }
};
```

Then restart DevHub. Your project appears in the selector!

---

## 💡 Pro Tips

### 💡 Watch the logs
90% of issues are shown in real-time logs. Check them first!

### 💡 One DevHub, multiple projects
Use the same DevHub for all your Nexus Systems projects.

### 💡 Graceful shutdown
Always click "Stop" buttons. Don't force-quit. This prevents database locks.

### 💡 Check prerequisites
```powershell
node --version        # Should be v16+
npm --version
dotnet --version      # Should be 8.0+
```

---

## 🎯 Next Steps

1. ✅ Copy this folder to `C:\Nexus Systems\DevHub`
2. ✅ Run `npm install`
3. ✅ Double-click `START-DEVHUB.bat`
4. ✅ Click "▶️ Run All Services"
5. ✅ Start developing!

---

**Happy coding! 🚀**

Questions? Check the logs in the dashboard first — they answer most questions!
