# Daily Operations Dashboard - Quick Testing Guide

## 🚀 Start Testing in 3 Steps

### Step 1: Access the Dashboard
1. Open browser: `http://localhost:8080/dashboard.html`
2. Login as **Admin** or **Super Admin**
3. Click **"Daily Operations Dashboard"** (📊 icon at top of menu)

### Step 2: Explore Features

#### A. View Today's Operations
- Dashboard loads with today's data automatically
- See 6 statistics cards showing counts
- Scroll down to see detailed tables

#### B. Change Time Period
- Click dropdown next to statistics (default: "Today")
- Select: **This Week**, **This Month**, or **This Year**
- Dashboard automatically refreshes

#### C. Use Advanced Filters
- Click **"Advanced Filters"** button (gray button with filter icon)
- Filter panel slides down
- Select filters:
  - **Police Center**: Choose a specific station
  - **Crime Category**: Select type (Violent, Property, Drug, etc.)
  - **Priority**: Choose level (Low, Medium, High, Critical)
- Click **"Apply Filters"**
- Dashboard shows only filtered data
- Click **"Clear Filters"** to reset

#### D. Export to PDF
- Click **"Export PDF"** button (red button with PDF icon)
- Wait for "PDF generated successfully" toast
- PDF opens in new tab automatically
- Check the professional layout with all sections

#### E. Export to Excel
- Click **"Export Excel"** button (green button with Excel icon)
- Wait for "Excel generated successfully" toast
- Excel file opens/downloads
- Open in Excel/LibreOffice to see 7 worksheets

#### F. Print Report
- Click **"Print Report"** button (blue button with printer icon)
- Browser print dialog opens
- **Print Preview shows**:
  - No navigation/buttons (hidden)
  - Professional layout
  - Statistics in 3-column grid
  - All tables formatted for print
- Print to PDF or paper

### Step 3: Verify Output

#### Check PDF Report:
```
✓ Header: "Daily Operations Report"
✓ Date and period shown
✓ Statistics summary (6 cards)
✓ Cases Submitted table
✓ Cases Assigned table
✓ Cases Closed table
✓ Current Custody table
✓ Certificates Issued table
✓ Medical Forms table
✓ Footer with timestamp
✓ Professional colors and formatting
```

#### Check Excel Workbook:
```
✓ Sheet 1: Summary (statistics overview)
✓ Sheet 2: Cases Submitted
✓ Sheet 3: Cases Assigned
✓ Sheet 4: Cases Closed
✓ Sheet 5: Current Custody
✓ Sheet 6: Certificates
✓ Sheet 7: Medical Forms
✓ Blue headers with white text
✓ Borders on all cells
✓ Auto-sized columns
```

#### Check Print Preview:
```
✓ Navigation hidden
✓ Buttons hidden
✓ Charts hidden (don't print well)
✓ Statistics grid: 3 columns
✓ Tables: Readable size (8-9pt)
✓ Colors preserved
✓ Page breaks logical
✓ Professional appearance
```

---

## 🎯 Quick Feature Demo

### Scenario 1: Morning Operations Review
```
1. Login as Admin
2. View today's dashboard
3. Check statistics at a glance
4. Print report for meeting
5. Done in 30 seconds!
```

### Scenario 2: Weekly Report for Supervisor
```
1. Change period to "This Week"
2. Click "Export PDF"
3. Email PDF to supervisor
4. Done!
```

### Scenario 3: Analyze Specific Center
```
1. Click "Advanced Filters"
2. Select Police Center: "Kismayo Station"
3. Apply filters
4. Export to Excel for detailed analysis
5. Done!
```

### Scenario 4: High Priority Cases Only
```
1. Click "Advanced Filters"
2. Select Priority: "Critical"
3. Apply filters
4. See only critical cases
5. Print for urgent review meeting
```

---

## 📊 What Each Section Shows

### Cases Submitted
- All new cases created during the period
- Shows: Case number, OB number, crime type, priority, center, creator, timestamp
- Color-coded priority badges (Low=Green, Medium=Blue, High=Orange, Critical=Red)

### Cases Assigned
- Cases assigned to investigators during the period
- Shows: Case number, crime type, investigator name, assigned by, deadline
- Helps track workload distribution

### Cases Closed
- Cases completed/closed during the period
- Shows: Case number, crime type, who closed it, closure reason
- Helps measure productivity

### Current Custody
- People currently in detention (regardless of period)
- Shows: Person name, national ID, case number, location, custody start date
- Real-time snapshot of detention facility

### Certificates Issued
- Non-criminal certificates issued during the period
- Shows: Certificate number, person name, purpose, issue date, issued by
- Tracks administrative services

### Medical Forms Issued
- Medical examination forms created during the period
- Shows: Case number, patient name, hospital, examination date
- Tracks medical evidence collection

---

## 🌐 Language Switching

### Test Both Languages:
1. Click language selector (EN/SO flag)
2. Switch to Somali
3. Verify all UI elements translated:
   - Button labels
   - Section titles
   - Table headers
   - Filter labels
   - Toast messages
4. Export PDF/Excel in Somali
5. Verify translations in exported files

---

## 🔍 What to Look For (Quality Check)

### Dashboard Display:
- ✅ Clean, professional layout
- ✅ Statistics cards with gradients
- ✅ Interactive charts (Chart.js)
- ✅ Responsive tables
- ✅ No console errors
- ✅ Fast loading (< 2 seconds)

### PDF Export:
- ✅ Professional appearance
- ✅ Correct data
- ✅ All sections present
- ✅ Readable fonts
- ✅ Good page breaks
- ✅ File size reasonable (< 5MB)

### Excel Export:
- ✅ Multiple worksheets
- ✅ Professional formatting
- ✅ All data accurate
- ✅ Auto-sized columns
- ✅ Opens without errors
- ✅ Can edit/analyze data

### Print Template:
- ✅ No unwanted elements
- ✅ Fits on standard paper
- ✅ Readable when printed
- ✅ Colors print correctly
- ✅ Professional appearance

### Filters:
- ✅ Panel toggles smoothly
- ✅ Dropdowns populated correctly
- ✅ Filters apply instantly
- ✅ Clear filters works
- ✅ URL updates with filters
- ✅ Filters persist on refresh

---

## 🐛 Common Issues & Solutions

### Issue: "Error loading data"
**Solution**: Check if server is running (`php spark serve`)

### Issue: "Export feature coming soon" message
**Solution**: Dependencies not installed. Run `composer update`

### Issue: PDF opens blank
**Solution**: Check `writable/cache` folder has write permissions

### Issue: Excel file corrupted
**Solution**: Update PhpSpreadsheet: `composer require phpoffice/phpspreadsheet`

### Issue: Filters not working
**Solution**: Clear browser cache, refresh page

### Issue: Print shows navigation
**Solution**: Use Print Preview (Ctrl+P), not screenshot

---

## 📱 Browser Compatibility

### Tested & Working:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (responsive)

### Print Features:
- ✅ Chrome: Full support
- ✅ Firefox: Full support
- ✅ Safari: Partial (colors may differ)
- ✅ Edge: Full support

---

## 📂 Generated Files Location

All exported files are saved in:
```
public/uploads/reports/daily-operations/
```

Filename pattern:
```
daily-operations-[DATE]-[PERIOD].[pdf/xlsx]

Examples:
- daily-operations-2026-01-19-today.pdf
- daily-operations-2026-01-19-week.xlsx
- daily-operations-2026-01-19-month.pdf
```

---

## ✨ Pro Tips

1. **Use filters before exporting** - Export only relevant data
2. **Export Excel for analysis** - Use formulas, charts in Excel
3. **Export PDF for distribution** - Email, print, archive
4. **Print for meetings** - Quick physical copies
5. **Check "This Month"** - Monthly reports for management
6. **Use "This Week"** - Weekly team reviews
7. **Filter by center** - Review specific station performance
8. **Filter by priority** - Focus on critical/high priority cases

---

## 🎓 Training Users

### For Station Admins:
1. Show how to view today's operations
2. Demonstrate period selector
3. Show print functionality
4. Practice PDF export for reports

### For Super Admins:
1. Show all features above
2. Demonstrate advanced filters
3. Practice Excel export for analysis
4. Show how to distribute reports

---

## 🎉 Success Criteria

Your implementation is successful if:
- ✅ Dashboard loads without errors
- ✅ All 6 statistics show correct counts
- ✅ Charts display properly
- ✅ Tables show data
- ✅ Filters work correctly
- ✅ PDF export generates professional report
- ✅ Excel export creates multi-sheet workbook
- ✅ Print preview looks professional
- ✅ Both languages work perfectly
- ✅ No console errors

---

## 🚀 Ready to Deploy?

Before going live:
1. ✅ Test with real data
2. ✅ Verify all exports work
3. ✅ Check permissions on uploads folder
4. ✅ Test on different browsers
5. ✅ Train users
6. ✅ Backup database
7. ✅ Monitor server logs

---

**Status**: ✅ ALL FEATURES COMPLETE AND TESTED

Happy testing! 🎉
