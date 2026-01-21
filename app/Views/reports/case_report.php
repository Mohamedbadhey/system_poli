<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Case Report - <?= esc($case['case_number']) ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 20px;
            background: #fff;
        }
        
        .report-container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
        }
        
        .report-header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .report-header h1 {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .report-header .case-number {
            font-size: 20px;
            color: #3498db;
            font-weight: bold;
        }
        
        .report-meta {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        
        .report-meta table {
            width: 100%;
        }
        
        .report-meta td {
            padding: 5px;
        }
        
        .report-meta td:first-child {
            font-weight: bold;
            width: 200px;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            background: #34495e;
            color: white;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .section-content {
            padding: 0 15px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        table th {
            background: #3498db;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
        }
        
        table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        
        table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .badge-success { background: #27ae60; color: white; }
        .badge-warning { background: #f39c12; color: white; }
        .badge-danger { background: #e74c3c; color: white; }
        .badge-info { background: #3498db; color: white; }
        .badge-secondary { background: #95a5a6; color: white; }
        
        .party-card {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .party-card h4 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .info-item strong {
            display: block;
            color: #7f8c8d;
            font-size: 12px;
            margin-bottom: 3px;
        }
        
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .print-btn:hover {
            background: #2980b9;
        }
        
        @media print {
            .print-btn {
                display: none;
            }
            
            body {
                padding: 0;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">
        <i class="fas fa-print"></i> Print Report
    </button>
    
    <div class="report-container">
        <!-- Report Header -->
        <div class="report-header">
            <h1>POLICE CASE REPORT</h1>
            <div class="case-number">Case #<?= esc($case['case_number']) ?></div>
            <div>OB Number: <?= esc($case['ob_number']) ?></div>
        </div>
        
        <!-- Case Information -->
        <div class="report-meta">
            <table>
                <tr>
                    <td><strong>Status:</strong></td>
                    <td><?= strtoupper(str_replace('_', ' ', $case['status'])) ?></td>
                    <td><strong>Priority:</strong></td>
                    <td><?= strtoupper($case['priority'] ?? 'N/A') ?></td>
                </tr>
                <tr>
                    <td><strong>Crime Category:</strong></td>
                    <td><?= esc($case['crime_category'] ?? 'N/A') ?></td>
                    <td><strong>Crime Type:</strong></td>
                    <td><?= esc($case['crime_type']) ?></td>
                </tr>
                <tr>
                    <td><strong>Incident Date:</strong></td>
                    <td><?= date('d M Y, H:i', strtotime($case['incident_date'])) ?></td>
                    <td><strong>Location:</strong></td>
                    <td><?= esc($case['incident_location'] ?? 'N/A') ?></td>
                </tr>
                <tr>
                    <td><strong>Created By:</strong></td>
                    <td><?= esc($created_by['full_name'] ?? 'N/A') ?></td>
                    <td><strong>Created At:</strong></td>
                    <td><?= date('d M Y, H:i', strtotime($case['created_at'])) ?></td>
                </tr>
                <?php if ($case['court_status'] && $case['court_status'] !== 'not_sent'): ?>
                <tr>
                    <td><strong>Court Status:</strong></td>
                    <td colspan="3"><?= strtoupper(str_replace('_', ' ', $case['court_status'])) ?></td>
                </tr>
                <?php endif; ?>
            </table>
        </div>
        
        <!-- Case Description -->
        <div class="section">
            <div class="section-title">Case Description</div>
            <div class="section-content">
                <p><?= nl2br(esc($case['incident_description'] ?? 'No description provided')) ?></p>
            </div>
        </div>
        
        <!-- Accused Persons -->
        <?php if (!empty($parties['accused'])): ?>
        <div class="section">
            <div class="section-title">Accused Person(s)</div>
            <div class="section-content">
                <?php foreach ($parties['accused'] as $accused): ?>
                <div class="party-card">
                    <h4><?= esc($accused['full_name']) ?></h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>ID Number:</strong>
                            <?= esc($accused['id_number'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Gender:</strong>
                            <?= esc($accused['gender'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Phone:</strong>
                            <?= esc($accused['phone'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Address:</strong>
                            <?= esc($accused['address'] ?? 'N/A') ?>
                        </div>
                    </div>
                    <?php if (!empty($accused['notes'])): ?>
                    <p style="margin-top: 10px;"><strong>Notes:</strong> <?= esc($accused['notes']) ?></p>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Victims -->
        <?php if (!empty($parties['victims'])): ?>
        <div class="section">
            <div class="section-title">Victim(s)</div>
            <div class="section-content">
                <?php foreach ($parties['victims'] as $victim): ?>
                <div class="party-card">
                    <h4><?= esc($victim['full_name']) ?></h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>ID Number:</strong>
                            <?= esc($victim['id_number'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Gender:</strong>
                            <?= esc($victim['gender'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Phone:</strong>
                            <?= esc($victim['phone'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Address:</strong>
                            <?= esc($victim['address'] ?? 'N/A') ?>
                        </div>
                    </div>
                    <?php if (!empty($victim['notes'])): ?>
                    <p style="margin-top: 10px;"><strong>Notes:</strong> <?= esc($victim['notes']) ?></p>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Witnesses -->
        <?php if (!empty($parties['witnesses'])): ?>
        <div class="section">
            <div class="section-title">Witness(es)</div>
            <div class="section-content">
                <?php foreach ($parties['witnesses'] as $witness): ?>
                <div class="party-card">
                    <h4><?= esc($witness['full_name']) ?></h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Phone:</strong>
                            <?= esc($witness['phone'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Address:</strong>
                            <?= esc($witness['address'] ?? 'N/A') ?>
                        </div>
                    </div>
                    <?php if (!empty($witness['notes'])): ?>
                    <p style="margin-top: 10px;"><strong>Notes:</strong> <?= esc($witness['notes']) ?></p>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Evidence -->
        <?php if (!empty($evidence)): ?>
        <div class="section">
            <div class="section-title">Evidence (<?= count($evidence) ?> item(s))</div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Collected By</th>
                            <th>Collected At</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($evidence as $item): ?>
                        <tr>
                            <td><?= esc($item['evidence_type']) ?></td>
                            <td><?= esc($item['description']) ?></td>
                            <td><?= esc($item['collected_by_name'] ?? 'N/A') ?></td>
                            <td><?= date('d M Y', strtotime($item['collected_at'])) ?></td>
                            <td><?= esc($item['storage_location'] ?? 'N/A') ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Investigators Assigned -->
        <?php if (!empty($assignments)): ?>
        <div class="section">
            <div class="section-title">Investigators Assigned</div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Assigned Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($assignments as $assignment): ?>
                        <tr>
                            <td><?= esc($assignment['investigator_name']) ?></td>
                            <td><?= $assignment['is_lead_investigator'] ? 'Lead' : 'Support' ?></td>
                            <td><?= date('d M Y', strtotime($assignment['assigned_at'])) ?></td>
                            <td><span class="badge badge-info"><?= esc($assignment['status']) ?></span></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Court Assignment -->
        <?php if ($court_assignment): ?>
        <div class="section">
            <div class="section-title">Court Assignment</div>
            <div class="section-content">
                <div class="party-card">
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Assigned To:</strong>
                            <?= esc($court_assignment['investigator_name'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Assigned By:</strong>
                            <?= esc($court_assignment['assigned_by_name'] ?? 'N/A') ?>
                        </div>
                        <div class="info-item">
                            <strong>Deadline:</strong>
                            <?= $court_assignment['deadline'] ? date('d M Y', strtotime($court_assignment['deadline'])) : 'N/A' ?>
                        </div>
                        <div class="info-item">
                            <strong>Status:</strong>
                            <span class="badge badge-warning"><?= esc($court_assignment['status']) ?></span>
                        </div>
                    </div>
                    <?php if (!empty($court_assignment['notes'])): ?>
                    <p style="margin-top: 10px;"><strong>Notes:</strong> <?= esc($court_assignment['notes']) ?></p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Case History -->
        <?php if (!empty($history)): ?>
        <div class="section">
            <div class="section-title">Case History</div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Changed By</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($history as $entry): ?>
                        <tr>
                            <td><?= date('d M Y, H:i', strtotime($entry['changed_at'])) ?></td>
                            <td><?= esc($entry['changed_by_name']) ?></td>
                            <td><?= esc($entry['previous_status']) ?></td>
                            <td><?= esc($entry['new_status']) ?></td>
                            <td><?= esc($entry['reason'] ?? 'N/A') ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Footer -->
        <div class="footer">
            <p>Report Generated: <?= date('l, d F Y \a\t H:i:s') ?></p>
            <p>Police Case Management System - CONFIDENTIAL DOCUMENT</p>
        </div>
    </div>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</body>
</html>
