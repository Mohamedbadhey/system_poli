# Quick Fix Instructions

## Issues to Fix

### 1. All Cases Page - 403 Error

**Error:** `ob/cases:1 Failed to load resource: 403 Forbidden`

**Debugging Steps:**
1. Refresh browser (Ctrl+F5)
2. Open Developer Tools (F12)
3. Go to Console tab
4. Click "All Cases" from dashboard or sidebar
5. Look for these messages:
   - `[ALL-CASES] Page loaded, calling loadAllCases()`
   - `[ALL-CASES] Fetching cases from investigationAPI.getCases()`

6. Go to Network tab
7. Look for the API call being made
8. Check if it's calling `/investigation/cases` or `/ob/cases`

**Expected:**
- Should call: `/investigation/cases`
- Should NOT call: `/ob/cases`

**If it's calling `/ob/cases`:**
- The issue is in `app.js` loadPage() function
- There might be a route conflict
- Check if user role is correctly detected

### 2. Investigations Page - Should Exclude Closed Cases

**Current Issue:** Investigations page shows ALL cases including closed ones

**What it should show:**
- Only cases with status: `assigned`, `investigating`, `under_investigation`
- Should NOT show: `closed` cases

**Where to add filter:**
The investigations page is dynamically rendered. The filter should be added where cases are fetched.

## Temporary Workaround

While debugging, you can:

1. **For All Cases:** Use sidebar "My Investigations" → Shows all cases currently
2. **For Active Only:** Dashboard card "Active Investigations" → Should filter

## What I've Done

### All Cases Page
- ✅ Added debugging console.log messages
- ✅ Verified it uses `investigationAPI.getCases()`
- ✅ Ready to debug the 403 error

### Investigations Page Filter
- ⏳ Need to locate exact rendering location
- ⏳ Add filter: `cases.filter(c => c.status !== 'closed')`

## Next Steps

**Please do this:**
1. Refresh and check browser console
2. Copy ALL console messages when clicking "All Cases"
3. Check Network tab for the actual API endpoint called
4. Share the output

**This will help me identify:**
- Why it's calling `/ob/cases` instead of `/investigation/cases`
- Where the route is being intercepted
- How to fix the investigation filter properly

## Quick Test Commands

Open browser console and run:
```javascript
// Check current user role
console.log('User Role:', currentUser.role);

// Test investigation API
investigationAPI.getCases().then(r => console.log('Investigation API:', r));

// Check if OB API exists
console.log('OB API:', typeof obAPI);
```

This will show if there's a role or API confusion.
