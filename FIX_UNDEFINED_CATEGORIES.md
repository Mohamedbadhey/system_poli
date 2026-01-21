# Fix "undefined" Category Display Issue

## Problem
Case details show "undefined" for the crime_category field.

## Possible Causes

### 1. Database has NULL or empty values
**Check with:**
```sql
SELECT id, case_number, crime_category 
FROM cases 
WHERE crime_category IS NULL OR crime_category = '';
```

**Fix:**
```sql
-- Set empty categories to a default value
UPDATE cases 
SET crime_category = 'Other' 
WHERE crime_category IS NULL OR crime_category = '';
```

### 2. Old ENUM values still in database
**Check with:**
```sql
SELECT DISTINCT crime_category FROM cases;
```

**Issue:** Cases created before migration might have old ENUM values like 'violent', 'property', etc.

**Fix:** These are still valid values, but they might not display nicely. You can:
- Leave them as-is (they're technically correct)
- Map them to proper category names from the categories table

### 3. Category name doesn't exist in categories table
**Check with:**
```sql
SELECT DISTINCT 
    c.crime_category,
    cat.name
FROM cases c
LEFT JOIN categories cat ON c.crime_category = cat.name
WHERE c.crime_category IS NOT NULL;
```

**Fix:** Add missing categories to the categories table, or update cases to use existing category names.

---

## Quick Fix Applied

**File:** `case-details-modal.js` (Line 337)

**Changed:**
```javascript
// Before:
<p>${caseData.crime_category}</p>

// After:
<p>${caseData.crime_category || 'N/A'}</p>
```

This prevents "undefined" from showing - it will show "N/A" instead if the category is empty.

---

## Action Needed

**Please run:** `CHECK_CASE_CATEGORIES.sql` in your MySQL client

This will show:
1. What crime_category values exist in your cases
2. How many cases have NULL/empty categories
3. Which categories don't match the categories table

**After running it, tell me:**
- What categories you see
- How many cases have NULL or empty categories
- Are there old ENUM values (violent, property, drug, etc.)?

Then I can create a proper fix!
