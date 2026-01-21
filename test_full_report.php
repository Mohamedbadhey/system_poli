<?php
/**
 * Simple test script to check Full Report functionality
 * Access at: http://localhost:8080/test_full_report.php?case_id=1
 */

// Include CodeIgniter bootstrap
require_once __DIR__ . '/vendor/autoload.php';

?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Full Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .test-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            padding: 10px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <h1>🧪 Full Report Test Page</h1>
    
    <div class="test-section">
        <h2>1. Check Database Table</h2>
        <button onclick="checkTable()">Check investigator_conclusions Table</button>
        <div id="tableResult"></div>
    </div>
    
    <div class="test-section">
        <h2>2. Test Report Generation</h2>
        <label>Case ID: <input type="number" id="caseId" value="1" style="padding: 5px;"></label>
        <button onclick="testReport()">Test Full Report</button>
        <div id="reportResult"></div>
    </div>
    
    <div class="test-section">
        <h2>3. Check Logs</h2>
        <button onclick="checkLogs()">View Recent Logs</button>
        <div id="logsResult"></div>
    </div>

    <script>
        const API_BASE = 'http://localhost:8080';
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            document.body.innerHTML = '<h2 class="error">Please login first at <a href="index.html">index.html</a></h2>';
        }

        async function checkTable() {
            const result = document.getElementById('tableResult');
            result.innerHTML = '<p class="info">Checking...</p>';
            
            try {
                // Try to query the table via API
                const response = await fetch(`${API_BASE}/investigation/cases/1/conclusion`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                if (response.status === 404) {
                    result.innerHTML = '<p class="error">✗ Table might not exist or no data found</p>';
                } else if (response.status === 500) {
                    result.innerHTML = '<p class="error">✗ Server error - table likely doesn\'t exist</p>';
                } else {
                    result.innerHTML = '<p class="success">✓ Table exists and API is working!</p>';
                }
            } catch (error) {
                result.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            }
        }

        async function testReport() {
            const result = document.getElementById('reportResult');
            const caseId = document.getElementById('caseId').value;
            result.innerHTML = '<p class="info">Generating report...</p>';
            
            try {
                const response = await fetch(`${API_BASE}/investigation/cases/${caseId}/report/full`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('text/html')) {
                    const html = await response.text();
                    
                    if (html.includes('Error')) {
                        result.innerHTML = '<p class="error">✗ Report generation failed</p><pre>' + 
                            html.substring(0, 500) + '</pre>';
                    } else {
                        result.innerHTML = '<p class="success">✓ Report generated successfully!</p>' +
                            '<button onclick="window.open(\'/investigation/cases/' + caseId + 
                            '/report/full\', \'_blank\')">Open Full Report</button>';
                    }
                } else {
                    const json = await response.json();
                    result.innerHTML = '<p class="error">API Error:</p><pre>' + 
                        JSON.stringify(json, null, 2) + '</pre>';
                }
            } catch (error) {
                result.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            }
        }

        async function checkLogs() {
            const result = document.getElementById('logsResult');
            result.innerHTML = '<p class="info">Logs are stored in: <code>writable/logs/log-' + 
                new Date().toISOString().split('T')[0] + '.log</code></p>' +
                '<p>Check the file for detailed error messages.</p>' +
                '<p>Look for lines containing: <code>Full report</code></p>';
        }
    </script>
</body>
</html>
