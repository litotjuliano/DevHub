# DevHub Quick Reference Card

**Print this or save to your phone!**

---

## 🚀 START DEVHUB (2 seconds)
```powershell
cd "C:\Nexus Systems\DevHub"
.\START-DEVHUB.bat
```
Browser opens: http://localhost:8080

---

## 🎯 ONE-CLICK SERVICE START
In DevHub dashboard, click: **▶️ Run All Services**  
Wait 30 seconds. All services ready!

---

## 🌐 ACCESS SERVICES

| Service | URL | Use For |
|---------|-----|---------|
| **Admin** | http://localhost:3000 | Manage packages, tenants |
| **Public** | http://localhost:3001 | Customer booking site |
| **API Docs** | http://localhost:5084/swagger | Test API endpoints |
| **DevHub** | http://localhost:8080 | Service orchestration |

---

## 🔐 LOGIN CREDENTIALS

### SuperAdmin (Full Access)
```
Email:    superadmin@nexustravel.com
Password: SuperAdmin@123
```

### Admin (Platform Admin)
```
Email:    admin@nexustravel.com
Password: Admin@123
```

---

## 📊 SAMPLE DATA (Auto-Seeded)

### Tenants
1. Travel Pro
2. Wanderlust Tours
3. Adventure Seekers

### Packages
1. Japan Sakura ($1,500, 10 days)
2. Europe Grand Tour ($2,200, 14 days)
3. Maldives Luxury ($2,500, 7 days)
4. Bali Family ($1,000, 7 days)
5. South Korea ($1,200, 8 days)

---

## 🧪 TESTING WITH DEVHUB

1. Click **"🧪 Testing Checklist"** in dashboard
2. Pick test category (Authentication, Dashboard, etc.)
3. Follow numbered test steps
4. Record results
5. Check ✓ when complete
6. Click **"✅ Submit & Generate Report"**

---

## 📖 DOCUMENTATION

| Need | Location |
|------|----------|
| **DevHub Setup** | `/DevHub/DEVHUB_GUIDE.md` |
| **Developer Guide** | `docs/guides/DEVHUB_GUIDE.md` |
| **All Credentials** | Click dashboard "📋 Credentials" |
| **Testing Guide** | Click dashboard "🧪 Testing Checklist" |
| **Architecture** | Click dashboard "📘 Architecture" |
| **Deployment** | `docs/deployment/DEPLOYMENT.md` |

---

## 🆘 QUICK TROUBLESHOOTING

**Service won't start?**
→ Check logs at bottom of DevHub. Fix path or dependency issue.

**Can't login?**
→ Verify credentials above. Check API is running (port 5084).

**Port conflict?**
```powershell
netstat -ano | findstr :5084
taskkill /PID [PID] /F
```

**Database error?**
```powershell
cd src\NexusTravel.API
dotnet ef database drop --force
dotnet ef database update
```

---

## 💡 PRO TIPS

✅ **Always watch the logs** — 90% of issues shown there  
✅ **Click port numbers** — Opens services directly  
✅ **Copy credentials** — One-click copy to clipboard  
✅ **Check Swagger** — Test API endpoints directly  
✅ **Generate reports** — Documents what you tested  

---

## 📋 DAILY WORKFLOW

### Morning
1. `.\START-DEVHUB.bat`
2. Click "▶️ Run All Services"
3. Open code editor
4. Start developing

### During Day
- Edit code
- Watch DevHub logs
- Test in browser
- Commit changes

### End of Day
1. Click "⏹️ Stop All Services"
2. Close DevHub
3. Commit final changes
4. Done!

---

## 🎯 COMMON TASKS

### Create a Package
1. Login as Admin
2. Go to Packages
3. Click "Create"
4. Fill details
5. Save & Publish

### Sync to Tenant
1. Select package
2. Click "Sync"
3. Choose tenant
4. Click "Sync"

### View in Public Site
1. Open http://localhost:3001
2. See synced packages
3. Submit inquiry form

### Check Analytics
1. Go to Dashboard
2. See inquiry count
3. Click to view details

---

## 🔗 QUICK LINKS (Copy & Paste)

```
Admin Portal:     http://localhost:3000
Public Website:   http://localhost:3001
API Docs:         http://localhost:5084/swagger
DevHub Dashboard: http://localhost:8080
```

---

## 📞 NEED MORE HELP?

**Full guides at:** `C:\Nexus Systems\NexusTravel\docs\`

Or in DevHub dashboard, click documentation buttons:
- 📋 Credentials
- 🧪 Testing Checklist
- 📘 Architecture
- 📘 Design System
- 📘 Deployment

---

## ✅ FIRST-TIME CHECKLIST

Before starting development:
- [ ] DevHub starts (no errors)
- [ ] All services show 🟢 Running
- [ ] Can open Admin (3000)
- [ ] Can open Public (3001)
- [ ] Can login with credentials
- [ ] See 5 sample packages
- [ ] Testing checklist accessible

**All green?** You're ready! 🚀

---

**Last Updated:** May 30, 2026  
**Version:** 1.0  
**Status:** ✅ PRODUCTION READY

Keep this card handy for quick reference!
