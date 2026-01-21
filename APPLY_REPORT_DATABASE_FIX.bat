@echo off
echo ============================================
echo APPLYING REPORT DATABASE FIX
echo ============================================
echo.

REM Load environment variables
for /f "tokens=1,2 delims==" %%a in (env) do (
    set %%a=%%b
)

echo Applying database fixes for report generation...
echo This will create missing tables and columns needed for reports
echo.

REM Execute the SQL file
php -r "
$host = getenv('DB_HOST') ?: 'localhost';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';
$db = getenv('DB_NAME') ?: 'pcms_db';

echo \"Connecting to database: $db@$host...\n\";

try {
    \$pdo = new PDO(\"mysql:host=\$host;dbname=\$db;charset=utf8mb4\", \$user, \$pass);
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo \"Connected successfully!\n\n\";
    
    \$sql = file_get_contents('FIX_REPORT_DATABASE_ISSUES.sql');
    
    // Split by semicolons but keep SET statements together
    \$statements = [];
    \$current = '';
    \$lines = explode(\"\n\", \$sql);
    
    foreach (\$lines as \$line) {
        \$line = trim(\$line);
        if (empty(\$line) || strpos(\$line, '--') === 0) continue;
        
        \$current .= \$line . ' ';
        
        if (substr(\$line, -1) === ';') {
            \$statements[] = trim(\$current);
            \$current = '';
        }
    }
    
    foreach (\$statements as \$statement) {
        if (empty(\$statement)) continue;
        
        try {
            \$pdo->exec(\$statement);
            if (stripos(\$statement, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE[^`]*`?(\w+)`?/i', \$statement, \$matches);
                if (isset(\$matches[1])) {
                    echo \"✓ Table: {\$matches[1]}\n\";
                }
            } else if (stripos(\$statement, 'ALTER TABLE') !== false) {
                preg_match('/ALTER TABLE[^`]*`?(\w+)`?/i', \$statement, \$matches);
                if (isset(\$matches[1])) {
                    echo \"✓ Modified: {\$matches[1]}\n\";
                }
            }
        } catch (PDOException \$e) {
            // Ignore duplicate errors, show others
            if (strpos(\$e->getMessage(), 'Duplicate') === false && 
                strpos(\$e->getMessage(), 'already exists') === false) {
                echo \"⚠ Warning: \" . \$e->getMessage() . \"\n\";
            }
        }
    }
    
    echo \"\n✓ Database structure updated successfully!\n\";
    echo \"✓ Report generation should now work properly.\n\";
    
} catch (PDOException \$e) {
    echo \"✗ Error: \" . \$e->getMessage() . \"\n\";
    exit(1);
}
"

echo.
echo ============================================
echo DONE!
echo ============================================
echo.
echo Next steps:
echo 1. Upload the fixed model file: app/Models/SavedFullReportModel.php
echo 2. Try generating a report again
echo.
pause
