# Quick Start Guide - Report Settings Feature

## 🎯 What This Feature Does

Your case reports now have:
- ✅ **One shared header image** for all reports (full and basic)
- ✅ **Different text sections** for full reports vs basic reports
- ✅ **Easy configuration** through admin interface

---

## 📋 Setup Steps

### Step 1: Run the Migration

**Option A - Using Batch File:**
```
.\APPLY_REPORT_SETTINGS_MIGRATION.bat
```

**Option B - Using Command Line:**
```
php spark migrate
```

This will:
- Create the `report_settings` table
- Insert default configurations for full and basic reports
- Set up 6 sections for full reports
- Set up 3 sections for basic reports

### Step 2: Verify Installation

Check if the table was created:
```sql
-- Run in your database
SHOW TABLES LIKE 'report_settings';
SELECT * FROM report_settings;
```

You should see 3 records:
1. `header_image` - Shared header for all reports
2. `full_report_sections` - Sections for full reports
3. `basic_report_sections` - Sections for basic reports

### Step 3: Access Settings Page

Navigate to:
```
http://localhost/assets/pages/report-settings.html
```

Or add a link in your admin menu:
```html
<a href="/assets/pages/report-settings.html">
    <i class="fas fa-cog"></i> Report Settings
</a>
```

---

## 🎨 Using the Settings Interface

### Tab 1: Header Image
1. Click "Choose File" and select your logo (PNG, JPG, or GIF)
2. Click "Upload Header Image"
3. The image will appear on **ALL** reports (both full and basic)

**Recommended Size:** 200x100 pixels

### Tab 2: Full Report Sections
Configure sections for comprehensive reports (final, court submission, etc.)

**Default Sections:**
- Case Overview
- Parties Involved
- Evidence Summary
- Investigation Details
- Investigator Conclusions
- Recommendations

**You can:**
- ✏️ Edit section titles
- 🔢 Change order (1, 2, 3...)
- 📝 Add template text (guidance for investigators)
- 👁️ Enable/disable sections
- ➕ Add new custom sections
- 🗑️ Delete sections

### Tab 3: Basic Report Sections
Configure sections for simple reports (preliminary, interim, etc.)

**Default Sections:**
- Case Overview
- Summary
- Conclusion

**Same editing capabilities** as full reports.

---

## 🔄 How It Works

### When You Generate a Report:

1. **System determines report type:**
   - Full Reports: `final`, `court_submission`, `prosecution_summary`, `supplementary`
   - Basic Reports: `preliminary`, `interim`, `evidence_analysis`, etc.

2. **Loads appropriate sections** from database

3. **Builds PDF with:**
   - Header image (if uploaded)
   - Case information box
   - Configured sections (in order)
   - Auto-populated data from your case
   - Signature blocks

### Section Content:
Each section shows:
- **Section title** (from settings)
- **Template text** (guidance you wrote)
- **Auto-populated data** (from database):
  - Case details
  - Parties/witnesses
  - Evidence lists
  - Investigation notes
  - Conclusions

---

## 📊 Section Types & Auto-Population

### Full Report Sections:

| Section Key | Auto-Populated Data |
|------------|-------------------|
| `case_overview` | Case number, OB number, crime type, incident date, location, priority |
| `parties_involved` | Table of accusers, accused, witnesses with names, IDs, contacts |
| `evidence_summary` | Table of all evidence with numbers, types, collection dates |
| `investigation_details` | Timeline of all investigation notes |
| `investigator_conclusions` | All conclusions with titles and findings |
| `recommendations` | Any recommendations added to report |

### Basic Report Sections:

| Section Key | Auto-Populated Data |
|------------|-------------------|
| `case_overview` | Brief case details table |
| `summary` | Case description |
| `conclusion` | Brief conclusion text |

---

## 🛠️ API Endpoints

If you want to integrate programmatically:

### Get All Settings:
```javascript
fetch('/api/admin/report-settings')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Upload Header Image:
```javascript
const formData = new FormData();
formData.append('header_image', fileInput.files[0]);

fetch('/api/admin/report-settings/upload-header', {
  method: 'POST',
  body: formData
})
```

### Update Full Report Sections:
```javascript
fetch('/api/admin/report-settings/update-full-sections', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    sections: {
      case_overview: {
        title: "Case Overview",
        enabled: true,
        order: 1,
        template: "Your template text here..."
      }
      // ... more sections
    }
  })
})
```

### Update Basic Report Sections:
```javascript
fetch('/api/admin/report-settings/update-basic-sections', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    sections: { /* same structure */ }
  })
})
```

---

## 📝 Example Report Output

### Full Report (with all sections):
```
[YOUR LOGO HERE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POLICE CASE MANAGEMENT SYSTEM
Final Investigation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔══════════════════════════════════════╗
║ Case Information                     ║
╠══════════════════════════════════════╣
║ Case Number: CS-2026-001             ║
║ OB Number: OB/123/2026               ║
║ Crime Type: Robbery                  ║
╚══════════════════════════════════════╝

CASE OVERVIEW
─────────────────────────────────────────
[Template text you configured]

[Table with case details]

PARTIES INVOLVED
─────────────────────────────────────────
[Template text you configured]

[Table with accusers, accused, witnesses]

EVIDENCE SUMMARY
─────────────────────────────────────────
[Template text you configured]

[Table with all evidence items]

... and so on for all enabled sections
```

### Basic Report (simplified):
```
[YOUR LOGO HERE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POLICE CASE MANAGEMENT SYSTEM
Preliminary Investigation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔══════════════════════════════════════╗
║ Case Information                     ║
╚══════════════════════════════════════╝

CASE OVERVIEW
─────────────────────────────────────────
[Brief case details]

SUMMARY
─────────────────────────────────────────
[Investigation summary]

CONCLUSION
─────────────────────────────────────────
[Brief conclusion]
```

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] Migration ran successfully
- [ ] `report_settings` table exists in database
- [ ] 3 default settings exist in the table
- [ ] Settings page loads at `/assets/pages/report-settings.html`
- [ ] Can upload header image
- [ ] Can edit full report sections
- [ ] Can edit basic report sections
- [ ] Changes save successfully
- [ ] Generated reports show header image
- [ ] Generated reports show correct sections

---

## 🚨 Troubleshooting

### Problem: Settings page shows blank
**Solution:** Check browser console for errors. Ensure API routes are accessible.

### Problem: Header image not showing in reports
**Solution:** 
1. Check image was uploaded to `writable/uploads/reports/headers/`
2. Verify file path in database
3. Check file permissions

### Problem: Sections not appearing in reports
**Solution:**
1. Ensure sections are enabled in settings
2. Check that settings were saved
3. Verify report type matches (full vs basic)

### Problem: API endpoints return 404
**Solution:**
1. Check Routes.php has report settings routes
2. Clear route cache: `php spark cache:clear`
3. Restart server

---

## 🎓 Tips & Best Practices

1. **Header Image:**
   - Use transparent PNG for best results
   - Keep file size under 1MB
   - Use official police logo/seal

2. **Section Ordering:**
   - Start with overview (order 1)
   - End with conclusions/recommendations
   - Keep logical flow

3. **Template Text:**
   - Provide clear guidance for investigators
   - Include what should be documented
   - Keep it concise but informative

4. **Custom Sections:**
   - Add sections specific to your needs
   - Use clear, descriptive titles
   - Set appropriate order

5. **Enabling/Disabling:**
   - Disable sections you don't need
   - Don't delete - just disable for flexibility
   - Re-enable when needed

---

## 📚 Related Documentation

- Full implementation details: `REPORT_SETTINGS_IMPLEMENTATION.md`
- Reports system: `REPORTS_SYSTEM_IMPLEMENTATION.md`
- PDF generation: Check `app/Libraries/PDFGenerator.php`

---

## ✅ Summary

You now have a powerful report configuration system:
- **Shared header** = Professional branding on all reports
- **Different sections** = Appropriate detail level for each report type
- **Easy management** = No code changes needed
- **Flexible** = Add, remove, reorder sections anytime

**Next Steps:**
1. Run the migration
2. Upload your logo
3. Customize the sections
4. Generate a report to see the results!

Enjoy your enhanced reporting system! 🎉
