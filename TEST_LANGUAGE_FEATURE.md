# Language Translation Feature - Testing Guide

## Prerequisites
Before testing, ensure:
1. Database migration has been applied
2. All files are in place
3. Web server is running
4. Database is accessible

## Step-by-Step Testing

### 1. Apply Database Migration

Run the batch file:
```bash
APPLY_LANGUAGE_MIGRATION.bat
```

**Expected Result**: 
- "Migration applied successfully!" message
- `language` column added to `users` table with default value 'en'

**Verification**:
```sql
DESCRIBE users;
SELECT id, username, language FROM users LIMIT 5;
```

### 2. Test Login Page Language Switching

1. Open browser and navigate to: `http://localhost/[your-project]/public/index.html`
2. Look for language selector at top-right corner
3. Click dropdown and select "🇸🇴 Soomaali"

**Expected Result**:
- Page text changes to Somali:
  - "Welcome Back" → "Ku soo dhawoow"
  - "Username" → "Magaca Isticmaalaha"
  - "Password" → "Furaha Sirta ah"
  - "Login" → "Gal"
  - "Police Case Management System" → "Nidaamka Maaraynta Kiisaska Booliska"

4. Refresh the page

**Expected Result**: Language preference is remembered (still shows Somali)

5. Switch back to English

**Expected Result**: All text returns to English

### 3. Test Login with Language Preference

1. Set language to Somali on login page
2. Login with valid credentials (e.g., username: `baare`, password: `password123`)

**Expected Result**:
- Login successful
- Redirected to dashboard
- Language remains Somali

### 4. Test Dashboard Language Switching

1. On dashboard, locate the language button in top-right corner (shows flag and language code)
2. Click the language button

**Expected Result**:
- Dropdown menu appears showing:
  - "Select Language" / "Dooro Luqad"
  - 🇬🇧 English
  - 🇸🇴 Soomaali

3. Click "🇸🇴 Soomaali"

**Expected Result**:
- Success message appears: "Luqadda waa la bedelay" (Language changed successfully)
- Page reloads
- Menu items and buttons change to Somali:
  - "Dashboard" → "Dashboord"
  - "Logout" → "Ka bax"
  - "Change Password" → "Bedel Furaha"

4. Switch back to English

**Expected Result**:
- Success message: "Language changed successfully"
- Page reloads with English text

### 5. Test Language Persistence

1. Switch language to Somali
2. Close browser completely
3. Open browser and navigate to system
4. Login again

**Expected Result**:
- System loads with Somali language
- User's preference is saved in database

**Database Verification**:
```sql
SELECT id, username, language FROM users WHERE username = 'baare';
```
Expected: `language` column shows 'so'

### 6. Test API Endpoints

#### Get Available Languages
```bash
curl http://localhost/[your-project]/language
```

**Expected Response**:
```json
{
  "status": "success",
  "data": [
    {
      "code": "en",
      "name": "English",
      "native_name": "English",
      "flag": "🇬🇧"
    },
    {
      "code": "so",
      "name": "Somali",
      "native_name": "Soomaali",
      "flag": "🇸🇴"
    }
  ]
}
```

#### Get English Translations
```bash
curl http://localhost/[your-project]/language/translations/en
```

**Expected Response**:
```json
{
  "status": "success",
  "data": {
    "language": "en",
    "translations": {
      "welcome": "Welcome",
      "login": "Login",
      ...
    }
  }
}
```

#### Get Somali Translations
```bash
curl http://localhost/[your-project]/language/translations/so
```

**Expected Response**:
```json
{
  "status": "success",
  "data": {
    "language": "so",
    "translations": {
      "welcome": "Soo dhawoow",
      "login": "Gal",
      ...
    }
  }
}
```

### 7. Test Different User Roles

Test with each role to ensure language switching works:

1. **Super Admin** (username: `superadmin`)
2. **Admin** (username: `moha`)
3. **OB Officer** (username: `obuser1`)
4. **Investigator** (username: `baare`)
5. **Court User** (username: `court`)

For each user:
- Login
- Switch to Somali
- Logout
- Login again
- Verify language is still Somali

### 8. Test Multiple Browser Sessions

1. Open two different browsers (e.g., Chrome and Firefox)
2. Login with different users
3. Set different languages for each
4. Verify each session maintains its own language preference

### 9. Test Edge Cases

#### Test 1: Invalid Language Code
Try to load invalid language via browser console:
```javascript
changeLanguage('xx')
```

**Expected Result**: Error message or fallback to English

#### Test 2: No Internet (Offline)
1. Disconnect from internet
2. Try to change language

**Expected Result**: Should use cached translations from localStorage

#### Test 3: Clear Browser Data
1. Switch to Somali
2. Clear localStorage
3. Refresh page

**Expected Result**: Falls back to default (English)

### 10. Visual Testing Checklist

Check these UI elements are properly translated:

**Login Page**:
- [ ] Page title
- [ ] Welcome message
- [ ] System name
- [ ] Feature descriptions
- [ ] Username label and placeholder
- [ ] Password label and placeholder
- [ ] Login button
- [ ] Footer text

**Dashboard**:
- [ ] Language dropdown button
- [ ] Language menu items
- [ ] User dropdown menu
- [ ] Change Password option
- [ ] Logout option
- [ ] Page titles
- [ ] Navigation menu items (when implemented)

## Common Issues and Solutions

### Issue 1: Language not changing
**Solution**: 
- Check browser console for errors
- Verify `language.js` is loaded
- Clear browser cache and try again

### Issue 2: Database error when saving preference
**Solution**:
- Verify migration was applied: `DESCRIBE users;`
- Check if `language` column exists
- Verify user is authenticated

### Issue 3: Page shows translation keys instead of text
**Solution**:
- Check language file exists: `app/Language/so/App.php`
- Verify translation key is defined in language file
- Check for typos in `data-i18n` attribute

### Issue 4: Language resets after refresh
**Solution**:
- Check localStorage is enabled in browser
- Verify API endpoint is saving to database
- Check user authentication is valid

### Issue 5: Mixed languages on page
**Solution**:
- Ensure all text elements have `data-i18n` attributes
- Check if dynamic content is being translated
- Reload page after language change

## Performance Testing

1. **Load Time**: Measure time to load translations
   - Open browser developer tools
   - Go to Network tab
   - Load page and check `/language/translations/{lang}` request time
   - **Expected**: < 500ms

2. **Memory Usage**: Check if translations are cached properly
   - Switch languages multiple times
   - Verify API calls are minimized
   - **Expected**: Translations cached in LanguageManager

3. **Database Impact**: Check if language update affects performance
   - Monitor database queries when changing language
   - **Expected**: Single UPDATE query per language change

## Acceptance Criteria

✅ All acceptance criteria must pass:

1. [ ] Database migration applied successfully
2. [ ] Language column exists in users table
3. [ ] Login page shows language selector
4. [ ] All login page text translates correctly
5. [ ] Dashboard shows language dropdown
6. [ ] Language preference saved to database
7. [ ] Language preference persists after logout/login
8. [ ] Both English and Somali languages work correctly
9. [ ] No JavaScript errors in console
10. [ ] API endpoints respond correctly
11. [ ] Multiple users can have different language preferences
12. [ ] Language changes reflect immediately
13. [ ] Page reloads after language change
14. [ ] Success message shown in correct language
15. [ ] All UI elements properly styled

## Test Report Template

After testing, document results:

```
Date: ___________
Tester: ___________
Browser: ___________
Version: ___________

Test Results:
1. Database Migration: PASS / FAIL
2. Login Page Translation: PASS / FAIL
3. Dashboard Translation: PASS / FAIL
4. Language Persistence: PASS / FAIL
5. API Endpoints: PASS / FAIL
6. Different User Roles: PASS / FAIL
7. Edge Cases: PASS / FAIL
8. Visual Testing: PASS / FAIL

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

## Next Steps After Testing

If all tests pass:
1. Mark feature as complete
2. Train users on language switching
3. Create user documentation
4. Plan for additional language translations

If tests fail:
1. Document specific failures
2. Check LANGUAGE_IMPLEMENTATION_GUIDE.md for troubleshooting
3. Review error logs in `writable/logs/`
4. Fix issues and retest

---

**Note**: This testing guide covers the basic implementation. As you add more UI elements and pages, you'll need to:
- Add `data-i18n` attributes to new elements
- Add translation keys to language files
- Test new pages for proper translation
