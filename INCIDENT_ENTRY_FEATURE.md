# Incident Entry Feature - Implementation Summary

## Overview
This feature adds a new page for recording incidents that occur naturally or where someone broke the law but there's **no immediate victim or accused person**. This is useful for:

- Traffic accidents without clear fault
- Natural incidents (floods, fires, etc.)
- Lost property reports
- Public disturbances
- Suspicious activities
- Environmental incidents
- Cases requiring investigation to identify parties later

## Key Difference from OB Entry

### OB Entry (Existing)
- **Required**: Victim and/or Accused information upfront
- **Use Case**: Cases with known parties involved
- **Status**: Submitted for assignment

### Incident Entry (NEW)
- **Required**: Only incident details (no parties needed initially)
- **Use Case**: Cases without immediate victim/accused identification
- **Status**: Created as DRAFT
- **Workflow**: Parties can be added later during investigation

## Database Logic

### Case Creation
- Cases are created with `status = 'draft'`
- No entries in `case_parties` table initially
- All other case fields populated (location, description, crime type, etc.)

### Investigation Workflow
1. OB Officer creates incident report
2. Case status: **DRAFT** (no parties yet)
3. Case assigned to investigator
4. Investigator adds victim/accused/witnesses as investigation progresses
5. Case status updated to appropriate state

## Files Created/Modified

### 1. Controller Method (`app/Controllers/OB/CaseController.php`)
Added new method:
- `createIncident()` - Creates case without party information

Features:
- Validates incident details (date, location, description, crime classification)
- Creates case in DRAFT status
- Returns case number and OB number
- Logs case creation action

### 2. Routes (`app/Config/Routes.php`)
Added new route:
```php
$routes->post('cases/incident', 'OB\CaseController::createIncident');
```

### 3. JavaScript File (`public/assets/js/incident-entry.js`)
Created new file with:
- `loadIncidentEntryPage()` - Renders the incident entry form
- `handleIncidentSubmission()` - Handles form submission and validation
- `showConfirmDialog()` - Shows success dialog with options

### 4. Form Fields

#### Required Fields:
- **Incident Date** (datetime-local)
- **Incident Location** (text)
- **Incident Description** (textarea, min 10 chars)
- **Crime Type** (text input)
- **Crime Category** (select: violent, property, drug, cybercrime, sexual, juvenile, other)
- **Priority** (select: low, medium, high, critical)

#### Optional Fields:
- **GPS Latitude** (text)
- **GPS Longitude** (text)
- **Is Sensitive** (checkbox)

### 5. Navigation (`public/assets/js/app.js`)
Added menu item for OB Officers and Admins:
- "Incident Entry" with exclamation-triangle icon
- Positioned between "OB Entry" and "My Cases"

### 6. Page Loading
Added case handler in app.js:
```javascript
case 'incident-entry':
    loadIncidentEntryPage();
    break;
```

### 7. Translations

#### English (`app/Language/en/App.php`)
- `incident_entry` - Menu label
- `incident_entry_desc` - Page description
- `create_incident` - Form title
- `incident_entry_note` - Helper note
- `incident_details` - Section header
- `crime_classification` - Section header
- `create_incident_btn` - Submit button
- `incident_workflow_note` - Workflow explanation
- `min_10_chars` - Validation message

#### Somali (`app/Language/so/App.php`)
- Full translations for all incident entry labels
- Maintains consistency with existing Somali translations

### 8. Dashboard HTML (`public/dashboard.html`)
Added script reference:
```html
<script src="assets/js/incident-entry.js"></script>
```

## Form Validation

### Client-side Validation:
- All required fields must be filled
- Incident description minimum 10 characters
- Date must be valid datetime format
- Category must be from predefined list

### Server-side Validation:
- `incident_date` - Required, valid date
- `incident_location` - Required
- `incident_description` - Required, min 10 chars
- `crime_type` - Required, max 100 chars
- `crime_category` - Required, must be in list

## Success Flow

After successful incident creation:
1. Toast notification shows success
2. Modal dialog displays:
   - Case Number
   - OB Number
   - Draft status message
3. Two action buttons:
   - **View My Cases** - Navigate to cases list
   - **Create Another** - Reset form for new incident

## Use Cases

### Example 1: Traffic Accident
- OB officer receives report of traffic accident
- No clear victim/accused at scene
- Officer creates incident report with location and description
- Later investigation determines fault and adds parties

### Example 2: Lost Property
- Citizen reports lost valuables
- No suspect identified
- Officer creates incident report
- If suspect found later, investigator adds accused person

### Example 3: Public Disturbance
- Report of disturbance in public area
- Multiple people involved, unclear who is victim/perpetrator
- Officer documents incident
- Investigation identifies key parties later

### Example 4: Suspicious Activity
- Report of suspicious behavior
- No crime committed yet, just observation
- Officer documents for follow-up
- If crime discovered, parties added to case

## Access Control

### OB Officers:
- Can create incident reports
- Can view their own incident cases
- Full access to incident entry page

### Admins/Super Admins:
- Can create incident reports
- Can view all incident cases
- Full access to incident entry page

### Investigators:
- Cannot create incidents directly
- Receive assigned incidents
- Can add parties during investigation

## Database Impact

### New Records Created:
- 1 record in `cases` table (status = 'draft')
- 1 record in `case_status_history` (if implemented)
- 0 records in `case_parties` initially

### Generated Values:
- `case_number` - Auto-generated based on center
- `ob_number` - Auto-generated based on center
- `created_by` - Current user ID
- `report_date` - Current timestamp

## Testing Instructions

1. **Login as OB Officer**
2. **Navigate to "Incident Entry"** from menu
3. **Fill out the form**:
   - Set incident date/time
   - Enter location
   - Describe incident (min 10 chars)
   - Select crime type and category
   - Set priority
   - Optionally mark as sensitive
4. **Submit the form**
5. **Verify**:
   - Success message appears
   - Case number and OB number displayed
   - Can view case in "My Cases" with DRAFT status

## Integration with Existing System

### Compatible with:
- Case assignment workflow
- Investigation notes
- Evidence collection
- Case status transitions
- Court workflow (once parties added)

### Workflow after Incident Creation:
1. Admin assigns case to investigator
2. Investigator investigates and adds parties
3. Investigator adds evidence, notes, etc.
4. Case progresses through normal workflow
5. Can be sent to court once parties identified

## Future Enhancements

Potential improvements:
1. Bulk import incidents from external reports
2. Incident templates for common scenarios
3. Automatic party suggestion based on description
4. Integration with mapping services for location
5. Photo upload during incident creation
6. Voice-to-text for descriptions
7. Incident analytics dashboard

## Benefits

1. **Faster Reporting**: OB officers can quickly document incidents without waiting for party information
2. **Better Documentation**: All incidents recorded, even without suspects
3. **Improved Workflow**: Separates incident documentation from investigation
4. **Flexibility**: Parties added as investigation reveals information
5. **Compliance**: Complete record of all reported incidents
