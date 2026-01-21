<?php
/**
 * Categories Management Setup Script
 * This script creates the categories table and populates it with default categories
 */

echo "========================================\n";
echo "Categories Management Setup\n";
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
    
    echo "Creating categories table...\n";
    
    // Read and execute SQL file
    $sqlFile = __DIR__ . '/app/Database/schema_categories.sql';
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
    
    foreach ($statements as $statement) {
        if (stripos($statement, 'CREATE TABLE') !== false) {
            echo "  - Creating categories table...\n";
        } elseif (stripos($statement, 'INSERT INTO') !== false) {
            echo "  - Inserting default categories...\n";
        }
        
        if (!$mysqli->query($statement)) {
            throw new Exception("Query failed: " . $mysqli->error . "\nStatement: " . substr($statement, 0, 100));
        }
    }
    
    echo "\n========================================\n";
    echo "✓ Categories table created successfully!\n";
    echo "========================================\n\n";
    
    // Verify installation
    $result = $mysqli->query("SELECT COUNT(*) as count FROM categories");
    $row = $result->fetch_assoc();
    echo "Total categories: " . $row['count'] . "\n\n";
    
    echo "You can now:\n";
    echo "1. Access Categories Management from the admin menu\n";
    echo "2. Create and manage case categories\n";
    echo "3. View cases organized by categories\n\n";
    
    // List default categories
    echo "Default Categories:\n";
    $result = $mysqli->query("SELECT * FROM categories ORDER BY display_order ASC");
    
    while ($category = $result->fetch_assoc()) {
        echo "  - {$category['name']} ({$category['color']}) - {$category['icon']}\n";
    }
    
    echo "\n";
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo "\n========================================\n";
    echo "✗ ERROR: Failed to create categories table\n";
    echo "========================================\n\n";
    echo "Error: " . $e->getMessage() . "\n\n";
    exit(1);
}

echo "Setup complete!\n";
