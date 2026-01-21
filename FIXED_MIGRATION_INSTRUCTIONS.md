# Fixed Migration Instructions

## ✅ The Error Has Been Fixed!

The foreign key constraint error has been resolved. The migration file now:
1. Drops the table if it exists (to start fresh)
2. Creates the table without foreign keys first
3. Then conditionally adds foreign keys only if the referenced tables exist

---

## 🚀 How to Apply the Migration

### Method 1: Using phpMyAdmin (Recommended)

1. **Open phpMyAdmin** in your browser
2. **Select the database** `pcms_db` from the left sidebar
3. **Click on the "SQL" tab** at the top
4. **Open the file** `app/Database/non_criminal_certificates_migration.sql` in a text editor
5. **Copy ALL the content** (Ctrl+A, Ctrl+C)
6. **Paste it** into the SQL text area in phpMyAdmin
7. **Click "Go"** button at the bottom right
8. **✅ Success!** You should see "Query OK" messages

---

### Method 2: Using MySQL Command Line

If you have MySQL in your PATH:

```bash
# Navigate to your project directory
cd C:\path\to\your\project

# Run the migration
mysql -u root -p pcms_db < app/Database/non_criminal_certificates_migration.sql

# Enter your password when prompted
```

---

### Method 3: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Open the file `app/Database/non_criminal_certificates_migration.sql`
4. Click the lightning bolt icon (Execute)
5. Check for success message

---

## ✅ Verify the Migration Was Successful

After running the migration, verify it worked:

### In phpMyAdmin:
1. Click on `pcms_db` database
2. Look for `non_criminal_certificates` in the table list
3. Click on it to see the structure

### Or run this SQL query:
```sql
-- Check table exists
SHOW TABLES LIKE 'non_criminal_certificates';

-- View table structure
DESCRIBE non_criminal_certificates;

-- Should show 22 columns including:
-- id, certificate_number, person_id, person_name, mother_name, gender,
-- birth_date, birth_place, photo_path, purpose, validity_period,
-- issue_date, director_name, director_signature, issued_by,
-- verification_token, is_active, verification_count, last_verified_at,
-- notes, created_at, updated_at
```

---

## 🎯 Expected Output

You should see:
```
# Table: non_criminal_certificates
# Rows: 0
# Structure: 22 columns
# Indexes: 6 (including PRIMARY, UNIQUE keys)
# Foreign Keys: 2 (if persons and users tables exist)
```

---

## ❌ If You Still Get Errors

### Error: "Table already exists"
**Solution**: The migration now includes `DROP TABLE IF EXISTS`, so this shouldn't happen. But if it does:
```sql
DROP TABLE IF EXISTS non_criminal_certificates;
```
Then run the migration again.

### Error: "Access denied"
**Solution**: Make sure your MySQL user has CREATE TABLE permissions:
```sql
GRANT CREATE, ALTER, DROP ON pcms_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Database doesn't exist"
**Solution**: Create the database first:
```sql
CREATE DATABASE IF NOT EXISTS pcms_db;
USE pcms_db;
```
Then run the migration.

---

## 🎉 Next Steps After Successful Migration

Once the table is created:

1. **Restart your PHP server**:
   ```bash
   # Stop current server (Ctrl+C)
   php spark serve
   ```

2. **Test the feature**:
   - Open: `http://localhost:8080/assets/pages/non-criminal-certificate.html`
   - Fill in the form
   - Click "Save"
   - QR code should appear!

3. **Verify in database**:
   ```sql
   SELECT * FROM non_criminal_certificates;
   ```

---

## 📞 Need More Help?

If you're still having issues:
1. **Copy the exact error message** from phpMyAdmin
2. **Check if these tables exist**:
   ```sql
   SHOW TABLES LIKE 'persons';
   SHOW TABLES LIKE 'users';
   ```
3. **Verify your MySQL version**:
   ```sql
   SELECT VERSION();
   ```

The migration should work on MySQL 5.6+ and MariaDB 10.0+

---

**Last Updated**: January 15, 2026
**Status**: ✅ Ready to Apply
