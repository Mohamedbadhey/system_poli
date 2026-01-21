# Categories Feature - Testing Guide

## ✅ Database Setup Complete!

The categories table has been successfully created with 7 default categories:
- 🔴 Violent Crimes
- 🟠 Property Crimes
- 🟣 Drug Related
- 🔵 Cybercrime
- 🩷 Sexual Offenses
- 🔷 Juvenile Cases
- ⚫ Other

## Testing Steps

### 1. Start the Server
```bash
START_SERVER.bat
```
Or if already running, continue to step 2.

### 2. Login to the System
1. Open browser: `http://localhost:8080`
2. Login with admin or super_admin credentials

### 3. Test Categories Management Page

#### Access the Page
- Look for **"Categories"** in the sidebar menu
- Click on it to open the Categories Management page

#### Expected Features:
✅ See a table with all 7 default categories
✅ Each category shows:
   - Display order with up/down arrows
   - Name
   - Description
   - Color preview
   - Icon
   - Case count (should be 0 initially)
   - Status (Active/Inactive)
   - Action buttons (Edit, Toggle Status, Delete)

#### Test Create Category:
1. Click "Add Category" button
2. Fill in:
   - Name: "Test Category"
   - Description: "This is a test"
   - Color: Pick any color
   - Icon: Select from dropdown
   - Active: Checked
3. Click "Save Category"
4. Should see success message
5. Category appears in the table

#### Test Edit Category:
1. Click edit icon on any category
2. Change the name or description
3. Click "Update Category"
4. Should see success message
5. Changes appear in the table

#### Test Reorder Categories:
1. Click up/down arrows on any category
2. Category order should change
3. Table refreshes with new order

#### Test Toggle Status:
1. Click toggle icon on any category
2. Status changes from Active to Inactive (or vice versa)
3. Table refreshes

#### Test Delete Category:
1. Click delete icon on a category with 0 cases
2. Confirm deletion
3. Category is removed from table
4. Try to delete a category with cases (if any) - should fail with error message

### 4. Test Cases by Category Page

#### Access the Page
- Look for **"Cases by Category"** in the sidebar menu
- Click on it to open the Cases by Category view

#### Expected Features:
✅ See horizontal tabs with all active categories
✅ Each tab shows:
   - Category icon with color
   - Category name
   - Badge with case count
✅ Tabs have colored bottom borders matching category color

#### Test Tab Navigation:
1. Click on different category tabs
2. Content area updates to show cases in that category
3. If no cases exist, see "No cases in [Category Name]" message
4. If cases exist, see a table with:
   - Case Number
   - OB Number
   - Crime Type
   - Incident Date
   - Status
   - Priority
   - Created By
   - Actions (View button)

#### Test Role-Based Filtering:
- **Super Admin**: Should see all cases
- **Admin**: Should see cases from their center
- **OB Officer**: Should see only their own cases
- **Investigator**: Should see only assigned cases
- **Court User**: Should see only court-related cases

### 5. Test Integration with Existing Cases

#### If You Have Existing Cases:
1. Go to any existing case
2. Check the `crime_category` field in the database
3. If it matches a category name exactly, it should appear in that category's tab
4. Go to "Cases by Category" page
5. Click the matching category tab
6. Your case should appear in the list

#### To Update Existing Cases (Optional):
Run this SQL to assign categories to existing cases:
```sql
-- Update cases with matching crime types
UPDATE cases SET crime_category = 'Violent Crimes' 
WHERE crime_type LIKE '%assault%' OR crime_type LIKE '%violence%';

UPDATE cases SET crime_category = 'Property Crimes' 
WHERE crime_type LIKE '%theft%' OR crime_type LIKE '%burglary%';

UPDATE cases SET crime_category = 'Drug Related' 
WHERE crime_type LIKE '%drug%';

UPDATE cases SET crime_category = 'Cybercrime' 
WHERE crime_type LIKE '%cyber%' OR crime_type LIKE '%hack%';
```

## Common Issues & Solutions

### Issue: Navigation menu doesn't show Categories links
**Solution**: 
- Clear browser cache (Ctrl+F5)
- Make sure you're logged in as admin or super_admin
- Check browser console for JavaScript errors

### Issue: "apiCall is not defined" error
**Solution**: 
- This has been fixed in the updated code
- Make sure you have the latest version of `categories.js` and `api.js`
- Clear browser cache

### Issue: Categories page is blank
**Solution**:
- Open browser console (F12)
- Check for JavaScript errors
- Verify the API endpoint `/admin/categories` is accessible
- Check network tab for failed requests

### Issue: Can't delete a category
**Solution**:
- This is by design - you can't delete categories that have cases
- Use "Toggle Status" to deactivate instead
- Or reassign all cases to another category first

### Issue: Cases not showing in category tabs
**Solution**:
- Verify the case's `crime_category` field matches the category name exactly
- Check that the category is marked as active
- Ensure the user has permission to view those cases
- Check browser console for errors

## Browser Console Debugging

Open browser console (F12) and check for:
1. Any red error messages
2. Network tab - check API responses
3. Console tab - check for JavaScript errors

### Expected Console Output:
```
Loading page: categories
(or)
Loading page: cases-by-category
```

### No Errors Should Appear Like:
- ❌ "apiCall is not defined"
- ❌ "showToast is not defined"
- ❌ "adminAPI is not defined"

## API Testing (Optional)

You can test the API directly using tools like Postman or curl:

```bash
# Get all categories
curl -X GET http://localhost:8080/admin/categories \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a category
curl -X POST http://localhost:8080/admin/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Traffic Violations",
    "description": "Traffic related offenses",
    "color": "#ff5722",
    "icon": "fa-car"
  }'

# Get cases by category
curl -X GET http://localhost:8080/admin/categories/1/cases \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Success Criteria

The categories feature is working correctly if:
- ✅ Database setup completed without errors
- ✅ Navigation menu shows Categories links
- ✅ Categories Management page loads and displays table
- ✅ Can create, edit, reorder categories
- ✅ Can toggle status and delete categories (with 0 cases)
- ✅ Cases by Category page loads and displays tabs
- ✅ Can switch between tabs and view cases
- ✅ No JavaScript errors in console
- ✅ API calls return proper responses

## Next Steps

After testing:
1. ✅ If everything works - you're done!
2. ❌ If issues found - check the troubleshooting section
3. 📝 Consider creating more custom categories for your needs
4. 📊 Update existing cases to assign them to categories
5. 🎨 Customize colors and icons to match your preferences

## Screenshots to Verify

Take screenshots of:
1. Categories Management page with table
2. Add/Edit Category modal
3. Cases by Category page with tabs
4. Category tab with cases listed
5. Browser console showing no errors

## Support

If you encounter issues not covered here:
1. Check browser console for specific error messages
2. Verify database connection in `.env`
3. Check server logs for PHP errors
4. Review the `CATEGORIES_README.md` for detailed documentation
