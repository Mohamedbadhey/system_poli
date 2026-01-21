# Case Reopen Feature - Access Control Summary

## ✅ Access Restrictions Implemented

### **1. Solved Cases Dashboard Page**
**Who Can Access:**
- ✅ **Admin** - Full access
- ✅ **Super Admin** - Full access
- ❌ **Investigators** - No access (menu hidden)
- ❌ **OB Officers** - No access
- ❌ **Station Admins** - No access
- ❌ **Court Users** - No access

**Implementation:**
- Menu item only shown to admin and super_admin (line 179-182 in app.js)
- Page loading blocked with access denied message for non-authorized users
- Backend API endpoints also protected by role checks

### **2. Case Reopen Functionality**
**Who Can Reopen Cases:**
- ✅ **Admin** - Can reopen any closed case
- ✅ **Super Admin** - Can reopen any closed case
- ✅ **Station Admin** - Can reopen cases in their jurisdiction
- ❌ **Investigators** - Cannot reopen cases
- ❌ **OB Officers** - Cannot reopen cases
- ❌ **Court Users** - Cannot reopen cases

**Implementation:**
- Backend: `CaseController::reopenCase()` checks user role (line 36-38)
- Frontend: Reopen button only visible to authorized roles (solved-cases-dashboard.js line 115-128)

### **3. What Each Role Can See**

#### **Admin & Super Admin:**
- ✅ Can see "Solved Cases Dashboard" in menu
- ✅ Can view all closed cases
- ✅ Can see "Reopen" button on eligible cases
- ✅ Can reopen cases with investigator assignment
- ✅ Can view complete reopen history

#### **Investigators:**
- ✅ Can see "Cases Solved by Investigator" (their own)
- ✅ Can see "Cases Solved by Court"
- ❌ Cannot see "Solved Cases Dashboard" in menu
- ❌ Cannot access the solved cases dashboard page
- ❌ Cannot reopen cases

#### **Station Admins:**
- ❌ Cannot see solved cases dashboard in menu (by design)
- ✅ Can reopen cases via API (if they have direct access)
- ✅ Can assign investigators during reopen

### **4. Security Layers**

**Layer 1: UI/Menu (Frontend)**
```javascript
// app.js line 179-182
if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN) {
    nav.append(createNavItem('solved-cases-dashboard', ...));
}
```

**Layer 2: Page Access (Frontend)**
```javascript
// app.js - solved-cases-dashboard case
if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    // Show access denied message
}
```

**Layer 3: Button Visibility (Frontend)**
```javascript
// solved-cases-dashboard.js
const canReopen = ['admin', 'super_admin', 'station_admin'].includes(userRole);
```

**Layer 4: API Endpoint (Backend)**
```php
// CaseController.php
if (!in_array($userRole, ['admin', 'super_admin', 'station_admin'])) {
    return $this->failForbidden('You do not have permission to reopen cases');
}
```

### **5. What Happens When Unauthorized User Tries to Access**

**Scenario 1: Investigator tries to access dashboard**
1. Menu item not visible in sidebar
2. If they try direct URL access, they see "Access Denied" message
3. Cannot see reopen buttons on their solved cases pages

**Scenario 2: Investigator tries to call reopen API**
1. Backend rejects with 403 Forbidden
2. Error message: "You do not have permission to reopen cases"

**Scenario 3: Court-closed case**
1. Even admins cannot reopen court-closed cases
2. Validation: `court_status !== 'court_closed'`
3. Error message: "Case was closed by court and requires court approval to reopen"

### **6. Role Permission Matrix**

| Action | Super Admin | Admin | Station Admin | Investigator | OB Officer | Court User |
|--------|-------------|-------|---------------|--------------|------------|------------|
| View Solved Cases Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View All Closed Cases | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ |
| Reopen Cases | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reopen Court-Closed Cases | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Reopen History | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ |
| Assign During Reopen | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Own Solved Cases | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

*Station Admin: Only for cases in their jurisdiction

### **7. Modified Files**

**Frontend:**
- `public/assets/js/app.js` - Menu and page access control
- `public/assets/js/solved-cases-dashboard.js` - Button visibility control

**Backend:**
- `app/Controllers/Investigation/CaseController.php` - API permission checks
- `app/Models/CaseModel.php` - Business logic validation

### **8. Testing Access Control**

**Test 1: Login as Investigator**
```
1. Login with investigator account
2. Check sidebar menu
3. ✓ "Solved Cases Dashboard" should NOT appear
4. Try accessing: dashboard.html#solved-cases-dashboard
5. ✓ Should see "Access Denied" message
```

**Test 2: Login as Admin**
```
1. Login with admin account
2. Check sidebar menu
3. ✓ "Solved Cases Dashboard" should appear
4. Click on it
5. ✓ Should load successfully
6. ✓ Should see "Reopen" buttons on eligible cases
```

**Test 3: Try API Direct Call**
```
1. Login as investigator
2. Use browser console or Postman
3. Call: POST /investigation/cases/30/reopen
4. ✓ Should return 403 Forbidden
```

### **9. User Messages**

**English:**
- "Access Denied" - Page access denied
- "You do not have permission to access this page" - Detailed message
- "You do not have permission to reopen cases" - API rejection
- "Case was closed by court and requires court approval to reopen" - Court case protection

**Somali:**
- "Gelitaanka waa la diiday" - Access denied
- "Xaq uma lihid inaad geliso boggan" - No permission message

### **10. Summary**

The case reopen feature has **4 layers of security**:

1. ✅ **Menu visibility** - Only admins see the menu item
2. ✅ **Page access control** - Non-admins get access denied screen
3. ✅ **UI button visibility** - Reopen button only shown to authorized users
4. ✅ **API endpoint protection** - Backend validates user permissions

This ensures that:
- Investigators can ONLY view their own solved cases (read-only)
- Only admins, super_admins, and station_admins can reopen cases
- The dashboard page is completely hidden from non-admin users
- Multiple security layers prevent unauthorized access

---

**Status:** ✅ Fully Implemented and Secured
**Last Updated:** January 20, 2026
