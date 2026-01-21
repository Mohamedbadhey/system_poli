# ✅ Custody Management from Persons Page - COMPLETE

## Overview
Added the ability to manage custody status for any person from the Persons page, including handling transitions from "not present" to "arrested" or "bailed".

---

## Features Added

### 1. ✅ Manage Custody Button
Added "Manage Custody" button in person details modal that allows updating custody status.

### 2. ✅ Multiple Custody Actions
Supports the following actions:

#### For Persons Not in Custody:
- **Mark as Arrested** - Create new custody record with "in_custody" status
- **Mark as Bailed** - Create custody record with "released" status + bailer info

#### For Persons Currently in Custody:
- **Grant Bail** - Update status to "released" + create bailer record
- **Release from Custody** - Update status to "released"

### 3. ✅ Not Present → Arrested Transition
When a person marked as "not present" arrives:
- Select case to link custody to
- Enter custody location and cell number
- Add custody notes
- Creates custody record with status "in_custody"

### 4. ✅ Not Present → Bailed Transition
When a person marked as "not present" is to be bailed:
- Select case
- Enter bailer information (name, phone, ID, relationship)
- Enter bail conditions and amount
- Creates bailer person record
- Creates custody record with status "released"

---

## UI Flow

### Opening Custody Management
```
Persons Page → Click "View" on person 
           → Person Details Modal opens
           → Click "Manage Custody" button
           → Custody Management Modal opens
```

### Custody Management Modal
```
┌──────────────────────────────────────────┐
│ Manage Custody - John Doe           [X]  │
├──────────────────────────────────────────┤
│                                          │
│ Custody Action: [Select Action ▼]       │
│   - Mark as Arrested (In Custody)       │
│   - Mark as Bailed                      │
│   OR (if already in custody)            │
│   - Grant Bail                          │
│   - Release from Custody                │
│                                          │
│ [Dynamic fields based on selection]     │
│                                          │
│          [Cancel] [Update Custody]      │
└──────────────────────────────────────────┘
```

---

## Scenarios

### Scenario 1: Not Present → Arrested
```
1. Person currently has no active custody
2. Select "Mark as Arrested"
3. Choose case to link
4. Fill custody details:
   - Location: "Station Lock-up"
   - Cell: "Cell 3"
   - Notes: "Arrested on warrant"
5. Click "Update Custody"
6. Custody record created with status "in_custody"
```

### Scenario 2: Not Present → Bailed
```
1. Person has no active custody
2. Select "Mark as Bailed"
3. Choose case to link
4. Fill bailer information:
   - Name: "James Doe"
   - Phone: "+252123456"
   - ID: "123456"
   - Relationship: "Father"
   - Bail conditions: "Report every Monday"
   - Bail amount: "10000"
5. Click "Update Custody"
6. Bailer person record created
7. Custody record created with status "released"
```

### Scenario 3: In Custody → Grant Bail
```
1. Person currently in custody
2. Select "Grant Bail"
3. Fill bailer information
4. Click "Update Custody"
5. Bailer created
6. Custody status updated to "released"
7. Custody end date set
```

### Scenario 4: In Custody → Release
```
1. Person currently in custody
2. Select "Release from Custody"
3. Click "Update Custody"
4. Custody status updated to "released"
5. Custody end date set
```

---

## Data Flow

### Creating Arrested Custody
```
User selects "Mark as Arrested"
        ↓
Select case from person's cases
        ↓
Fill custody location, cell, notes
        ↓
Click "Update Custody"
        ↓
POST /ob/custody
{
  case_id: 5,
  person_id: 12,
  custody_status: "in_custody",
  custody_location: "Station Lock-up",
  cell_number: "Cell 3",
  custody_start: current_timestamp
}
        ↓
Custody record created
        ↓
Success message shown
```

### Creating Bailed Status
```
User selects "Mark as Bailed"
        ↓
Select case
        ↓
Fill bailer information
        ↓
Click "Update Custody"
        ↓
Step 1: Create bailer
POST /ob/persons
{
  person_type: "other",
  first_name: "James",
  last_name: "Doe",
  phone: "+252...",
  case_id: 5
}
        ↓
Step 2: Create custody as released
POST /ob/custody
{
  case_id: 5,
  person_id: 12,
  custody_status: "released",
  custody_start: current_timestamp,
  custody_end: current_timestamp,
  custody_notes: "Bailed by: James Doe..."
}
        ↓
Success message shown
```

---

## API Calls

### Create Custody (Arrested)
```javascript
await obAPI.createCustody({
  case_id: 5,
  person_id: 12,
  custody_status: 'in_custody',
  custody_location: 'Station Lock-up',
  cell_number: 'Cell 3',
  custody_start: '2026-01-03 15:00:00',
  custody_notes: 'Notes...'
});
```

### Create Bailer
```javascript
await obAPI.createPerson({
  person_type: 'other',
  first_name: 'James',
  last_name: 'Doe',
  national_id: '123456',
  phone: '+252...',
  address: '...',
  case_id: 5
});
```

### Update Custody (Grant Bail)
```javascript
await obAPI.updateCustody(custodyId, {
  custody_status: 'released',
  custody_end: '2026-01-03 16:00:00',
  custody_notes: '...existing notes...\n\nBailed by: James Doe...'
});
```

---

## Validation

### Required Fields

**Mark as Arrested:**
- ✅ Case selection (required)
- Custody location (optional, defaults to "Station Lock-up")
- Cell number (optional)
- Notes (optional)

**Mark as Bailed:**
- ✅ Case selection (required)
- ✅ Bailer name (required)
- ✅ Bailer phone (required)
- Bailer ID (optional)
- Relationship (optional)
- Bail conditions (optional)
- Bail amount (optional)

**Grant Bail:**
- ✅ Bailer name (required)
- ✅ Bailer phone (required)
- Other bailer fields (optional)

---

## Benefits

### 1. **Flexible Workflow**
- Can create custody records from Persons page
- Don't need to go through OB Entry
- Quick updates for status changes

### 2. **Handle Late Arrivals**
- Mark as "not present" initially
- Update to "arrested" when they arrive
- Proper timestamp tracking

### 3. **Bail Management**
- Complete bailer information capture
- Bail conditions documented
- Automatic status updates

### 4. **Central Management**
- All custody operations from one place
- View history and update status
- Track across multiple cases

---

## Files Modified

1. **public/assets/js/app.js**
   - Added "Manage Custody" button to person details modal
   - Added `manageCustodyForPerson()` function (~150 lines)
   - Added `toggleCustodyActionFields()` function
   - Added `processCustodyUpdate()` function

2. **public/assets/js/api.js**
   - Added `updateCustody()` function

---

## Backend Support

The following endpoints are used:
- `POST /ob/custody` - Create custody (already exists)
- `PUT /ob/custody/{id}` - Update custody (uses ResourceController)
- `POST /ob/persons` - Create bailer (already exists)
- `GET /ob/persons/{id}/cases` - Get person's cases (newly added)
- `GET /ob/persons/{id}/custody` - Get custody history (newly added)

---

## Status

✅ **COMPLETE AND READY TO USE**

All features implemented:
- Manage Custody button ✅
- Not Present → Arrested ✅
- Not Present → Bailed ✅
- In Custody → Grant Bail ✅
- In Custody → Release ✅
- Bailer creation ✅
- Validation ✅

---

**Implementation Date**: January 3, 2026  
**Feature**: Custody management from Persons page  
**Files Modified**: 2 (app.js, api.js)  
**Lines Added**: ~200 lines  
**Status**: Ready to test ✅
