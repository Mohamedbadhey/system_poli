# 📄 PDF Full Reports with QR Codes - Complete Guide

## ✅ What's Implemented

A complete system for generating **static PDF reports** from full case reports, with automatic replacement of old PDFs and QR code generation.

---

## 🎯 Features

### **✅ PDF Generation**
- Converts HTML report → PDF
- Saves to server as static file
- **Replaces old PDF** if generating again (same case + language)

### **✅ Static URLs**
- PDF URL: `/uploads/reports/full-reports/full-report-CASE-001-en.pdf`
- **Never changes** - it's a snapshot
- **Anyone can access** - no authentication

### **✅ QR Code Ready**
- QR code points directly to PDF URL
- Scan → Opens PDF instantly
- Perfect for printing on reports

---

## 🚀 Setup (3 Steps)

### **Step 1: Install mPDF Library**

Run this command:
```bash
INSTALL_PDF_LIBRARY.bat
```

Or manually:
```bash
composer require mpdf/mpdf
```

### **Step 2: Create Database Table**

Run this command:
```bash
APPLY_SAVED_REPORTS_MIGRATION.bat
```

Or manually:
```bash
mysql -u root -p pcms_db < app/Database/saved_full_reports_migration.sql
```

### **Step 3: Create Upload Directory**

```bash
mkdir public/uploads/reports/full-reports
```

Or it will be created automatically on first PDF generation.

---

## 📱 How It Works

### **Complete Flow:**

1. **User clicks "Full Report"** in case details
2. **Selects language** (English/Somali)
3. **Clicks "View Full Report"**
4. **Frontend:**
   - Generates HTML from case data
   - Sends HTML to: `POST /investigation/full-report-pdf`
5. **Backend:**
   - Checks if PDF exists: `full-report-CASE-001-en.pdf`
   - **Deletes old PDF** if found
   - Converts HTML → PDF using mPDF
   - Saves new PDF to: `/uploads/reports/full-reports/`
   - Saves metadata to database
   - Returns PDF URL
6. **Frontend:**
   - Opens PDF in new tab
   - Shows success message with filename
7. **QR Code:**
   - Points directly to PDF URL
   - Anyone can scan and view

---

## 🔗 URL Format

### **PDF URL:**
```
http://localhost:8080/uploads/reports/full-reports/full-report-CASE-001-en.pdf
```

### **Filename Pattern:**
```
full-report-{CASE_NUMBER}-{LANGUAGE}.pdf
```

Examples:
- `full-report-CASE-001-en.pdf` (English)
- `full-report-CASE-001-so.pdf` (Somali)
- `full-report-INV-2024-001-en.pdf`

---

## 📊 Database Structure

### **Table: saved_full_reports**

```sql
- id (Primary Key)
- case_id (Link to cases table)
- case_number (e.g., CASE-001)
- report_title (e.g., Full Report - CASE-001)
- report_language (en or so)
- report_html (NULL - not saved for PDF reports)
- pdf_filename (e.g., full-report-CASE-001-en.pdf)
- pdf_url (e.g., /uploads/reports/full-reports/full-report-CASE-001-en.pdf)
- verification_code (e.g., REPORT-1737064123-ABC123)
- qr_code (Full PDF URL)
- generated_by (User ID)
- created_at (Timestamp)
- last_accessed (Last view timestamp)
- access_count (Number of times accessed)
```

---

## 🎯 Key Behaviors

### **1. PDF Replacement**
When generating PDF for same case + language:
- ✅ **Deletes old PDF file** from disk
- ✅ **Updates database record** (or creates new if none exists)
- ✅ **New PDF overwrites old one**
- ✅ **Same filename** used

Example:
```
Day 1: Generate PDF → full-report-CASE-001-en.pdf (v1)
Day 2: Generate again → full-report-CASE-001-en.pdf (v2, old deleted)
```

### **2. Language-Specific PDFs**
Each language gets its own PDF:
```
full-report-CASE-001-en.pdf  (English version)
full-report-CASE-001-so.pdf  (Somali version)
```

Both can exist simultaneously!

### **3. Static Snapshot**
- PDF is frozen at generation time
- **Won't update** if case data changes
- To update: Regenerate the PDF (which replaces old one)

---

## 🧪 Testing

### **Test PDF Generation:**

1. **Login** to system
2. **Open any case**
3. **Click "Full Report"**
4. **Select language** (EN or SO)
5. **Click "View Full Report (Printable)"**
6. **Wait** - shows "Generating PDF report..."
7. **PDF opens** in new tab
8. **Check console:**
   ```
   ✓ PDF generated successfully
   Filename: full-report-CASE-001-en.pdf
   PDF URL: http://localhost:8080/uploads/reports/full-reports/full-report-CASE-001-en.pdf
   ```
9. **Copy PDF URL** and test in incognito (no login needed!)

### **Test PDF Replacement:**

1. **Generate PDF** for CASE-001 (English)
2. **Note the filename**: `full-report-CASE-001-en.pdf`
3. **Generate again** for same case
4. **Check folder**: `/public/uploads/reports/full-reports/`
5. **Should see**: Only ONE PDF (old deleted, new created)

### **Test QR Code:**

1. **Generate PDF**
2. **Get PDF URL** from console or database
3. **Create QR code** with that URL
4. **Scan QR code** → PDF opens instantly!

---

## 📂 File Structure

```
public/
└── uploads/
    └── reports/
        └── full-reports/
            ├── full-report-CASE-001-en.pdf
            ├── full-report-CASE-001-so.pdf
            ├── full-report-CASE-002-en.pdf
            └── ...
```

---

## 🔍 Database Queries

### **View all PDF reports:**
```sql
SELECT 
  id,
  case_number,
  report_language,
  pdf_filename,
  pdf_url,
  created_at,
  access_count
FROM saved_full_reports
ORDER BY created_at DESC;
```

### **Get PDF URL for a case:**
```sql
SELECT 
  case_number,
  report_language,
  CONCAT('http://localhost:8080', pdf_url) as full_pdf_url
FROM saved_full_reports
WHERE case_id = 123;
```

### **Find latest PDF for each case:**
```sql
SELECT 
  case_id,
  case_number,
  report_language,
  pdf_url,
  MAX(created_at) as generated_date
FROM saved_full_reports
GROUP BY case_id, report_language;
```

---

## ⚙️ API Endpoints

### **Generate PDF (Protected):**
```
POST /investigation/full-report-pdf
Authorization: Bearer {token}

Body:
{
  "case_id": 123,
  "case_number": "CASE-001",
  "report_title": "Full Report - CASE-001",
  "report_language": "en",
  "report_html": "<html>...</html>"
}

Response:
{
  "status": "success",
  "message": "PDF generated successfully",
  "data": {
    "id": 1,
    "pdf_url": "http://localhost:8080/uploads/reports/full-reports/full-report-CASE-001-en.pdf",
    "qr_code": "http://localhost:8080/uploads/reports/full-reports/full-report-CASE-001-en.pdf",
    "filename": "full-report-CASE-001-en.pdf",
    "verification_code": "REPORT-1737064123-ABC123"
  }
}
```

### **Get PDFs by Case (Protected):**
```
GET /investigation/full-report-pdf/case/123

Response:
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "case_number": "CASE-001",
      "report_language": "en",
      "pdf_filename": "full-report-CASE-001-en.pdf",
      "pdf_url": "/uploads/reports/full-reports/full-report-CASE-001-en.pdf",
      "pdf_full_url": "http://localhost:8080/uploads/reports/full-reports/full-report-CASE-001-en.pdf",
      "access_count": 5,
      "created_at": "2026-01-16 12:34:56"
    }
  ]
}
```

---

## ✨ Benefits

### **✅ Static Snapshots**
- PDF never changes once generated
- Perfect for archival
- Legal/court-ready documents

### **✅ No Dynamic Data Issues**
- Doesn't matter if case is updated
- PDF remains as-is
- To update: Just regenerate

### **✅ Automatic Replacement**
- No duplicate files
- Always get latest version
- Old PDF automatically deleted

### **✅ Easy Sharing**
- Direct PDF link
- QR code friendly
- No authentication needed

### **✅ Professional Output**
- Proper PDF format
- Printable
- Shareable with courts, lawyers, etc.

---

## 🎉 Result

Now when you generate a Full Report:

✅ **Converts to PDF** (not HTML)  
✅ **Saves to server** with permanent URL  
✅ **Replaces old PDF** if exists  
✅ **QR code points to PDF**  
✅ **Anyone can access** without login  
✅ **Static snapshot** of that moment  
✅ **Professional** and **printable**  

---

## 🚀 Ready to Use!

1. Run: `INSTALL_PDF_LIBRARY.bat`
2. Run: `APPLY_SAVED_REPORTS_MIGRATION.bat`
3. Test: Generate a full report
4. Share: Use the PDF URL or QR code!

**Your PDF report system is ready! 🎉**
