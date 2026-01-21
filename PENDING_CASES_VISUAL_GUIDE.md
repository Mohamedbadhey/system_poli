# Pending Cases Page - Visual Guide

## 📊 What You'll See

### Page Header
```
┌─────────────────────────────────────────────────────┐
│ 🕐 Pending Approval                                 │
│ Review and approve cases submitted by OB officers   │
└─────────────────────────────────────────────────────┘
```

### Card with DataTable
```
┌───────────────────────────────────────────────────────────────────┐
│  Cases Awaiting Approval                    [🔄 Refresh]          │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Show [25 ▼] cases          Search: [___________________]        │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Case #    │ OB #  │ Crime │ Cat │ Pri │ By │ Time │ ⚡ │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ CASE/..18 │ OB/18 │ Theft │🟡PRO│🔵MED│Ali │14:30│👁✅↩ │   │
│  │ CASE/..17 │ OB/17 │ Fire  │🔴VIO│🔴CRI│Bob │14:15│👁✅↩ │   │
│  │ CASE/..16 │ OB/16 │ Drug  │🔵DRG│🔵MED│Eve │13:45│👁✅↩ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Showing 1 to 3 of 3 cases              [◄] [1] [►]             │
└───────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

### 1. **Default Sorting: Latest First**
Cases are automatically sorted by submission time in **descending order** (newest at the top).

```
Most Recent ⬇️
├─ 14:30 - CASE/..18 (Just submitted)
├─ 14:15 - CASE/..17 (15 min ago)
└─ 13:45 - CASE/..16 (45 min ago)
Oldest
```

### 2. **Search Functionality**
Type anything in the search box to filter:

**Example Searches:**
- `CASE/XGD` → Shows all cases from XGD center
- `theft` → Shows all theft cases
- `Ali` → Shows all cases submitted by Ali
- `2026-01-16` → Shows all cases from that date
- `property` → Shows all property crimes

### 3. **Column Sorting**
Click any column header to sort:

```
Click "Submitted At" column:
  1st click → Oldest first ⬆️
  2nd click → Newest first ⬇️ (default)
  
Click "Priority" column:
  1st click → Critical first ⬆️
  2nd click → Low first ⬇️
```

### 4. **Action Buttons**

#### 👁️ **View** (Blue)
- Opens full case details modal
- Shows all case information
- No changes made

#### ✅ **Approve** (Green)
- Click → Confirmation dialog appears
- Confirms → Case moves to "Approved" status
- Ready for investigator assignment

#### ↩️ **Return** (Orange)
- Click → Reason dialog appears
- Must provide reason for return
- Case goes back to OB officer for revision

## 📱 Mobile View

On mobile devices, the table adapts:
```
┌────────────────────────┐
│ Show [10▼]            │
│ Search: [___________] │
│                       │
│ ┌───────────────────┐ │
│ │ CASE/XGD-01/..18  │ │
│ │ Theft | Property  │ │
│ │ By: Ali | 14:30   │ │
│ │ [👁️] [✅] [↩️]    │ │
│ ├───────────────────┤ │
│ │ CASE/XGD-01/..17  │ │
│ │ Fire | Violent    │ │
│ │ By: Bob | 14:15   │ │
│ │ [👁️] [✅] [↩️]    │ │
│ └───────────────────┘ │
└────────────────────────┘
```

## 🎨 Color Coding

### Category Badges
- 🔴 **Red** - Violent, Sexual crimes
- 🟠 **Orange** - Property crimes
- 🔵 **Blue** - Drug, Cybercrime
- ⚪ **Gray** - Juvenile, Other

### Priority Badges
- 🔴 **Red** - Critical
- 🟠 **Orange** - High
- 🔵 **Blue** - Medium
- ⚪ **Gray** - Low

### Status Badges
- 🟡 **Yellow** - Submitted (pending)
- 🟢 **Green** - Approved
- 🔴 **Red** - Returned

## ⚡ Quick Workflow

### Typical Admin Workflow:
1. **View**: Click 👁️ to review case details
2. **Decide**: 
   - If complete → Click ✅ Approve
   - If needs work → Click ↩️ Return (with reason)
3. **Next**: Table auto-refreshes, move to next case

### Bulk Review:
1. Use **Search** to filter by category or officer
2. **Sort** by priority to handle critical cases first
3. Review and approve/return batch by batch

## 🔍 Example Scenarios

### Scenario 1: Review Critical Cases First
```
1. Click "Priority" column header
2. Critical cases appear at top (red badges)
3. Review each one
4. Approve or return as needed
```

### Scenario 2: Check Specific Officer's Cases
```
1. Type officer name in search box
2. All their cases appear
3. Review quality and consistency
4. Approve or return with feedback
```

### Scenario 3: Daily Morning Review
```
1. Page loads with newest cases first (default)
2. See overnight submissions at top
3. Quickly review recent cases
4. Process in chronological order
```

## 💡 Pro Tips

1. **Keyboard Navigation**: Use Tab to move between search and buttons
2. **Quick Approval**: For routine cases, just click ✅ without viewing
3. **Batch Search**: Search by date to process all cases from a shift
4. **Sort by Submitter**: Click "Submitted By" to group by officer
5. **Use Pagination**: Change to 50 or 100 for bulk processing

## 📊 Data Displayed

Each row shows:
- **Case Number**: Unique identifier (e.g., CASE/XGD-01/2026/0018)
- **OB Number**: Occurrence book reference
- **Crime Type**: Specific crime (Theft, Assault, etc.)
- **Category**: General category with color badge
- **Priority**: Urgency level with color badge
- **Submitted By**: Name of OB officer
- **Submitted At**: Date + Time (sortable)
- **Status**: Current status badge
- **Actions**: Quick action buttons

---

## ✨ Benefits

✅ **Fast Search** - Find any case in seconds  
✅ **Smart Sorting** - Latest cases first by default  
✅ **Easy Filtering** - Search across all fields  
✅ **Quick Actions** - Approve/Return in one click  
✅ **Mobile Friendly** - Works on any device  
✅ **Professional UI** - Clean, modern design  

---

**You're all set! The Pending Cases page is now production-ready with full DataTable functionality!** 🎉
