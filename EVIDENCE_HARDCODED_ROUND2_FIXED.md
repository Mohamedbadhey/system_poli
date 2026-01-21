# ✅ Evidence Modals - Additional Hardcoded Text Fixed (Round 2)

## Summary of Latest Fixes

Fixed additional hardcoded text found in evidence modals.

### Files Modified:

1. **app/Language/so/App.php**
   - Added 5 new translation keys

2. **public/assets/js/evidence-edit.js**
   - Fixed Replace File dialog labels
   - Fixed file info display
   - Fixed warning messages
   - Fixed edit history labels
   - Fixed note messages

### What Was Fixed:

#### Replace File Dialog
✅ **Headers**:
   - "Current File" → t('current_file') / "Faylka Hadda"
   - "New File" → t('new_file') / "Fayl Cusub"
✅ **Info Labels**:
   - "Size:" → t('file_size') / "Cabbirka Faylka"
   - "Type:" → t('type') / "Nooca"
✅ **Form Labels**:
   - "Select New File *" → t('select_file') / "Dooro fayl"
   - "Replace File" button → t('replace_file') / "Ku beddel Faylka"
✅ **Warning Message**:
   - "Warning:" → t('warning') / "Digniin"
   - Full warning text translated

#### Edit History Modal
✅ **Labels**:
   - "File Replaced" badge → t('file_replaced') / "Faylka la beddelay"
   - "Download Old" button → t('download_old_version')
   - "Download New" button → t('download_new_version')
✅ **Status**:
   - "Previously Edited" badge → t('previously_edited') / "Hore ayaa wax looga beddelay"

#### Edit Modal Notes
✅ **Note Section**:
   - "Note:" → t('note') / "Xusuus"
   - Changes tracking message → t('changes_tracked')

### New Translation Keys Added:

\\\
warning => 'Digniin'
replace_warning => 'Beddelka faylka wuxuu tirtiri doonaa faylka hore waxaana la raacin doonaa isbeddelkan taariikhda'
previously_edited => 'Hore ayaa wax looga beddelay'
note => 'Xusuus'
changes_tracked => 'Dhammaan isbedelada waa la raacin doonaa oo waxaa lagu diiwaangelin doonaa taariikhda wax ka beddelka'
\\\

### Translation Keys Summary:

**Evidence System - Total: 79 keys**
- Original: 74 keys
- Round 2 additions: 5 keys

**All Investigator Components - Total: 144 keys**
- Case-Persons Page: 47 keys
- Person Details Modal: 18 keys
- Evidence Management: 79 keys

## Outstanding Issue:

**User reported seeing hardcoded text when clicking Edit button:**
- Type: audio
- Description: Recorded audio statement
- Collected By: kazaama baare
- Collected At: Jan 17, 2026, 09:29 AM
- Location: N/A
- File Size: 66.32 KB
- ⚠️ CRITICAL EVIDENCE

**Status:** Need clarification on where exactly this text appears.
- Not found in Replace File Dialog
- Not found in Edit History Modal
- Not found in main edit form
- **Possible locations to check:**
  1. Tooltip or preview before modal opens
  2. Information panel at very top of edit modal
  3. Might be in View Details modal (not edit)
  4. Could be in a card/summary view

**Next Steps:**
- User to clarify exact location of this hardcoded text
- OR inspect page source (F12) when modal is open
- Search for "Collected By" in Elements tab to find exact HTML

## Status: ✅ Most Issues Fixed

All identified hardcoded text in Replace File Dialog, Edit History, and Notes has been translated.
Waiting for user clarification on remaining hardcoded text location.
