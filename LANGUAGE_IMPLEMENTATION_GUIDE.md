# Language Translation Implementation Guide

## Overview
This guide explains how the Somali language translation feature has been implemented in the Police Case Management System (PCMS).

## Features Implemented

### 1. Database Changes
- Added `language` column to `users` table (VARCHAR(10), default: 'en')
- Migration file created: `database/migrations/2026-01-11-000001_add_language_to_users.php`
- SQL migration: `ADD_LANGUAGE_MIGRATION.sql`

### 2. Backend Components

#### Language Files
- **English**: `app/Language/en/App.php` - Contains all English translations
- **Somali**: `app/Language/so/App.php` - Contains all Somali translations

#### Controllers
- **LanguageController**: `app/Controllers/LanguageController.php`
  - `index()` - Get available languages
  - `getTranslations($langCode)` - Get translations for a language
  - `updateUserLanguage()` - Update user's language preference
  - `getUserLanguage($userId)` - Get user's current language

#### Models
- Updated `UserModel` to include `language` in `$allowedFields`

#### Helpers
- **language_helper.php**: `app/Helpers/language_helper.php`
  - `get_user_language()` - Get current user's language
  - `set_user_language($language)` - Set user's language
  - `translate($key, $params, $language)` - Get translated text
  - `lang_text($key, $params)` - Alias for translate

#### Routes
Added to `app/Config/Routes.php`:
```php
$routes->group('language', function($routes) {
    $routes->get('/', 'LanguageController::index');
    $routes->get('translations/(:segment)', 'LanguageController::getTranslations/$1');
    $routes->get('user/(:num)', 'LanguageController::getUserLanguage/$1', ['filter' => 'auth']);
    $routes->post('user/update', 'LanguageController::updateUserLanguage', ['filter' => 'auth']);
});
```

### 3. Frontend Components

#### JavaScript
- **language.js**: `public/assets/js/language.js`
  - `LanguageManager` object for managing translations
  - `init()` - Initialize language system
  - `setLanguage(langCode)` - Change language
  - `t(key, params)` - Get translation for a key
  - `translatePage()` - Translate all elements with data-i18n attributes
  - `saveUserLanguage(userId)` - Save preference to database

#### CSS
- **language.css**: `public/assets/css/language.css`
  - Styles for language dropdown
  - Responsive design

#### HTML Updates

**Login Page (index.html)**:
- Added language selector dropdown at top-right
- All text elements tagged with `data-i18n` attributes
- Language selection persists across sessions

**Dashboard (dashboard.html)**:
- Added language dropdown in topbar
- Integrated with user menu
- All navigation and menu items support translation

### 4. Translation System

#### How to Add Translations
Use `data-i18n` attributes on HTML elements:

```html
<!-- Text content -->
<h1 data-i18n="welcome">Welcome</h1>

<!-- Placeholder -->
<input data-i18n-placeholder="enter_username" placeholder="Enter username">

<!-- Title attribute -->
<button data-i18n-title="save">Save</button>
```

#### Available Translation Keys
See `app/Language/en/App.php` or `app/Language/so/App.php` for complete list. Major categories include:
- Common UI elements (save, cancel, delete, etc.)
- Authentication (login, logout, password, etc.)
- User roles (admin, investigator, etc.)
- Cases (case_number, incident_date, etc.)
- Evidence (evidence_type, collected_by, etc.)
- Persons (suspect, victim, witness, etc.)
- Reports (generate_report, view_report, etc.)
- Court (court_status, send_to_court, etc.)
- Messages (success, error, loading, etc.)

## Installation Steps

### 1. Apply Database Migration

**Option A - Using Migration File**:
```bash
php spark migrate
```

**Option B - Using SQL File**:
Run the batch file:
```bash
APPLY_LANGUAGE_MIGRATION.bat
```

Or manually run:
```sql
mysql -u root -p pcms_db < ADD_LANGUAGE_MIGRATION.sql
```

### 2. Verify Installation

1. Login to the system
2. Look for the language selector (flag icon) in the top-right corner
3. Click on it to see available languages (English & Somali)
4. Switch between languages to test

### 3. Test Language Switching

1. **Login Page**:
   - Select language from dropdown
   - Verify all text changes
   - Login and check if preference is saved

2. **Dashboard**:
   - Click language button in topbar
   - Select a language
   - Verify page reloads with new language
   - Check that preference is saved to database

## How It Works

### Language Flow

1. **Page Load**:
   - `LanguageManager.init()` is called
   - Checks localStorage for saved language preference
   - Loads translations from API
   - Applies translations to page

2. **Language Change**:
   - User selects language from dropdown
   - `changeLanguage(langCode)` is called
   - Translations are loaded via API
   - Page is translated using `LanguageManager.translatePage()`
   - Preference saved to localStorage and database
   - Page reloads to apply translations to dynamic content

3. **Translation Lookup**:
   - `LanguageManager.t(key)` looks up translation key
   - Returns translated text from loaded translations
   - Falls back to key name if translation not found

## Supported Languages

1. **English (en)**: 🇬🇧 Default language
2. **Somali (so)**: 🇸🇴 Full translation provided

## Adding New Languages

To add a new language:

1. **Create Language File**:
   ```php
   // app/Language/xx/App.php (xx = language code)
   <?php
   return [
       'welcome' => 'Your Translation',
       // ... more translations
   ];
   ```

2. **Update LanguageController**:
   ```php
   protected $supportedLanguages = ['en', 'so', 'xx'];
   ```

3. **Add to UI**:
   ```html
   <a href="#" onclick="changeLanguage('xx')">
       <span class="flag">🏳️</span> Language Name
   </a>
   ```

## Translation Coverage

The following areas are translated:

✅ Login page
✅ Dashboard header and navigation
✅ User dropdown menu
✅ Common UI elements (buttons, labels)
✅ System messages

### Areas for Future Translation

The following areas will need translation as you add data-i18n attributes:

- [ ] Case management forms
- [ ] Evidence management
- [ ] Person management
- [ ] Reports and analytics
- [ ] Court workflow pages
- [ ] Admin panels
- [ ] Modal dialogs
- [ ] Validation messages
- [ ] Error messages

## Best Practices

1. **Always use translation keys**: Never hardcode text in HTML
2. **Keep keys consistent**: Use snake_case for translation keys
3. **Group related translations**: Organize keys logically
4. **Provide context**: Add comments in language files
5. **Test both languages**: Always verify translations work correctly
6. **Update both files**: When adding keys, update both en and so files

## Troubleshooting

### Language not changing?
- Check browser console for errors
- Verify API endpoint is accessible: `/language/translations/en`
- Clear localStorage: `localStorage.removeItem('user_language')`

### Translations not showing?
- Verify `data-i18n` attributes are set correctly
- Check translation key exists in language file
- Ensure language.js is loaded before other scripts

### Language preference not saving?
- Verify user is logged in
- Check `/language/user/update` endpoint
- Verify database column was added correctly

## API Endpoints

- `GET /language` - Get available languages
- `GET /language/translations/{langCode}` - Get translations
- `GET /language/user/{userId}` - Get user's language (requires auth)
- `POST /language/user/update` - Update user's language (requires auth)

## Files Modified/Created

### Created:
- `database/migrations/2026-01-11-000001_add_language_to_users.php`
- `ADD_LANGUAGE_MIGRATION.sql`
- `APPLY_LANGUAGE_MIGRATION.bat`
- `app/Language/en/App.php`
- `app/Language/so/App.php`
- `app/Controllers/LanguageController.php`
- `app/Helpers/language_helper.php`
- `public/assets/js/language.js`
- `public/assets/css/language.css`
- `LANGUAGE_IMPLEMENTATION_GUIDE.md`

### Modified:
- `app/Config/Routes.php` - Added language routes
- `app/Models/UserModel.php` - Added language to allowedFields
- `public/index.html` - Added language selector and data-i18n attributes
- `public/dashboard.html` - Added language dropdown and data-i18n attributes
- `public/assets/js/app.js` - Added toggleLanguageMenu function

## Support

For issues or questions about the language implementation, check:
1. Browser console for JavaScript errors
2. CodeIgniter logs in `writable/logs/`
3. Database structure with `DESCRIBE users;`
4. API responses with browser developer tools

---

**Version**: 1.0
**Date**: January 11, 2026
**Author**: Rovo Dev
