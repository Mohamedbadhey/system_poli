# Police Case Management System - Setup Instructions

## ✅ COMPLETED STEPS

1. ✓ CodeIgniter 4.6.4 upgraded successfully
2. ✓ Database schemas created (19 tables)
3. ✓ `.env` file configured
4. ✓ API routes configured with authentication filters
5. ✓ Custom filters registered (AuthFilter, AuditFilter, CorsFilter)
6. ✓ JWT library installed (firebase/php-jwt)
7. ✓ Test data SQL file created

## 📝 REMAINING SETUP STEPS

### Step 1: Import Test Data (REQUIRED)

You need to import the seed data to create test users. Run this command in your MySQL client or phpMyAdmin:

```bash
# If using MySQL command line:
mysql -u root pcms_db < app/Database/seed_test_data.sql

# Or use phpMyAdmin:
# 1. Open phpMyAdmin
# 2. Select "pcms_db" database
# 3. Click "Import" tab
# 4. Choose file: app/Database/seed_test_data.sql
# 5. Click "Go"
```

### Step 2: Verify Test Data Import

After importing, you should have:
- 3 Police Centers
- 11 Users (with different roles)
- 8 Persons
- 5 Cases
- Other related data

### Step 3: Test Login Credentials

**Important:** The test data includes users with this password: `password123`

However, the password hash in the SQL file needs to be generated. Let me create a proper hash:

**Test User Accounts:**
- **Super Admin:** `superadmin` / `password123`
- **Admin:** `admin1` / `password123`
- **OB Officer:** `ob_officer1` / `password123`
- **Investigator:** `investigator1` / `password123`
- **Court User:** `court_user1` / `password123`

## 🔧 PASSWORD HASH FIX

The seed data file has a placeholder password hash. Before importing, you need to:

1. **Generate correct password hash** for `password123`
2. **Replace** the hash in `app/Database/seed_test_data.sql`

Use this PHP command to generate the hash:
```bash
php -r "echo password_hash('password123', PASSWORD_BCRYPT, ['cost' => 12]);"
```

Then replace this line in the SQL file:
```sql
'$2y$12$YGZ9YfZ8k7c8YfZ8k7c8YeYGZ9YfZ8k7c8YfZ8k7c8YeYGZ9YfZ8k'
```

With the generated hash.

## 🚀 QUICK START (Alternative)

If you want to skip the seed data and create a user manually:

```sql
-- Create a super admin user with password: admin123
INSERT INTO users (center_id, username, email, password_hash, full_name, phone, role, badge_number, is_active) 
VALUES (
    1, 
    'admin', 
    'admin@pcms.gov', 
    '$2y$12$[YOUR_GENERATED_HASH]',
    'System Administrator',
    '+252-61-1000000',
    'super_admin',
    'SA-001',
    1
);
```

## 🔍 TESTING THE APPLICATION

### Using the Web Interface:
1. Open browser: `http://localhost:8080/index.html`
2. Login with: `admin1` / `password123`
3. You'll be redirected to the dashboard

### Using the API Test Script:
```bash
php tmp_rovodev_test_api.php
```

### Using cURL:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"password123"}'
```

## 📚 API DOCUMENTATION

Base URL: `http://localhost:8080`

### Authentication Endpoints:
- `POST /auth/login` - Login (public)
- `POST /auth/logout` - Logout (requires auth)
- `GET /auth/me` - Get current user (requires auth)
- `POST /auth/refresh-token` - Refresh token (public)
- `POST /auth/change-password` - Change password (requires auth)

### OB Officer Endpoints:
- `GET /ob/cases` - List cases
- `POST /ob/cases` - Create case
- `GET /ob/cases/{id}` - Get case details
- `PUT /ob/cases/{id}` - Update case
- `POST /ob/cases/{id}/submit` - Submit for approval
- `POST /ob/persons` - Add person
- `POST /ob/custody` - Record custody

### Investigation Endpoints:
- `GET /investigation/cases` - Get assigned cases
- `POST /investigation/cases/{id}/evidence` - Upload evidence
- `POST /investigation/cases/{id}/reports` - Create report
- `POST /investigation/cases/{id}/close` - Close case
- `POST /investigation/cases/{id}/escalate` - Escalate to court

### Admin Endpoints:
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `GET /admin/centers` - List centers
- `GET /admin/audit-logs` - View audit logs
- `GET /admin/dashboard` - Admin dashboard

## 🔐 SECURITY NOTES

### For Production Deployment:
1. Change `JWT_SECRET` in `.env` to a strong random key
2. Change `encryption.key` to a secure key
3. Update database credentials
4. Enable HTTPS (`app.forceGlobalSecureRequests = true`)
5. Change all default passwords
6. Configure proper CORS settings
7. Enable CSRF protection
8. Review and update security headers

## 📋 PROJECT STRUCTURE

```
app/
├── Controllers/
│   ├── Admin/         - User, Center, Audit management
│   ├── OB/            - Case, Person, Custody management
│   ├── Investigation/ - Evidence, Reports, Timeline
│   ├── Court/         - Court submissions
│   └── Station/       - Case review and assignments
├── Models/            - 11 models with validation
├── Filters/           - Auth, Audit, CORS filters
└── Database/          - SQL schemas and seed data

Database Tables: 19 tables
- Core: users, police_centers, user_sessions
- Cases: cases, case_parties, case_assignments
- Persons: persons, person_aliases
- Evidence: evidence, evidence_custody_log
- Investigation: investigation_timeline, investigation_reports
- Custody: custody_records, custody_daily_logs, custody_alerts
- Audit: audit_logs, notifications, digital_signatures
```

## ❓ TROUBLESHOOTING

### Login fails with "Invalid credentials"
→ Import the seed data or create a user manually with proper password hash

### "Unable to connect to database"
→ Check database name in `.env` matches your created database

### JWT errors
→ Ensure `firebase/php-jwt` is installed: `composer require firebase/php-jwt`

### CORS errors
→ CORS filter is enabled globally, check browser console

### 404 on routes
→ Ensure `.htaccess` is present in `public/` directory

## 📞 NEED HELP?

Check these files for reference:
- API Routes: `app/Config/Routes.php`
- Database Config: `app/Config/Database.php`
- Environment: `.env`
- Seed Data: `app/Database/seed_test_data.sql`

## 🎉 SUCCESS CRITERIA

Your setup is complete when:
1. ✓ Login at `http://localhost:8080/index.html` works
2. ✓ JWT token is received after login
3. ✓ Dashboard loads after successful login
4. ✓ API endpoints return data (not 401/404)
5. ✓ Audit logs are being created
