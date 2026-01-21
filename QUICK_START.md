# Police Case Management System - Quick Start Guide

## 🚀 **START THE APPLICATION**

### **Option 1: Using PHP Built-in Server (Recommended for Development)**
```bash
cd "C:\Users\hp\Documents\kismayo police\systempolic\public"
php -S localhost:8080
```
Then open your browser: **http://localhost:8080/index.html**

**Alternative (using spark from root directory):**
```bash
cd "C:\Users\hp\Documents\kismayo police\systempolic"
php spark serve
```
**Note:** If using `php spark serve`, you need to access: **http://localhost:8080/index.html** directly

### **Option 2: Using XAMPP/WAMP**
1. Point your Apache document root to: `C:\Users\hp\Documents\kismayo police\systempolic\public`
2. Start Apache and MySQL
3. Access: **http://localhost**

---

## 🔐 **LOGIN CREDENTIALS**

### **Test Users (All passwords: password123)**

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `superadmin` | `password123` | Super Admin | Full system access |
| `admin_central` | `password123` | Admin | Police center administration |
| `ob_officer1` | `password123` | OB Officer | Create and manage cases |
| `investigator1` | `password123` | Investigator | Handle investigations |
| `court_user1` | `password123` | Court User | Court submissions |

---

## 📋 **WHAT TO DO FIRST**

### **1. Login to the System**
- Open **http://localhost:8080**
- Use `superadmin` / `password123`
- You'll be redirected to the dashboard

### **2. Explore the Dashboard**
The frontend will show different options based on your role:
- **Super Admin**: Full system management
- **Admin**: User and case management
- **OB Officer**: Create cases, record persons, custody
- **Investigator**: View cases, add evidence, create reports
- **Court User**: Prepare court submissions

### **3. Test the API Directly**
```bash
# Login and get token
curl -X POST http://localhost:8080/auth/login \
  -d "username=superadmin&password=password123"

# Use token for authenticated requests
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ **COMMON TASKS**

### **Create a New User**
1. Login as admin or super_admin
2. Navigate to User Management
3. Fill in user details
4. Assign role and police center
5. Save

### **Create a Case (OB Entry)**
1. Login as ob_officer
2. Go to "Create New Case"
3. Fill in incident details
4. Add persons (accused, accuser, witness)
5. Submit for approval

### **Assign Investigator**
1. Login as admin
2. View pending cases
3. Select case to approve
4. Assign investigator(s)
5. Set deadline

### **Add Evidence**
1. Login as investigator
2. View assigned cases
3. Select case
4. Upload evidence
5. Fill chain of custody info

---

## 🗄️ **DATABASE ACCESS**

### **Database Details:**
- **Host**: localhost
- **Database**: pcms_db
- **Username**: root
- **Password**: (empty or your MySQL password)

### **Quick Database Check:**
```sql
-- Check users
SELECT username, role, is_active FROM users;

-- Check cases
SELECT case_number, status, crime_type FROM cases;

-- Check sessions
SELECT user_id, expires_at FROM user_sessions;
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: Login page doesn't show**
**Solution**: 
- Make sure you're accessing `http://localhost:8080` (not `http://localhost:8080/public`)
- The root URL automatically redirects to `/index.html`

### **Problem: Login fails**
**Solution**:
- Check database is running
- Verify credentials (default: `superadmin` / `password123`)
- Check logs in `writable/logs/`

### **Problem: "Invalid or expired session" after login**
**Solution**:
- This should be fixed now
- Sessions are created in the `user_sessions` table
- Check if sessions are being created: `SELECT * FROM user_sessions;`

### **Problem: API returns 404**
**Solution**:
- Check routes: `php spark routes`
- Ensure you're using the correct HTTP method (GET/POST/PUT/DELETE)
- Check `.htaccess` file exists in `public/` directory

### **Problem: CORS errors in browser**
**Solution**:
- CORS filter is enabled globally
- Check browser console for specific errors
- Verify API calls are using correct headers

---

## 📁 **IMPORTANT FILES**

| File | Purpose |
|------|---------|
| `.env` | Environment configuration (database, JWT secret) |
| `app/Config/Routes.php` | All API route definitions |
| `app/Config/Database.php` | Database settings |
| `public/index.html` | Login page |
| `public/dashboard.html` | Main dashboard |
| `public/assets/js/config.js` | Frontend API configuration |

---

## 🔐 **SECURITY CHECKLIST FOR PRODUCTION**

- [ ] Change `JWT_SECRET` in `.env` to a strong random key
- [ ] Change `encryption.key` in `.env`
- [ ] Update all default passwords
- [ ] Set `CI_ENVIRONMENT = production` in `.env`
- [ ] Enable `app.forceGlobalSecureRequests = true` for HTTPS
- [ ] Use strong MySQL password
- [ ] Review and restrict file permissions
- [ ] Enable CSRF protection if needed
- [ ] Configure proper backup strategy
- [ ] Set up SSL certificate

---

## 📊 **SYSTEM OVERVIEW**

### **User Roles:**
1. **Super Admin**: Complete system control
2. **Admin**: Station management, user management, case approval
3. **OB Officer**: Create OB entries, record persons, manage custody
4. **Investigator**: Handle assigned cases, add evidence, create reports
5. **Court User**: Prepare court submissions, upload decisions

### **Case Workflow:**
```
DRAFT → SUBMITTED → APPROVED → ASSIGNED → 
INVESTIGATING → SOLVED/ESCALATED → COURT_PENDING → CLOSED
```

### **Key Features:**
- ✓ JWT Authentication
- ✓ Role-based Access Control
- ✓ Audit Logging
- ✓ Case Management
- ✓ Person Registry (with biometric support)
- ✓ Custody Management
- ✓ Evidence Chain of Custody
- ✓ Investigation Reports
- ✓ Court Submission Workflow
- ✓ Notifications System

---

## 📞 **GETTING HELP**

1. Check `SETUP_INSTRUCTIONS.md` for detailed documentation
2. Review logs in `writable/logs/` directory
3. Test API endpoints using `php spark routes`
4. Check database for data integrity

---

## 🎯 **NEXT STEPS**

1. ✓ Application is running on http://localhost:8080
2. ✓ Login with superadmin credentials
3. → Create your first test case
4. → Explore different user roles
5. → Configure additional settings as needed

---

**Your Police Case Management System is ready to use!** 🚀

Server running at: **http://localhost:8080**
Login page: **http://localhost:8080/index.html**
API base: **http://localhost:8080/auth/**, **http://localhost:8080/ob/**, etc.
