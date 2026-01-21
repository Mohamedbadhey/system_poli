# Categories Management Feature

## Overview
This feature adds comprehensive category management to the Police Case Management System (PCMS), allowing administrators to organize and view cases by custom categories.

## Features Implemented

### 1. Categories Management Page
- **CRUD Operations**: Create, Read, Update, Delete categories
- **Category Properties**:
  - Name (unique identifier)
  - Description
  - Color (for visual identification)
  - Icon (Font Awesome icons)
  - Active/Inactive status
  - Display order (reorderable)
- **Case Count**: Shows number of cases in each category
- **Smart Deletion**: Prevents deletion of categories that have associated cases

### 2. Cases by Category View
- **Tab-based Interface**: Each category appears as a colored tab
- **Visual Organization**: Categories display with custom colors and icons
- **Case Listing**: View all cases within each category
- **Role-based Access**: Shows only cases the user has permission to view
- **Real-time Counts**: Badge showing number of cases per category

## Database Schema

### Categories Table
```sql
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    icon VARCHAR(50) DEFAULT 'fa-folder',
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT UNSIGNED,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Default Categories
The system comes pre-populated with 7 default categories:
1. **Violent Crimes** - Red (#e74c3c)
2. **Property Crimes** - Orange (#f39c12)
3. **Drug Related** - Purple (#9b59b6)
4. **Cybercrime** - Blue (#3498db)
5. **Sexual Offenses** - Pink (#e91e63)
6. **Juvenile Cases** - Cyan (#00bcd4)
7. **Other** - Gray (#95a5a6)

## API Endpoints

### Admin Routes (require admin or super_admin role)

#### Get All Categories
```
GET /admin/categories
```
Returns all categories with case counts.

#### Get Single Category
```
GET /admin/categories/{id}
```
Returns category details with case count.

#### Create Category
```
POST /admin/categories
Body: {
    "name": "Category Name",
    "description": "Description",
    "color": "#3498db",
    "icon": "fa-folder",
    "is_active": 1
}
```

#### Update Category
```
PUT /admin/categories/{id}
Body: {
    "name": "Updated Name",
    "description": "Updated description",
    "color": "#e74c3c",
    "icon": "fa-hand-fist"
}
```

#### Delete Category
```
DELETE /admin/categories/{id}
```
Note: Cannot delete categories that have associated cases.

#### Toggle Category Status
```
POST /admin/categories/{id}/toggle-status
```

#### Update Display Order
```
POST /admin/categories/update-order
Body: {
    "order": [
        {"id": 1, "order": 1},
        {"id": 2, "order": 2}
    ]
}
```

#### Get Cases by Category
```
GET /admin/categories/{id}/cases
```
Returns category details and all cases in that category (filtered by user role/permissions).

## Files Created/Modified

### Backend
- `app/Database/schema_categories.sql` - Database schema
- `app/Models/CategoryModel.php` - Category model
- `app/Controllers/Admin/CategoryController.php` - Category controller
- `app/Config/Routes.php` - Added category routes

### Frontend
- `public/assets/js/categories.js` - Categories management JavaScript
- `public/assets/css/categories.css` - Categories styling
- `public/dashboard.html` - Updated to include new files
- `public/assets/js/app.js` - Updated navigation menu

### Setup
- `SETUP_CATEGORIES.bat` - Database setup script
- `CATEGORIES_README.md` - This documentation

## Installation

1. **Run Database Migration**:
   ```bash
   SETUP_CATEGORIES.bat
   ```
   This will create the categories table and populate it with default categories.

2. **Verify Installation**:
   - Log in as admin or super_admin
   - Check the navigation menu for "Categories" and "Cases by Category" links
   - Access the Categories Management page to verify the feature is working

## Usage

### For Administrators

#### Managing Categories
1. Navigate to **Categories** from the sidebar menu
2. View all existing categories with case counts
3. **Add New Category**:
   - Click "Add Category" button
   - Fill in name, description, color, and icon
   - Save
4. **Edit Category**:
   - Click edit icon on any category
   - Modify details
   - Update
5. **Reorder Categories**:
   - Use up/down arrows to change display order
6. **Toggle Status**:
   - Click toggle icon to activate/deactivate categories
7. **Delete Category**:
   - Only available for categories with 0 cases
   - Click delete icon

#### Viewing Cases by Category
1. Navigate to **Cases by Category** from the sidebar menu
2. Click on any category tab to view cases
3. Each tab shows:
   - Category name with icon and color
   - Number of cases in badge
4. Case list includes:
   - Case number
   - OB number
   - Crime type
   - Status and priority
   - Actions (view details)

### For Other Users
- **OB Officers**: Can view cases by category (their own cases)
- **Investigators**: Can view cases by category (assigned cases)
- **Court Users**: Can view cases by category (court-related cases)

## Role-Based Access

### Super Admin & Admin
- Full access to Categories Management
- Can create, edit, delete, reorder categories
- View all cases in categories (within their center)

### OB Officers
- View-only access to Cases by Category
- See only their own created cases

### Investigators
- View-only access to Cases by Category
- See only cases assigned to them

### Court Users
- View-only access to Cases by Category
- See only court-related cases

## Navigation Menu Updates

The navigation menu has been updated to include:

**Super Admin**:
- Categories (after Police Centers)
- Cases by Category (in admin section)

**Admin**:
- Categories (at end of menu)
- Cases by Category (after All Cases)

**OB Officer**:
- Cases by Category (after My Cases)

**Investigator**:
- Cases by Category (after Evidence Management)

**Court User**:
- Cases by Category (after Court Cases)

## Features Highlights

### Smart Category Management
- **Unique Names**: System prevents duplicate category names
- **Color Coding**: Each category has a custom color for visual identification
- **Icon Selection**: Choose from 12+ Font Awesome icons
- **Reorderable**: Drag-and-drop style reordering with up/down arrows
- **Status Control**: Activate/deactivate categories without deleting

### Enhanced Case Organization
- **Tab Interface**: Modern, intuitive tab-based navigation
- **Visual Indicators**: Colors and icons make categories easily identifiable
- **Live Counts**: See number of cases in each category at a glance
- **Responsive Design**: Works on desktop and mobile devices

### Audit Trail
- All category operations are logged in the audit system
- Tracks: creation, updates, deletions, status changes
- Includes user, timestamp, and changes made

## Technical Details

### Frontend Architecture
- **jQuery**: DOM manipulation and AJAX calls
- **SweetAlert2**: User-friendly alerts and confirmations
- **Modal System**: Reuses existing modal framework
- **Responsive CSS**: Mobile-first design approach

### Backend Architecture
- **CodeIgniter 4**: MVC framework
- **RESTful API**: Standard HTTP methods
- **Model Validation**: Built-in validation rules
- **Database Abstraction**: Query builder for flexibility

### Security
- **Authentication**: All routes protected by auth filter
- **Authorization**: Role-based access control
- **CSRF Protection**: Built-in CodeIgniter protection
- **SQL Injection**: Protected via query builder
- **XSS Protection**: HTML escaping in frontend

## Troubleshooting

### Categories table not found
- Run `SETUP_CATEGORIES.bat` to create the table
- Check database credentials in `.env` file

### Navigation menu not showing categories
- Clear browser cache
- Verify user role (admin or super_admin)
- Check JavaScript console for errors

### Cannot delete category
- Verify category has 0 associated cases
- Check if category is being used in any cases

### Cases not showing in category tabs
- Verify user has permission to view cases
- Check case `crime_category` field matches category name
- Ensure category is active

## Future Enhancements (Optional)

Potential improvements that could be added:
1. Drag-and-drop reordering
2. Category statistics and analytics
3. Export category reports
4. Category-based notifications
5. Subcategories support
6. Category templates
7. Bulk case category updates

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API endpoint documentation
3. Check browser console for JavaScript errors
4. Verify database schema is correctly installed
