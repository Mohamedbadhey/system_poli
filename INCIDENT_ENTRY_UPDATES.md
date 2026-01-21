# Incident Entry Feature - Updates Applied

## Changes Made

### 1. ✅ Removed GPS Fields
- **Removed**: GPS Latitude and GPS Longitude fields
- **Reason**: Simplified form as requested
- **Files Modified**: 
  - `public/assets/js/incident-entry.js`
  - `tmp_rovodev_test_incident_entry.html`

### 2. ✅ Added Optional Party Section
- **New Feature**: Optional party information (victim or accused)
- **How it works**: 
  - Checkbox to enable party section: "This incident affects a person"
  - When checked, party form fields appear
  - When unchecked, fields are hidden and cleared
- **Use Case**: If the incident affects someone, you can add them during incident creation

### 3. Party Form Fields

#### Required (when party section is enabled):
- **Party Role** (select: Victim or Accused)
- **First Name**
- **Last Name**

#### Optional:
- Middle Name
- Gender (Male/Female)
- Phone
- National ID
- Address

### 4. Backend Processing

#### Controller Updates (`app/Controllers/OB/CaseController.php`)
The `createIncident()` method now:
1. Creates the incident case
2. **If party data provided**:
   - Creates a person record in `persons` table
   - Links person to case in `case_parties` table
   - Uses database transactions for data integrity
3. Returns appropriate success message

#### Database Operations:
```php
// Creates entries in:
- cases (incident details)
- persons (party information, if provided)
- case_parties (links person to case, if provided)
```

### 5. Translations Added

#### English (`app/Language/en/App.php`)
- `optional_party_info` - "Optional Party Information (if incident affects someone)"
- `incident_has_party` - "This incident affects a person (victim or accused)"
- `party_role` - "Party Role"
- `select_role` - "Select Role"

#### Somali (`app/Language/so/App.php`)
- `optional_party_info` - "Macluumaadka Qofka (haddii dhacdadu saameyn qof)"
- `incident_has_party` - "Dhacdadan waxay saameysaa qof (dhibane ama eedaysan)"
- `party_role` - "Doorka Qofka"
- `select_role` - "Dooro Doorka"

## Workflow Scenarios

### Scenario 1: Incident WITHOUT Party
**Example**: Public disturbance, no identified individuals
1. OB Officer fills incident details
2. Does NOT check "This incident affects a person"
3. Submits form
4. **Result**: Case created with status "draft", no parties added
5. Investigator can add parties later during investigation

### Scenario 2: Incident WITH Party (Victim)
**Example**: Lost property - citizen reports lost wallet
1. OB Officer fills incident details
2. Checks "This incident affects a person"
3. Selects Role: **Victim**
4. Fills victim information (name, phone, etc.)
5. Submits form
6. **Result**: Case created with victim already linked

### Scenario 3: Incident WITH Party (Accused)
**Example**: Traffic accident - one driver clearly at fault
1. OB Officer fills incident details
2. Checks "This incident affects a person"
3. Selects Role: **Accused**
4. Fills accused information
5. Submits form
6. **Result**: Case created with accused already linked

## Form Validation

### Client-side (JavaScript):
- Required fields checked before submission
- If party section enabled, party required fields must be filled
- Minimum character validation for description
- Real-time field enabling/disabling based on checkbox

### Server-side (PHP):
- Incident details validated
- Party data validated if provided
- Database transaction ensures all-or-nothing operation
- Rollback on any error

## Data Flow

```
User Fills Form
    ↓
JavaScript Validation
    ↓
API Request to /ob/cases/incident
    ↓
Controller: createIncident()
    ↓
Database Transaction Start
    ↓
Create Case Record
    ↓
[If Party Data Provided]
    ↓
Create Person Record
    ↓
Link Person to Case (case_parties)
    ↓
Transaction Commit
    ↓
Return Success Response
```

## Testing Instructions

### Test 1: Incident Without Party
1. Navigate to "Incident Entry"
2. Fill in:
   - Incident date
   - Location
   - Description
   - Crime type/category
   - Priority
3. **Do NOT check** "This incident affects a person"
4. Submit
5. **Verify**: Case created without parties

### Test 2: Incident With Victim
1. Navigate to "Incident Entry"
2. Fill incident details
3. **Check** "This incident affects a person"
4. Select Role: **Victim**
5. Fill victim details (first name, last name required)
6. Submit
7. **Verify**: Case created with victim linked

### Test 3: Incident With Accused
1. Navigate to "Incident Entry"
2. Fill incident details
3. **Check** "This incident affects a person"
4. Select Role: **Accused**
5. Fill accused details
6. Submit
7. **Verify**: Case created with accused linked

### Test 4: Toggle Party Section
1. Navigate to "Incident Entry"
2. Check "This incident affects a person" - section appears
3. Fill some party fields
4. Uncheck "This incident affects a person" - section hides
5. Check again - fields should be cleared
6. **Verify**: Fields reset when toggling

## Database Impact

### Without Party:
```sql
-- 1 record created in cases
INSERT INTO cases (...) VALUES (...);
```

### With Party:
```sql
-- 3 records created
INSERT INTO cases (...) VALUES (...);
INSERT INTO persons (...) VALUES (...);
INSERT INTO case_parties (case_id, person_id, party_role, ...) VALUES (...);
```

## Benefits of This Approach

1. **Flexibility**: OB officer decides if party info is needed
2. **No Duplication**: Similar to OB Entry but for incidents without known parties
3. **Fast Entry**: Can quickly create incident without waiting for party info
4. **Complete Records**: If party is known, can be added immediately
5. **Investigation Ready**: Investigators can add more parties later

## Comparison: OB Entry vs Incident Entry

| Feature | OB Entry | Incident Entry |
|---------|----------|----------------|
| Parties Required | ✅ Yes (at least 1) | ❌ No (optional) |
| Party Section | Always visible | Toggle with checkbox |
| Use Case | Known victim/accused | Unknown or optional parties |
| Status Created | Submitted | Draft |
| GPS Fields | ✅ Included | ❌ Removed |

## Files Modified Summary

1. ✅ `public/assets/js/incident-entry.js` - Removed GPS, added optional party section
2. ✅ `app/Controllers/OB/CaseController.php` - Updated createIncident to handle party data
3. ✅ `app/Language/en/App.php` - Added party translations
4. ✅ `app/Language/so/App.php` - Added party translations
5. ✅ `tmp_rovodev_test_incident_entry.html` - Updated test file

## Next Steps

Ready for testing! The incident entry page now:
- ✅ Has no GPS fields
- ✅ Allows optional party addition
- ✅ Works like OB entry when party is added
- ✅ Works standalone when no party is added
