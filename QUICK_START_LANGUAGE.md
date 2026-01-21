# Quick Start Guide - Language Translation Feature

## 🚀 Get Started in 3 Steps

### Step 1: Apply Database Migration (1 minute)

Double-click the batch file:
```
APPLY_LANGUAGE_MIGRATION.bat
```

**What it does**: Adds a `language` column to the `users` table.

### Step 2: Clear Browser Cache (30 seconds)

Press `Ctrl + Shift + Delete` and clear cache, or do a hard refresh with `Ctrl + F5`.

### Step 3: Test It! (2 minutes)

1. **Open Login Page**: Navigate to your PCMS login page
2. **See Language Selector**: Look at top-right corner (shows: 🇬🇧 English / 🇸🇴 Soomaali)
3. **Switch to Somali**: Click dropdown and select "🇸🇴 Soomaali"
4. **Watch Magic Happen**: Everything changes to Somali!

## 🎯 Features

✅ **Two Languages Supported**:
- English (🇬🇧) - Default
- Somali (🇸🇴) - Full translation

✅ **Smart Preference Saving**:
- Your language choice is remembered
- Saved to your user account
- Works across devices

✅ **Easy to Use**:
- One-click language switching
- Instant page translation
- Beautiful UI

## 📍 Where to Find Language Switcher

### Login Page
Top-right corner dropdown selector

### Dashboard
Top navigation bar, next to notifications (flag button)

## 🔧 How to Use

### Change Language on Login
1. Before logging in, select your preferred language
2. Login as usual
3. System remembers your choice

### Change Language After Login
1. Click the flag button (shows current language)
2. Select new language from dropdown
3. Page reloads with new language
4. Preference saved automatically

## 📝 What's Translated

Currently translated areas:
- ✅ Login page (all text)
- ✅ Dashboard header
- ✅ User menu
- ✅ Language selector itself
- ✅ System messages
- ✅ Common buttons (Save, Cancel, Delete, etc.)

## 🌍 Sample Translations

| English | Somali (Soomaali) |
|---------|-------------------|
| Welcome Back | Ku soo dhawoow |
| Login | Gal |
| Logout | Ka bax |
| Username | Magaca Isticmaalaha |
| Password | Furaha Sirta ah |
| Dashboard | Dashboord |
| Cases | Kiisaska |
| Evidence | Caddayn |
| Reports | Warbixinno |
| Save | Keydi |
| Cancel | Jooji |
| Delete | Tirtir |
| Edit | Wax ka badal |
| Search | Raadi |

## ❓ Troubleshooting

**Q: Language not changing?**
- Clear browser cache (Ctrl + Shift + Delete)
- Check console for errors (F12)
- Verify you're logged in

**Q: Language resets after refresh?**
- Make sure you applied database migration
- Check if localStorage is enabled

**Q: Some text not translating?**
- Those elements will be translated in future updates
- Only login and dashboard are fully translated now

## 🎓 For Developers

Want to add translations to your custom pages?

1. **Add translation keys** to language files:
   - `app/Language/en/App.php`
   - `app/Language/so/App.php`

2. **Tag HTML elements**:
   ```html
   <h1 data-i18n="your_key">Your Text</h1>
   ```

3. **For placeholders**:
   ```html
   <input data-i18n-placeholder="your_key" placeholder="Text">
   ```

4. **In JavaScript**:
   ```javascript
   LanguageManager.t('your_key')
   ```

See `LANGUAGE_IMPLEMENTATION_GUIDE.md` for full documentation.

## 📞 Support

If you encounter issues:
1. Check `TEST_LANGUAGE_FEATURE.md` for testing guide
2. Review `LANGUAGE_IMPLEMENTATION_GUIDE.md` for detailed docs
3. Check browser console for errors
4. Verify database migration was applied

---

**Enjoy using PCMS in your preferred language! 🎉**

*Ku raaxayso isticmaalka PCMS luqaddaada! 🎉*
