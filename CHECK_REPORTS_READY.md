# ✅ Check if Reports System is Ready

## Quick Database Check

Run this SQL file to verify everything is set up:

```sql
-- Open your MySQL/phpMyAdmin
-- Run: VERIFY_DATABASE_STRUCTURE.sql
```

This will check:
1. ✅ `investigation_reports` table exists
2. ✅ `report_approvals` table exists
3. ✅ `court_communications` table exists
4. ✅ All required columns are present
5. ✅ Report templates are loaded
6. ✅ Case data is available for reports

---

## What the System Needs

### Required Data in Database:

#### 1. **Cases Table** (Already exists ✅)
- case_number
- ob_number
- crime_type
- crime_category
- incident_date
- incident_time
- incident_location
- incident_description
- status
- priority

#### 2. **Persons Table** (Already exists ✅)
- first_name
- middle_name
- last_name
- national_id
- phone
- address
- date_of_birth

#### 3. **Case_Parties Table** (Already exists ✅)
- Links persons to cases
- party_role: accuser, accused, witness
- statement

#### 4. **Evidence Table** (Already exists ✅)
- evidence_number
- title
- evidence_type
- description
- collected_at
- collected_by
- is_critical

#### 5. **Investigation_Notes Table** (Already exists ✅)
- note_type
- content
- created_at

#### 6. **Users Table** (Already exists ✅)
- full_name
- badge_number
- email
- role

#### 7. **Police_Centers Table** (Already exists ✅)
- center_name
- center_code
- location

---

## What Needs to Be Created

### NEW: investigation_reports Table

This is the main reports table that needs to be created. Run `reports_system_migration.sql` to create it.

**Columns:**
```sql
- id (PK)
- case_id (FK to cases)
- report_type (preliminary, interim, final, etc.)
- report_title
- report_content (LONGTEXT)
- approval_status (draft, pending, approved, rejected)
- created_by (FK to users)
- created_at
- ... plus 10+ more columns for metadata
```

---

## How Reports Auto-Populate

### When you generate a report, the system:

1. **Fetches case data** from `cases` table
2. **Gets all parties** from `case_parties` + `persons`
3. **Gets all evidence** from `evidence` table
4. **Gets investigation notes** from `investigation_notes`
5. **Gets investigator info** from `users` table
6. **Gets police center** from `police_centers` table

### Then it fills the template:

```
PRELIMINARY INVESTIGATION REPORT

Case Number: {{case_number}}     ← From cases table
OB Number: {{ob_number}}          ← From cases table
Crime Type: {{crime_type}}        ← From cases table

Investigator: {{investigator_name}}  ← From users table
Badge: {{investigator_badge}}        ← From users table

Accused: {{accused_names}}        ← From case_parties + persons
Victims: {{accuser_names}}        ← From case_parties + persons
Witnesses: {{witness_names}}      ← From case_parties + persons

Evidence:
{{evidence_list}}                 ← From evidence table
Total: {{total_evidence}}         ← COUNT from evidence table
```

---

## Verify Your Database Has Data

### Run these checks in your database:

```sql
-- 1. Check you have cases
SELECT COUNT(*) FROM cases;
-- Should show: 10+ cases

-- 2. Check cases have parties
SELECT 
    c.case_number,
    COUNT(cp.id) as parties
FROM cases c
LEFT JOIN case_parties cp ON c.id = cp.case_id
GROUP BY c.id;
-- Each case should have at least 1 party

-- 3. Check cases have evidence
SELECT 
    c.case_number,
    COUNT(e.id) as evidence
FROM cases c
LEFT JOIN evidence e ON c.id = e.case_id
GROUP BY c.id;
-- Most cases should have evidence

-- 4. Check you have users (investigators)
SELECT COUNT(*) FROM users WHERE role = 'investigator';
-- Should show: 1+ investigators

-- 5. Check police centers exist
SELECT COUNT(*) FROM police_centers;
-- Should show: 1+ centers
```

---

## What to Do Now

### Option 1: Run the Verification Script (Recommended)
```sql
-- In phpMyAdmin or MySQL Workbench:
-- 1. Open: VERIFY_DATABASE_STRUCTURE.sql
-- 2. Run all queries
-- 3. Check the results
```

### Option 2: Run the Migration (If tables don't exist)
```sql
-- In phpMyAdmin or MySQL Workbench:
-- 1. Open: reports_system_migration.sql
-- 2. Run the entire file
-- 3. Check for "Migration Complete" message
```

### Option 3: Quick Test in Browser
```
1. Login as investigator
2. Open Console (F12)
3. Run: 
   fetch('/investigation/cases', {
       headers: {'Authorization': 'Bearer ' + localStorage.getItem('auth_token')}
   }).then(r => r.json()).then(console.log)
   
4. Should see your cases list
```

---

## Expected Data Structure

### A complete case for reports should have:

```json
{
  "case": {
    "id": 10,
    "case_number": "CASE/HQ001/2025/0001",
    "ob_number": "OB/2025/001",
    "crime_type": "Murder",
    "incident_date": "2025-01-01",
    "incident_location": "Downtown",
    "incident_description": "..."
  },
  "parties": [
    {
      "party_role": "accused",
      "person": {
        "first_name": "John",
        "last_name": "Doe",
        "national_id": "12345"
      }
    },
    {
      "party_role": "accuser",
      "person": {
        "first_name": "Jane",
        "last_name": "Smith"
      }
    }
  ],
  "evidence": [
    {
      "evidence_number": "CASE/HQ001/2025/0001-E001",
      "title": "Weapon",
      "evidence_type": "physical"
    }
  ],
  "investigator": {
    "full_name": "Officer Ahmed",
    "badge_number": "B12345"
  }
}
```

---

## If Data is Missing

### Add sample data for testing:

```sql
-- Add a test case party
INSERT INTO case_parties (case_id, person_id, party_role)
VALUES (10, 1, 'accused');

-- Add test evidence
INSERT INTO evidence (case_id, evidence_number, title, evidence_type, collected_by)
VALUES (10, 'CASE/TEST/2025/0001-E001', 'Test Evidence', 'physical', 26);

-- Add test note
INSERT INTO investigation_notes (case_id, note_type, content, created_by)
VALUES (10, 'general', 'Test investigation note', 26);
```

---

## ✅ System is Ready When:

- [ ] `investigation_reports` table exists
- [ ] `report_approvals` table exists
- [ ] 7 report templates are loaded
- [ ] At least 1 case exists
- [ ] Cases have parties (accused/accuser)
- [ ] Cases have evidence items
- [ ] Users table has investigators
- [ ] Authentication works (no 401 errors)

---

**Run `VERIFY_DATABASE_STRUCTURE.sql` now to check everything!**
