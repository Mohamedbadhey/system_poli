# Report Settings Feature - Implementation Complete ✅

## Overview
Successfully implemented a comprehensive Report Settings system that allows administrators to configure:
- **Shared Header Image** for all reports
- **Different Text Sections** for Full Reports and Basic Reports

---

## What Was Implemented

### 1. Database Layer
**File**: `database/migrations/2026-01-10-125200_CreateReportSettings.php`

- Created `report_settings` table with fields:
  - `id`, `center_id` (optional - for center-specific settings)
  - `setting_key` (header_image, full_report_sections, basic_report_sections)
  - `setting_value` (JSON or text)
  - `setting_type` (text, json, image, file)
  - Audit fields: `created_by`, `updated_by`, timestamps

- **Default Settings** automatically created:
  - Header image setting (shared by all reports)
  - Full report sections (6 sections):
    - Case Overview
    - Parties Involved
    - Evidence Summary
    - Investigation Details
    - Investigator Conclusions
    - Recommendations
  - Basic report sections (3 sections):
    - Case Overview
    - Summary
    - Conclusion

### 2. Model Layer
**File**: `app/Models/ReportSettingsModel.php`

Key methods:
- `getSetting($key, $centerId)` - Get specific setting
- `getReportSettings($centerId)` - Get all report settings
- `updateHeaderImage($path, $centerId, $userId)` - Update header image
- `updateFullReportSections($sections, $centerId, $userId)` - Update full report sections
- `updateBasicReportSections($sections, $centerId, $userId)` - Update basic report sections

### 3. Controller Layer
**File**: `app/Controllers/Admin/ReportSettingsController.php`

API Endpoints:
- `GET /api/admin/report-settings` - Get all settings
- `GET /api/admin/report-settings/show/{key}` - Get specific setting
- `GET /api/admin/report-settings/header-image` - Get header image
- `POST /api/admin/report-settings/upload-header` - Upload header image
- `POST /api/admin/report-settings/update-full-sections` - Update full report sections
- `POST /api/admin/report-settings/update-basic-sections` - Update basic report sections

### 4. PDF Generator Integration
**File**: `app/Libraries/PDFGenerator.php`

Enhanced features:
- Automatically loads report settings from database
- Displays header image on all reports (if configured)
- Determines report type (full vs basic) and loads appropriate sections
- Dynamically builds sections with:
  - Custom titles and order
  - Template text for guidance
  - Auto-populated data from database (parties, evidence, notes, conclusions)
- Section-specific content builders:
  - `buildCaseOverviewSection()` - Case details table
  - `buildPartiesSection()` - Accusers, accused, witnesses
  - `buildEvidenceSection()` - Evidence list with custody info
  - `buildInvestigationDetailsSection()` - Investigation notes timeline
  - `buildConclusionsSection()` - Investigator conclusions
  - And more...

### 5. Frontend Interface
**File**: `public/assets/pages/report-settings.html`

Features:
- **Three-tab interface**:
  1. Header Image - Upload/remove shared header
  2. Full Report Sections - Configure comprehensive report sections
  3. Basic Report Sections - Configure basic report sections

- **Section Management**:
  - Add/remove sections
  - Enable/disable sections
  - Reorder sections (order field)
  - Edit section titles
  - Add template text for each section
  - Drag-and-drop support (handle included)

### 6. Routes Configuration
**File**: `app/Config/Routes.php`

Added route group for report settings API endpoints.

---

## How It Works

### Report Generation Flow

1. **When generating a report PDF**:
   ```
   User → ReportPDFController → PDFGenerator
   ```

2. **PDFGenerator loads settings**:
   ```php
   $reportSettings = $this->settingsModel->getReportSettings($centerId);
   ```

3. **Determines report type**:
   - Full Reports: `final`, `court_submission`, `prosecution_summary`, `supplementary`
   - Basic Reports: `preliminary`, `interim`, `evidence_analysis`, etc.

4. **Builds sections dynamically**:
   - Loads configured sections from settings
   - Sorts by order
   - Skips disabled sections
   - Renders template text + auto-populated data

5. **Adds header image**:
   - Shared across all report types
   - Displayed at top of report

---

## Section Configuration Structure

Each section is stored as JSON:
```json
{
  "case_overview": {
    "title": "Case Overview",
    "enabled": true,
    "order": 1,
    "template": "This section provides case details..."
  },
  "parties_involved": {
    "title": "Parties Involved",
    "enabled": true,
    "order": 2,
    "template": "Information about all parties..."
  }
}
```

---

## Usage Instructions

### Step 1: Run Migration
```bash
.\APPLY_REPORT_SETTINGS_MIGRATION.bat
```
Or manually:
```bash
php spark migrate
```

### Step 2: Access Settings Page
Navigate to: `/assets/pages/report-settings.html`

Or add a menu link in your admin dashboard.

### Step 3: Configure Settings

#### Upload Header Image:
1. Go to "Header Image" tab
2. Choose an image file (JPG, PNG, GIF)
3. Click "Upload Header Image"
4. Image will appear on all generated reports

#### Configure Full Report Sections:
1. Go to "Full Report Sections" tab
2. Edit existing sections or add new ones
3. Set titles, order, and template text
4. Enable/disable sections as needed
5. Click "Save Full Report Sections"

#### Configure Basic Report Sections:
1. Go to "Basic Report Sections" tab
2. Edit existing sections or add new ones
3. Set titles, order, and template text
4. Enable/disable sections as needed
5. Click "Save Basic Report Sections"

### Step 4: Generate Reports
When you generate any report, it will automatically:
- Show the header image (if configured)
- Include the appropriate sections (full or basic)
- Display template text + auto-populated data

---

## Database Schema

### report_settings Table
```sql
CREATE TABLE `report_settings` (
  `id` INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `center_id` INT(11) UNSIGNED NULL,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NULL,
  `setting_type` ENUM('text', 'json', 'image', 'file') DEFAULT 'text',
  `description` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_by` INT(11) UNSIGNED NULL,
  `updated_by` INT(11) UNSIGNED NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  FOREIGN KEY (`center_id`) REFERENCES `police_centers`(`id`) ON DELETE CASCADE ON UPDATE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE SET NULL,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE SET NULL
);
```

---

## Example Report Output

### Full Report Structure:
```
[Header Image]
POLICE CASE MANAGEMENT SYSTEM
Final Investigation Report

Case Information Box
├─ Case Number
├─ OB Number
├─ Crime Type
└─ Report Date

══════════════════════════════════

CASE OVERVIEW
[Template text + Case details table]

PARTIES INVOLVED
[Template text + Parties table with names, roles, contacts]

EVIDENCE SUMMARY
[Template text + Evidence table with items, types, status]

INVESTIGATION DETAILS
[Template text + Investigation notes timeline]

INVESTIGATOR CONCLUSIONS
[Template text + Conclusions with titles and findings]

RECOMMENDATIONS
[Template text + Recommended actions]

══════════════════════════════════

Signature Block
[Digital signature or manual signature lines]

Footer
[Generated timestamp, document ID]
```

### Basic Report Structure:
```
[Header Image]
POLICE CASE MANAGEMENT SYSTEM
Preliminary Investigation Report

Case Information Box

══════════════════════════════════

CASE OVERVIEW
[Brief case details]

SUMMARY
[Investigation summary]

CONCLUSION
[Brief conclusion]

══════════════════════════════════

Signature Block
Footer
```

---

## Key Features

✅ **Shared Header Image** - One logo for all reports
✅ **Different Sections** - Full reports have detailed sections, basic reports are concise
✅ **Customizable** - Add, remove, reorder, enable/disable sections
✅ **Template Text** - Provide guidance text for each section
✅ **Auto-Population** - Sections automatically filled with case data
✅ **Center-Specific** - Can override settings per police center
✅ **Audit Trail** - Tracks who created/updated settings

---

## API Testing Examples

### Get All Settings:
```bash
curl -X GET http://localhost/api/admin/report-settings
```

### Upload Header Image:
```bash
curl -X POST http://localhost/api/admin/report-settings/upload-header \
  -F "header_image=@logo.png"
```

### Update Full Report Sections:
```bash
curl -X POST http://localhost/api/admin/report-settings/update-full-sections \
  -H "Content-Type: application/json" \
  -d '{
    "sections": {
      "case_overview": {
        "title": "Case Overview",
        "enabled": true,
        "order": 1,
        "template": "Comprehensive case details..."
      }
    }
  }'
```

---

## Future Enhancements (Optional)

1. **Rich Text Editor** for template text
2. **Preview functionality** to see reports before saving
3. **Section templates library** with pre-built sections
4. **Export/import settings** between centers
5. **Version history** for settings changes
6. **Role-based permissions** for who can edit settings

---

## Files Created/Modified

### Created:
- `database/migrations/2026-01-10-125200_CreateReportSettings.php`
- `app/Models/ReportSettingsModel.php`
- `app/Controllers/Admin/ReportSettingsController.php`
- `public/assets/pages/report-settings.html`
- `APPLY_REPORT_SETTINGS_MIGRATION.bat`
- `REPORT_SETTINGS_IMPLEMENTATION.md` (this file)

### Modified:
- `app/Libraries/PDFGenerator.php` (added settings integration)
- `app/Config/Routes.php` (added report settings routes)

---

## Troubleshooting

### Issue: Header image not showing
**Solution**: Check that:
1. Image was uploaded successfully
2. File exists in `writable/uploads/reports/headers/`
3. Path is correct in database

### Issue: Sections not appearing
**Solution**: Check that:
1. Sections are enabled in settings
2. Migration was run successfully
3. Settings were saved properly

### Issue: API endpoints not working
**Solution**: Check that:
1. Routes were added to Routes.php
2. Auth filter is working
3. User has admin permissions

---

## Summary

You now have a fully functional Report Settings system where:
- **Header image is shared** by both full and basic reports
- **Text sections are different** for full and basic reports
- **Admins can customize** all aspects through a user-friendly interface
- **Reports are dynamically generated** based on the configured settings

The system is production-ready and can be extended as needed!
