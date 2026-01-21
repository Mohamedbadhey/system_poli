# Quick Start Guide - Reports System

## 🚀 Get Started in 3 Minutes

### Step 1: Run Database Migrations (Required)

**Option A - Using Batch File (Windows):**
```bash
APPLY_REPORTS_MIGRATION.bat
```

**Option B - Using Command Line:**
```bash
php spark migrate
```

This will create:
- ✅ Enhanced `investigation_reports` table
- ✅ New `report_approvals` table  
- ✅ New `court_communications` table
- ✅ 7 professional report templates

---

### Step 2: Access Reports Dashboard

Open your browser and navigate to:
```
http://localhost:8080/reports-dashboard.html
```

**Login Credentials** (use existing users):
- **Investigator**: Username: `baare` / Password: `Admin123`
- **Commander/Admin**: Username: `moha` / Password: `Admin123`
- **Court User**: Username: `court` / Password: `Admin123`

---

### Step 3: Generate Your First Report

1. **Select a Case**: Click "Select Case" button
2. **Choose Report Type**: Click on any report card (e.g., "Generate PIR")
3. **Review Auto-Populated Content**: Template is filled automatically
4. **Edit as Needed**: Modify the content
5. **Preview**: Click "Preview" to see PDF output
6. **Save**: Click "Save Report"

---

## 📊 Available Report Types

### **Investigation Phase**
- ✅ **Preliminary Investigation Report (PIR)** - Initial 24-48h assessment
- ✅ **Interim Progress Report** - Weekly/bi-weekly updates
- ✅ **Final Investigation Report (FIR)** - Complete conclusion

### **Court Phase**
- ✅ **Court Submission Docket** - Formal charge sheet
- ✅ **Evidence Presentation Report** - Exhibit list
- ✅ **Supplementary Report** - Additional investigation

### **Closure**
- ✅ **Case Closure Report** - Final documentation

---

## 🔄 Report Workflow

```
1. Create Report (Draft)
   ↓
2. Edit & Preview
   ↓
3. Submit for Approval
   ↓
4. Commander Reviews
   ↓
5. Approved/Rejected
   ↓
6. Sign Report (Final Reports)
   ↓
7. Download PDF
```

---

## 🎯 Quick Actions

### **Generate Preliminary Report**
```javascript
// Click "Generate PIR" button
// System auto-fills:
// - Case details
// - Parties involved
// - Initial evidence
// - Investigator info
```

### **Generate Final Report**
```javascript
// Click "Generate FIR" button
// System includes:
// - Complete case data
// - All evidence
// - All witnesses
// - Conclusions
// - Case strength assessment
```

### **Submit to Court**
```javascript
// Click "Generate Docket" button
// Must have signed FIR first
// Includes:
// - Charges preferred
// - Complete evidence list
// - Witness list
```

---

## 🔐 Role Permissions

| Action | Investigator | Commander | Court User |
|--------|--------------|-----------|------------|
| Create Report | ✅ | ✅ | ❌ |
| Edit Draft | ✅ | ✅ | ❌ |
| Submit for Approval | ✅ | ✅ | ❌ |
| Approve/Reject | ❌ | ✅ | ❌ |
| Sign Report | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ |
| Download PDF | ✅ | ✅ | ✅ |

---

## 📁 Report Storage

All reports are stored in:
```
writable/uploads/reports/{case_id}/
```

PDFs are automatically generated and can be downloaded anytime.

---

## 💡 Pro Tips

1. **Use Preview**: Always preview before saving
2. **Edit Templates**: Customize content as needed
3. **Auto-Population**: Most fields are filled automatically
4. **Batch Operations**: Generate multiple reports for efficiency
5. **Digital Signatures**: Sign final reports for authenticity

---

## 🐛 Troubleshooting

**Reports not loading?**
- Check if migrations ran: `php spark migrate:status`
- Verify authentication token is valid
- Check browser console for errors

**PDF not generating?**
- Ensure `writable/uploads/reports/` folder exists
- Check folder permissions (775 or 777)
- Install DomPDF: `composer require dompdf/dompdf`

**Templates not showing?**
- Run: `php spark migrate:rollback`
- Then: `php spark migrate`

---

## 📞 Need Help?

Check the full documentation:
- **Complete Guide**: `REPORTS_SYSTEM_IMPLEMENTATION.md`
- **API Documentation**: See controller files
- **Logs**: Check `writable/logs/` for errors

---

## ✨ What's Next?

After generating reports, you can:
1. **Submit to Court**: Use court submission docket
2. **Track Approvals**: Monitor pending approvals tab
3. **Generate Statistics**: View report analytics
4. **Archive Cases**: Generate closure reports

---

**That's it! You're ready to generate professional case reports.** 🎉

Start with a Preliminary Investigation Report (PIR) for any active case!
