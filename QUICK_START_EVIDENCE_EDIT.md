# Quick Start: Evidence Editing Feature

## 🚀 Setup (One-Time)

### Step 1: Apply Database Migration
Run the migration script to add the edit tracking tables:

```bash
# Windows
APPLY_EVIDENCE_EDIT_MIGRATION.bat

# Or manually with MySQL
mysql -u root police_case_management < app/Database/evidence_edit_history_migration.sql
```

### Step 2: Verify Installation
The feature is already integrated! No additional setup needed.

## 📝 How to Use

### Editing Evidence

1. **Login** as an investigator or admin
2. **Navigate** to "Evidence Management" in the sidebar
3. **Find** the evidence you want to edit
4. **Click** the blue **Edit** button (📝 pencil icon)
5. **Modify** the fields:
   - Title
   - Description
   - Evidence Type
   - Location Collected
   - Tags
   - Critical Status
6. **Click** "Save Changes"
7. Done! The evidence is updated and changes are tracked

### Viewing Edit History

1. Look for evidence with the **edited badge** (📝)
2. Click the **History** button (🕐 clock icon)
3. View all changes:
   - What was changed
   - Old vs New values
   - Who made the change
   - When it was changed

## 🎯 Key Features

✅ **Edit Evidence Metadata** - Update evidence details after upload  
✅ **Complete Audit Trail** - Every change is recorded  
✅ **Visual Indicators** - See which evidence has been edited  
✅ **Permission Control** - Only assigned investigators can edit  
✅ **Immutable History** - Changes cannot be deleted or modified  

## 🔒 Security

- Cannot change evidence file (security)
- Cannot change evidence number (auto-generated)
- Cannot change case assignment
- Only assigned investigators + admins can edit
- All edits are permanently logged

## 📊 What You'll See

### Evidence List
```
Evidence #           Type      Description        Actions
---------------------------------------------------------
CASE-001-E001 📝    Photo     Crime scene...     [View] [Edit] [History]
CASE-001-E002       Video     Suspect...         [View] [Edit]
```

### Edit History
```
Date & Time          Edited By    Field         Old Value      New Value
--------------------------------------------------------------------------
Jan 15, 10:30 AM    John Doe     Title         Original       Updated
Jan 15, 10:31 AM    John Doe     Critical      Normal         Critical
```

## ❓ FAQ

**Q: Can I edit the uploaded file?**  
A: No, files are immutable for security and evidence integrity.

**Q: Can I delete edit history?**  
A: No, all changes are permanently recorded for audit purposes.

**Q: Who can see the edit history?**  
A: Anyone who can view the evidence can see its edit history.

**Q: Can I revert changes?**  
A: Not in v1.0, but you can see old values and manually restore them.

## 🐛 Troubleshooting

**Can't see edit button?**
- Check if you're assigned to the case
- Verify you have investigator or admin role

**Changes not saving?**
- Check browser console for errors
- Verify your session hasn't expired
- Ensure database migration was applied

**History shows empty?**
- Make sure migration was applied successfully
- Check if evidence has actually been edited

## 📞 Need Help?

See the full documentation in `EVIDENCE_EDIT_FEATURE.md` for detailed information.

---
**Ready to use!** Just apply the database migration and start editing evidence.
