# ✅ Report Settings Database Integration - Complete!

## What Was Done

Successfully integrated your existing localStorage-based report settings with the new database system. Now all report settings are stored in the database instead of localStorage.

---

## Changes Made

### 1. **Database Migration Enhanced**
- Added 4 new settings to migration:
  - `statement1` - After case numbers
  - `statement2` - Below statement 1
  - `statement3` - Before report sections
  - `footer_text` - Signature section
- Default values provided for all statements
- Total: 7 settings now created by default

### 2. **Backend Enhanced**
- `ReportSettingsModel.php`:
  - Added methods: `getStatement1()`, `getStatement2()`, `getStatement3()`, `getFooterText()`
  - Added update methods for all statements
  - `getReportSettings()` now returns statements too

- `ReportSettingsController.php`:
  - Added `updateStatements()` endpoint to save all statements at once

- `Routes.php`:
  - Changed from `/api/admin/report-settings` to `/api/report-settings` (accessible to investigators)
  - Added `/update-statements` route

### 3. **Frontend Updated (app.js)**
- `loadCurrentSettings()`:
  - ✅ Now fetches from database API
  - ✅ Falls back to localStorage for backward compatibility
  - ✅ Loads header image from `/uploads/` path
  - ✅ Loads all statements from database

- `uploadHeaderImage()`:
  - ✅ Uploads to server via API
  - ✅ Saves to database
  - ✅ Creates folder `writable/uploads/reports/headers/`

- `removeHeaderImage()`:
  - ✅ Removes from database
  - ✅ Deletes file from server

- `saveReportText()`:
  - ✅ Saves all statements to database
  - ✅ Uses `/api/report-settings/update-statements` endpoint

### 4. **Report Generation Updated (case-report.js)**
- `generateFullReportHTML()`:
  - ✅ Made async
  - ✅ Fetches settings from database before generating
  - ✅ Falls back to localStorage if database fails
  - ✅ Uses database header image path

- `generatePersonCentricReport()`:
  - ✅ Made async to support database fetch
  - ✅ Settings loaded before HTML generation

---

## Database Settings Structure

After running migration, your database will have:

| setting_key | setting_type | Description |
|------------|--------------|-------------|
| `header_image` | image | Full-width banner header (shared) |
| `statement1` | text | Statement after case numbers |
| `statement2` | text | Statement below statement 1 |
| `statement3` | text | Statement before report sections |
| `footer_text` | text | Footer with signature lines |
| `full_report_sections` | json | Sections for comprehensive reports |
| `basic_report_sections` | json | Sections for basic reports |

---

## How It Works Now

### Report Settings Page Flow:
```
User opens "Report Settings"
    ↓
Fetches settings from: /api/report-settings
    ↓
Displays: Header image + Statements
    ↓
User uploads image → POST /api/report-settings/upload-header
    ↓
User edits statements → POST /api/report-settings/update-statements
    ↓
Settings saved to database
```

### Report Generation Flow:
```
User clicks "Generate Full Report"
    ↓
generateFullReportHTML() called (async)
    ↓
Fetches settings from: /api/report-settings
    ↓
Loads: header image, statements, footer text
    ↓
Generates HTML with database settings
    ↓
Opens in new window for printing
```

---

## Migration Steps

### Step 1: Run the Migration
```bash
.\APPLY_REPORT_SETTINGS_MIGRATION.bat
```

Or manually:
```bash
php spark migrate
```

### Step 2: Verify Database
Run this SQL to check:
```sql
SELECT setting_key, setting_type, 
       SUBSTRING(setting_value, 1, 50) as value_preview 
FROM report_settings;
```

You should see 7 records.

### Step 3: Test Existing Settings Page
1. Login as investigator
2. Go to "Report Settings" menu
3. Upload a header image
4. Edit the statements
5. Click "Save Report Text"

### Step 4: Verify It Works
1. Go to any case
2. Click "Generate Full Report"
3. Check that:
   - Header image appears at top
   - Statement 1 appears after case numbers
   - Statement 2 appears below statement 1
   - Statement 3 appears before report content
   - Footer text appears at bottom

---

## Backward Compatibility

The system maintains backward compatibility:

✅ **If database API fails**, it falls back to localStorage
✅ **Existing localStorage data** is not deleted
✅ **No breaking changes** to existing functionality
✅ **Gradual migration** - users won't notice the change

---

## API Endpoints

All accessible to authenticated users:

### Get All Settings
```
GET /api/report-settings
Response: {
  header_image: "reports/headers/header_123.png",
  statement1: "...",
  statement2: "...",
  statement3: "...",
  footer_text: "...",
  full_report_sections: {...},
  basic_report_sections: {...}
}
```

### Upload Header Image
```
POST /api/report-settings/upload-header
Body: FormData with 'header_image' file
Response: {
  status: "success",
  data: {
    image_path: "reports/headers/...",
    image_url: "http://localhost/uploads/..."
  }
}
```

### Update Statements
```
POST /api/report-settings/update-statements
Body: {
  statement1: "...",
  statement2: "...",
  statement3: "...",
  footer_text: "..."
}
Response: {
  status: "success",
  message: "Report statements updated successfully"
}
```

### Update Full Report Sections
```
POST /api/report-settings/update-full-sections
Body: {
  sections: {
    case_overview: {
      title: "...",
      enabled: true,
      order: 1,
      template: "..."
    }
    // ... more sections
  }
}
```

### Update Basic Report Sections
```
POST /api/report-settings/update-basic-sections
Body: { sections: {...} }
```

---

## File Structure

### Uploaded Files Location:
```
writable/uploads/reports/headers/
  ├── report_header_1736522400.png
  ├── report_header_1736523000.jpg
  └── ...
```

### Database Records:
```
report_settings table:
  - header_image: "reports/headers/report_header_1736522400.png"
  - statements stored as text
  - sections stored as JSON
```

---

## Key Improvements

### Before (localStorage):
- ❌ Settings lost when clearing browser cache
- ❌ Each investigator had their own settings
- ❌ No central management
- ❌ No audit trail
- ❌ Images stored as base64 (large)

### After (Database):
- ✅ Settings persist across browsers
- ✅ Shared settings for all investigators
- ✅ Can be managed centrally
- ✅ Full audit trail (created_by, updated_by)
- ✅ Images stored as files (efficient)
- ✅ Can have center-specific settings
- ✅ Full and basic reports can have different sections

---

## Testing Checklist

- [ ] Migration runs successfully
- [ ] 7 settings records created
- [ ] Report Settings page loads
- [ ] Can upload header image
- [ ] Header image appears in preview
- [ ] Can edit all statements
- [ ] Statements save successfully
- [ ] Can generate full report
- [ ] Header image appears in report
- [ ] All statements appear in report
- [ ] Footer text appears in report
- [ ] Can remove header image

---

## Troubleshooting

### Issue: Settings not loading
**Check:**
1. Migration ran: `SELECT * FROM report_settings;`
2. API route works: Visit `/api/report-settings` in browser
3. Browser console for errors

### Issue: Header image not uploading
**Check:**
1. Folder exists: `writable/uploads/reports/headers/`
2. Folder permissions: Should be writable
3. File size under 2MB
4. Valid image format (JPG, PNG, GIF)

### Issue: Report still uses localStorage
**Solution:**
- Clear browser cache
- Hard refresh the page (Ctrl+F5)
- Check browser console for API errors

---

## Next Steps (Optional)

You can now:

1. **Migrate Old Data**:
   - Export localStorage data
   - Import into database via API

2. **Add More Settings**:
   - Agency logo
   - Report colors/themes
   - Default report language
   - Email templates

3. **Center-Specific Settings**:
   - Different headers per police center
   - Different statements per center

4. **Advanced Section Management**:
   - Use the new section system
   - Customize full vs basic report sections
   - Add/remove sections dynamically

---

## Summary

✅ **Existing report settings page** now uses database
✅ **All functionality preserved** - no breaking changes
✅ **Backward compatible** with localStorage
✅ **Ready to use** - just run the migration!

Your investigators can continue using the Report Settings page exactly as before, but now everything is stored in the database for better persistence and management.

---

## Files Modified

1. `database/migrations/2026-01-10-125200_CreateReportSettings.php` - Added statements
2. `app/Models/ReportSettingsModel.php` - Added statement methods
3. `app/Controllers/Admin/ReportSettingsController.php` - Added updateStatements()
4. `app/Config/Routes.php` - Changed route path, added statements route
5. `public/assets/js/app.js` - Updated all functions to use database API
6. `public/assets/js/case-report.js` - Updated report generation to fetch from database

---

**Ready to test? Run the migration and try it out!** 🚀
