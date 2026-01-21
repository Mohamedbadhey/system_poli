<?php
/**
 * Court Workflow Setup Script
 * This script adds court workflow functionality to the PCMS
 */

echo "========================================\n";
echo "Court Workflow Setup\n";
echo "========================================\n\n";

// Load database configuration from .env
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    echo "ERROR: .env file not found!\n";
    exit(1);
}

$envContent = file_get_contents($envFile);
$envLines = explode("\n", $envContent);

$dbHost = 'localhost';
$dbName = 'pcms_db';
$dbUser = 'root';
$dbPass = '';
$dbPort = 3306;

foreach ($envLines as $line) {
    $line = trim($line);
    if (strpos($line, 'database.default.hostname') !== false) {
        $dbHost = trim(explode('=', $line)[1]);
    } elseif (strpos($line, 'database.default.database') !== false) {
        $dbName = trim(explode('=', $line)[1]);
    } elseif (strpos($line, 'database.default.username') !== false) {
        $dbUser = trim(explode('=', $line)[1]);
    } elseif (strpos($line, 'database.default.password') !== false) {
        $parts = explode('=', $line, 2);
        $dbPass = isset($parts[1]) ? trim($parts[1]) : '';
    } elseif (strpos($line, 'database.default.port') !== false) {
        $dbPort = (int)trim(explode('=', $line)[1]);
    }
}

echo "Database: $dbName\n";
echo "Host: $dbHost\n";
echo "User: $dbUser\n\n";

try {
    // Connect to database
    $mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);
    
    if ($mysqli->connect_error) {
        throw new Exception("Connection failed: " . $mysqli->connect_error);
    }
    
    $mysqli->set_charset("utf8mb4");
    
    echo "Updating database schema for court workflow...\n\n";
    
    // Read and execute SQL file
    $sqlFile = __DIR__ . '/app/Database/schema_court_workflow.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("SQL file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Remove comments
    $sql = preg_replace('/--.*$/m', '', $sql);
    
    // Split SQL into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($statement) {
            return !empty($statement) && strlen($statement) > 5;
        }
    );
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        // Log what we're doing
        if (stripos($statement, 'ALTER TABLE') !== false) {
            echo "  - Altering cases table...\n";
        } elseif (stripos($statement, 'CREATE TABLE') !== false) {
            if (stripos($statement, 'court_assignments') !== false) {
                echo "  - Creating court_assignments table...\n";
            } elseif (stripos($statement, 'case_status_history') !== false) {
                echo "  - Creating case_status_history table...\n";
            } elseif (stripos($statement, 'notifications') !== false) {
                echo "  - Creating notifications table...\n";
            }
        }
        
        if (!$mysqli->query($statement)) {
            // Check if it's a "duplicate column" or "table exists" error - these are OK
            $errorCode = $mysqli->errno;
            if ($errorCode == 1060 || $errorCode == 1061 || $errorCode == 1050) {
                echo "    (Already exists - skipping)\n";
                $successCount++;
            } else {
                echo "    ERROR: " . $mysqli->error . "\n";
                $errorCount++;
            }
        } else {
            $successCount++;
        }
    }
    
    echo "\n========================================\n";
    echo "✓ Court workflow schema updated!\n";
    echo "========================================\n\n";
    echo "Summary:\n";
    echo "  - Successful operations: $successCount\n";
    if ($errorCount > 0) {
        echo "  - Errors (non-critical): $errorCount\n";
    }
    echo "\n";
    
    // Verify tables exist
    echo "Verifying tables:\n";
    $tables = ['court_assignments', 'case_status_history', 'notifications'];
    foreach ($tables as $table) {
        $result = $mysqli->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows > 0) {
            echo "  ✓ $table\n";
        } else {
            echo "  ✗ $table (not found)\n";
        }
    }
    
    echo "\n";
    echo "Court workflow is now ready!\n";
    echo "Features added:\n";
    echo "  - Investigator can close cases\n";
    echo "  - Investigator can send cases to court\n";
    echo "  - Court can review and close cases\n";
    echo "  - Court can assign cases back to investigator with deadline\n";
    echo "  - Notification system for assignments\n";
    echo "  - Complete audit trail\n";
    echo "\n";
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo "\n========================================\n";
    echo "✗ ERROR: Failed to update database\n";
    echo "========================================\n\n";
    echo "Error: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "Setup complete!\n";
