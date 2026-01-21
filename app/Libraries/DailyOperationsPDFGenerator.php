<?php

namespace App\Libraries;

use Mpdf\Mpdf;
use Exception;

class DailyOperationsPDFGenerator
{
    protected $mpdf;
    protected $config;

    protected $reportSettingsModel;

    public function __construct()
    {
        $this->config = [
            'mode' => 'utf-8',
            'format' => 'A4',
            'default_font_size' => 10,
            'default_font' => 'dejavusans',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 30,
            'margin_bottom' => 20,
            'margin_header' => 10,
            'margin_footer' => 10,
            'orientation' => 'L', // Landscape for better table display
            'tempDir' => WRITEPATH . 'cache'
        ];
        
        // Initialize Report Settings Model
        $this->reportSettingsModel = new \App\Models\ReportSettingsModel();
    }

    /**
     * Generate Daily Operations PDF Report
     * 
     * @param array $data Operations data
     * @param string $period Time period
     * @param string $date Date filter
     * @param string $language Language (en/so)
     * @return array Result with PDF URL and path
     */
    public function generateDailyOperationsReport($data, $period = 'today', $date = null, $language = 'en')
    {
        try {
            // Initialize mPDF
            $this->mpdf = new Mpdf($this->config);
            
            // Set document properties
            $this->mpdf->SetTitle('Daily Operations Report - ' . $date);
            $this->mpdf->SetAuthor('Jubaland Police - Case Management System');
            $this->mpdf->SetCreator('PCMS Daily Operations Generator');
            
            // Generate HTML content
            $html = $this->buildReportHTML($data, $period, $date, $language);
            
            // Write HTML to PDF
            $this->mpdf->WriteHTML($html);
            
            // Create filename
            $filename = 'daily-operations-' . $date . '-' . $period . '.pdf';
            
            // Save to file
            $basePath = FCPATH . 'uploads/reports/daily-operations/';
            if (!is_dir($basePath)) {
                mkdir($basePath, 0755, true);
            }
            
            $fullPath = $basePath . $filename;
            $this->mpdf->Output($fullPath, 'F');
            
            return [
                'success' => true,
                'filename' => $filename,
                'url' => '/uploads/reports/daily-operations/' . $filename,
                'full_url' => base_url('/uploads/reports/daily-operations/' . $filename),
                'file_path' => $fullPath
            ];
            
        } catch (Exception $e) {
            log_message('error', 'Daily Operations PDF Generation Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Build HTML content for the report
     */
    private function buildReportHTML($data, $period, $date, $language)
    {
        $stats = $data['stats'];
        $periodLabel = $this->getPeriodLabel($period, $language);
        
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            margin: 20mm 15mm;
            @top-center {
                content: "' . ($language === 'so' ? 'Booliska Jubbaland - Warbixinta Hawlaha Maalinta' : 'Jubaland Police - Daily Operations Report') . '";
                font-family: "DejaVu Sans", sans-serif;
                font-size: 9pt;
                color: #64748b;
            }
            @bottom-right {
                content: "' . ($language === 'so' ? 'Bog' : 'Page') . ' " counter(page) " / " counter(pages);
                font-family: "DejaVu Sans", sans-serif;
                font-size: 9pt;
                color: #64748b;
            }
        }
        body {
            font-family: "DejaVu Sans", sans-serif;
            font-size: 10pt;
            color: #1e293b;
            line-height: 1.6;
        }
        .cover-page {
            text-align: center;
            padding: 80px 40px;
            page-break-after: always;
        }
        .logo-placeholder {
            width: 150px;
            height: 150px;
            margin: 0 auto 30px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 48pt;
            font-weight: bold;
        }
        .header-image {
            max-width: 100%;
            height: auto;
            max-height: 200px;
            margin: 0 auto 30px;
            display: block;
            object-fit: contain;
        }
        .cover-title {
            font-size: 32pt;
            font-weight: bold;
            color: #1e293b;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .cover-subtitle {
            font-size: 18pt;
            color: #64748b;
            margin: 15px 0;
        }
        .cover-date {
            font-size: 14pt;
            color: #475569;
            margin: 10px 0;
            padding: 15px;
            background: #f1f5f9;
            border-radius: 8px;
            display: inline-block;
        }
        .cover-footer {
            position: absolute;
            bottom: 40px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10pt;
            color: #94a3b8;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            border-radius: 10px;
        }
        .header h1 {
            color: white;
            font-size: 22pt;
            margin: 5px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header h2 {
            color: #e0e7ff;
            font-size: 14pt;
            margin: 5px 0;
            font-weight: normal;
        }
        .executive-summary {
            background: #f8fafc;
            border-left: 5px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .executive-summary h3 {
            color: #1e293b;
            font-size: 16pt;
            margin: 0 0 15px 0;
        }
        .executive-summary p {
            margin: 8px 0;
            line-height: 1.8;
        }
        .executive-summary .highlight {
            background: #fef3c7;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .stat-row {
            display: table-row;
        }
        .stat-cell {
            display: table-cell;
            width: 33.33%;
            padding: 10px;
            text-align: center;
            border: 2px solid #e2e8f0;
            background: #f8fafc;
        }
        .stat-cell h3 {
            font-size: 24pt;
            color: #2563eb;
            margin: 5px 0;
        }
        .stat-cell p {
            font-size: 10pt;
            color: #64748b;
            margin: 0;
        }
        .section {
            margin: 20px 0;
            page-break-inside: avoid;
        }
        .section h3 {
            background: #2563eb;
            color: white;
            padding: 8px 12px;
            font-size: 12pt;
            margin: 10px 0 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 9pt;
        }
        table th {
            background: #f1f5f9;
            color: #475569;
            padding: 8px 6px;
            text-align: left;
            border: 1px solid #cbd5e1;
            font-weight: bold;
        }
        table td {
            padding: 6px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        table tr:nth-child(even) {
            background: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 8pt;
            font-weight: bold;
        }
        .badge-low { background: #dcfce7; color: #166534; }
        .badge-medium { background: #dbeafe; color: #1e40af; }
        .badge-high { background: #fef3c7; color: #92400e; }
        .badge-critical { background: #fee2e2; color: #991b1b; }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 2px solid #e2e8f0;
            font-size: 8pt;
            color: #64748b;
        }
        .empty-state {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-style: italic;
        }
    </style>
</head>
<body>';

        // Cover Page
        $html .= $this->buildCoverPage($periodLabel, $date, $language);

        // Header
        $html .= '<div class="header">';
        $html .= '<h1>' . ($language === 'so' ? 'Warbixinta Hawlaha Maalinta' : 'Daily Operations Report') . '</h1>';
        $html .= '<h2>' . $periodLabel . ' - ' . date('F d, Y', strtotime($date)) . '</h2>';
        $html .= '</div>';

        // Executive Summary
        $html .= $this->buildExecutiveSummary($stats, $period, $language);

        // Statistics Grid
        $html .= '<div class="stats-grid">';
        $html .= '<div class="stat-row">';
        $html .= '<div class="stat-cell"><h3>' . $stats['cases_submitted_count'] . '</h3><p>' . ($language === 'so' ? 'Kiisaska La Soo Gudbiyay' : 'Cases Submitted') . '</p></div>';
        $html .= '<div class="stat-cell"><h3>' . $stats['cases_assigned_count'] . '</h3><p>' . ($language === 'so' ? 'Kiisaska La Xilsaaray' : 'Cases Assigned') . '</p></div>';
        $html .= '<div class="stat-cell"><h3>' . $stats['cases_closed_count'] . '</h3><p>' . ($language === 'so' ? 'Kiisaska La Xiray' : 'Cases Closed') . '</p></div>';
        $html .= '</div>';
        $html .= '<div class="stat-row">';
        $html .= '<div class="stat-cell"><h3>' . $stats['current_custody_count'] . '</h3><p>' . ($language === 'so' ? 'Xabsiga Hadda' : 'Current Custody') . '</p></div>';
        $html .= '<div class="stat-cell"><h3>' . $stats['certificates_issued_count'] . '</h3><p>' . ($language === 'so' ? 'Shahaadooyinka La Bixiyay' : 'Certificates Issued') . '</p></div>';
        $html .= '<div class="stat-cell"><h3>' . $stats['medical_forms_issued_count'] . '</h3><p>' . ($language === 'so' ? 'Foomamka Caafimaadka' : 'Medical Forms Issued') . '</p></div>';
        $html .= '</div>';
        $html .= '</div>';

        // Cases Submitted Section
        $html .= $this->buildCasesSubmittedSection($data['cases_submitted'], $language);

        // Cases Assigned Section
        $html .= $this->buildCasesAssignedSection($data['cases_assigned'], $language);

        // Cases Closed Section
        $html .= $this->buildCasesClosedSection($data['cases_closed'], $language);

        // Current Custody Section
        $html .= $this->buildCurrentCustodySection($data['current_custody'], $language);

        // Certificates Section
        $html .= $this->buildCertificatesSection($data['certificates_issued'], $language);

        // Medical Forms Section
        $html .= $this->buildMedicalFormsSection($data['medical_forms_issued'], $language);

        // Footer
        $html .= '<div class="footer">';
        $html .= '<p>' . ($language === 'so' ? 'Warbixintan waxaa soo saaray Nidaamka Maaraynta Kiisaska Booliska Jubbaland' : 'Generated by Jubaland Police Case Management System') . '</p>';
        $html .= '<p>' . date('F d, Y h:i A') . '</p>';
        $html .= '</div>';

        $html .= '</body></html>';

        return $html;
    }
    
    /**
     * Build Cover Page
     */
    private function buildCoverPage($periodLabel, $date, $language)
    {
        // Get header image
        $headerImageHtml = $this->getHeaderImageHTML();
        
        return '
        <div class="cover-page">
            ' . $headerImageHtml . '
            <div class="cover-title">' . ($language === 'so' ? 'Warbixinta Hawlaha Maalinta' : 'Daily Operations Report') . '</div>
            <div class="cover-subtitle">' . ($language === 'so' ? 'Booliska Jubbaland' : 'Jubaland Police Force') . '</div>
            <div class="cover-date">
                <strong>' . $periodLabel . '</strong><br>
                ' . date('F d, Y', strtotime($date)) . '
            </div>
            <div class="cover-footer">
                ' . ($language === 'so' ? 'Xeer-Ilaalinta Bulshada' : 'Protecting the Community') . '<br>
                ' . ($language === 'so' ? 'La soo saaray: ' : 'Generated: ') . date('F d, Y \a\t H:i') . '
            </div>
        </div>';
    }
    
    /**
     * Build Executive Summary
     */
    private function buildExecutiveSummary($stats, $period, $language)
    {
        $total = $stats['cases_submitted_count'] + $stats['cases_assigned_count'] + $stats['cases_closed_count'];
        $html = '<div class="executive-summary">';
        $html .= '<h3>' . ($language === 'so' ? 'Soo Koobid Fulinta' : 'Executive Summary') . '</h3>';
        
        if ($language === 'so') {
            $html .= '<p>Warbixintan waxay soo bandhigaysaa hawlaha maalinta ee Booliska Jubbaland ee xilliga <strong>' . $this->getPeriodLabel($period, $language) . '</strong>.</p>';
            
            $html .= '<p><span class="highlight">' . $total . '</span> hawlaha guud ayaa la fulinayay, oo ay ku jiraan:</p>';
            $html .= '<ul>';
            $html .= '<li><strong>' . $stats['cases_submitted_count'] . '</strong> kiisas cusub oo la soo gudbiyay</li>';
            $html .= '<li><strong>' . $stats['cases_assigned_count'] . '</strong> kiisas oo loo xilsaaray baarayaasha</li>';
            $html .= '<li><strong>' . $stats['cases_closed_count'] . '</strong> kiisas oo la xiray si guul leh</li>';
            $html .= '</ul>';
            
            $html .= '<p>Waxaa sidoo kale jira <span class="highlight">' . $stats['current_custody_count'] . '</span> qof oo xabsiga ku jira hadda.</p>';
            
            if ($stats['certificates_issued_count'] > 0 || $stats['medical_forms_issued_count'] > 0) {
                $html .= '<p>Adeegyada bulshada: <strong>' . $stats['certificates_issued_count'] . '</strong> shahaado iyo <strong>' . $stats['medical_forms_issued_count'] . '</strong> foomam caafimaad ayaa la bixiyay.</p>';
            }
            
            // Add key insights
            $html .= $this->buildKeyInsights($stats, $language);
            
        } else {
            $html .= '<p>This report presents the daily operational activities of the Jubaland Police Force for <strong>' . $this->getPeriodLabel($period, $language) . '</strong>.</p>';
            
            $html .= '<p>A total of <span class="highlight">' . $total . '</span> operational activities were recorded, including:</p>';
            $html .= '<ul>';
            $html .= '<li><strong>' . $stats['cases_submitted_count'] . '</strong> new cases submitted</li>';
            $html .= '<li><strong>' . $stats['cases_assigned_count'] . '</strong> cases assigned to investigators</li>';
            $html .= '<li><strong>' . $stats['cases_closed_count'] . '</strong> cases successfully closed</li>';
            $html .= '</ul>';
            
            $html .= '<p>Currently, there are <span class="highlight">' . $stats['current_custody_count'] . '</span> individuals in custody.</p>';
            
            if ($stats['certificates_issued_count'] > 0 || $stats['medical_forms_issued_count'] > 0) {
                $html .= '<p>Community services: <strong>' . $stats['certificates_issued_count'] . '</strong> certificates and <strong>' . $stats['medical_forms_issued_count'] . '</strong> medical forms were issued.</p>';
            }
            
            // Add key insights
            $html .= $this->buildKeyInsights($stats, $language);
        }
        
        $html .= '</div>';
        return $html;
    }
    
    /**
     * Build Key Insights Section
     * Provides actionable insights based on the data
     */
    private function buildKeyInsights($stats, $language)
    {
        $insights = [];
        
        // Case closure rate insight
        $totalCases = $stats['cases_submitted_count'] + $stats['cases_assigned_count'];
        if ($totalCases > 0) {
            $closureRate = round(($stats['cases_closed_count'] / $totalCases) * 100, 1);
            
            if ($language === 'so') {
                $insights[] = '📊 <strong>Heerka Xirista Kiisaska:</strong> ' . $closureRate . '% (' . $stats['cases_closed_count'] . ' laga mid ah ' . $totalCases . ' kiis ayaa la xiray)';
            } else {
                $insights[] = '📊 <strong>Case Closure Rate:</strong> ' . $closureRate . '% (' . $stats['cases_closed_count'] . ' out of ' . $totalCases . ' cases closed)';
            }
        }
        
        // Custody capacity insight
        if ($stats['current_custody_count'] > 0) {
            if ($language === 'so') {
                $insights[] = '🔒 <strong>Xabsiga:</strong> ' . $stats['current_custody_count'] . ' qof ayaa xabsiga ku jira hadda';
            } else {
                $insights[] = '🔒 <strong>Custody Status:</strong> ' . $stats['current_custody_count'] . ' individual(s) currently in custody';
            }
        }
        
        // Priority cases insight
        if (isset($stats['high_priority_count']) && $stats['high_priority_count'] > 0) {
            if ($language === 'so') {
                $insights[] = '⚠️ <strong>Kiisaska Muhiimka ah:</strong> ' . $stats['high_priority_count'] . ' kiis oo mudnaantoodu ay tahay "Sare" ama "Aad u Muhiim"';
            } else {
                $insights[] = '⚠️ <strong>High Priority Cases:</strong> ' . $stats['high_priority_count'] . ' case(s) marked as high or critical priority';
            }
        }
        
        // Community services insight
        $communityServices = $stats['certificates_issued_count'] + $stats['medical_forms_issued_count'];
        if ($communityServices > 0) {
            if ($language === 'so') {
                $insights[] = '👥 <strong>Adeegyada Bulshada:</strong> ' . $communityServices . ' adeegyo bulshada ah ayaa la bixiyay (shahaado iyo foomam caafimaad)';
            } else {
                $insights[] = '👥 <strong>Community Services:</strong> ' . $communityServices . ' community services provided (certificates and medical forms)';
            }
        }
        
        // Build HTML
        if (empty($insights)) {
            return '';
        }
        
        $html = '<div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">';
        $html .= '<h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 11pt;">' . ($language === 'so' ? '💡 Fahamka Muhiimka ah' : '💡 Key Insights') . '</h4>';
        $html .= '<ul style="margin: 0; padding-left: 20px; line-height: 1.8;">';
        
        foreach ($insights as $insight) {
            $html .= '<li style="margin-bottom: 8px;">' . $insight . '</li>';
        }
        
        $html .= '</ul></div>';
        
        return $html;
    }

    private function buildCasesSubmittedSection($cases, $language)
    {
        $html = '<div class="section">';
        $html .= '<h3>' . ($language === 'so' ? 'Kiisaska La Soo Gudbiyay' : 'Cases Submitted') . ' (' . count($cases) . ')</h3>';
        
        if (empty($cases)) {
            $html .= '<p class="empty-state">' . ($language === 'so' ? 'Ma jiraan kiisas la soo gudbiyay' : 'No cases submitted') . '</p>';
        } else {
            $html .= '<table><thead><tr>';
            $html .= '<th>' . ($language === 'so' ? 'Lambarka Kiiska' : 'Case Number') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Nooca Dambiga' : 'Crime Type') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Mudnaanta' : 'Priority') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Xarunta' : 'Center') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Waqtiga' : 'Created At') . '</th>';
            $html .= '</tr></thead><tbody>';
            
            foreach ($cases as $case) {
                $priorityClass = $this->getPriorityBadgeClass($case['priority']);
                $html .= '<tr>';
                $html .= '<td><strong>' . htmlspecialchars($case['case_number']) . '</strong></td>';
                $html .= '<td>' . htmlspecialchars($case['crime_type']) . '</td>';
                $html .= '<td><span class="badge ' . $priorityClass . '">' . strtoupper($case['priority']) . '</span></td>';
                $html .= '<td>' . htmlspecialchars($case['center_name']) . '</td>';
                $html .= '<td>' . date('M d, Y H:i', strtotime($case['created_at'])) . '</td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
        }
        
        $html .= '</div>';
        return $html;
    }

    private function buildCasesAssignedSection($assignments, $language)
    {
        $html = '<div class="section">';
        $html .= '<h3>' . ($language === 'so' ? 'Kiisaska La Xilsaaray' : 'Cases Assigned') . ' (' . count($assignments) . ')</h3>';
        
        if (empty($assignments)) {
            $html .= '<p class="empty-state">' . ($language === 'so' ? 'Ma jiraan kiisas la xilsaaray' : 'No cases assigned') . '</p>';
        } else {
            $html .= '<table><thead><tr>';
            $html .= '<th>' . ($language === 'so' ? 'Lambarka Kiiska' : 'Case Number') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Baarayaasha' : 'Investigator') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Xilsaaray' : 'Assigned By') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Wakhtiga Dhammaadka' : 'Deadline') . '</th>';
            $html .= '</tr></thead><tbody>';
            
            foreach ($assignments as $assignment) {
                $html .= '<tr>';
                $html .= '<td><strong>' . htmlspecialchars($assignment['case_number']) . '</strong></td>';
                $html .= '<td>' . htmlspecialchars($assignment['investigator_name']) . '</td>';
                $html .= '<td>' . htmlspecialchars($assignment['assigned_by_name'] ?? 'N/A') . '</td>';
                $html .= '<td>' . ($assignment['deadline'] ? date('M d, Y', strtotime($assignment['deadline'])) : 'N/A') . '</td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
        }
        
        $html .= '</div>';
        return $html;
    }

    private function buildCasesClosedSection($cases, $language)
    {
        $html = '<div class="section">';
        $html .= '<h3>' . ($language === 'so' ? 'Kiisaska La Xiray' : 'Cases Closed') . ' (' . count($cases) . ')</h3>';
        
        if (empty($cases)) {
            $html .= '<p class="empty-state">' . ($language === 'so' ? 'Ma jiraan kiisas la xiray' : 'No cases closed') . '</p>';
        } else {
            $html .= '<table><thead><tr>';
            $html .= '<th>' . ($language === 'so' ? 'Lambarka Kiiska' : 'Case Number') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Nooca Dambiga' : 'Crime Type') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Xiray' : 'Closed By') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Sababta' : 'Closure Reason') . '</th>';
            $html .= '</tr></thead><tbody>';
            
            foreach ($cases as $case) {
                $html .= '<tr>';
                $html .= '<td><strong>' . htmlspecialchars($case['case_number']) . '</strong></td>';
                $html .= '<td>' . htmlspecialchars($case['crime_type']) . '</td>';
                $html .= '<td>' . htmlspecialchars($case['closed_by_name'] ?? 'N/A') . '</td>';
                $html .= '<td>' . htmlspecialchars(substr($case['closure_reason'] ?? 'N/A', 0, 100)) . '</td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
        }
        
        $html .= '</div>';
        return $html;
    }

    private function buildCurrentCustodySection($custody, $language)
    {
        $html = '<div class="section">';
        $html .= '<h3>' . ($language === 'so' ? 'Xabsiga Hadda' : 'Current Custody') . ' (' . count($custody) . ')</h3>';
        
        if (empty($custody)) {
            $html .= '<p class="empty-state">' . ($language === 'so' ? 'Ma jiraan qof xabsi ah' : 'No custody records') . '</p>';
        } else {
            $html .= '<table><thead><tr>';
            $html .= '<th>' . ($language === 'so' ? 'Magaca' : 'Name') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Lambarka Kiiska' : 'Case Number') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Goobta' : 'Location') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Bilawga' : 'Start Date') . '</th>';
            $html .= '</tr></thead><tbody>';
            
            foreach ($custody as $record) {
                $html .= '<tr>';
                $html .= '<td><strong>' . htmlspecialchars($record['person_full_name']) . '</strong></td>';
                $html .= '<td>' . htmlspecialchars($record['case_number']) . '</td>';
                $html .= '<td>' . htmlspecialchars($record['custody_location'] ?? 'N/A') . '</td>';
                $html .= '<td>' . date('M d, Y', strtotime($record['custody_start'])) . '</td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
        }
        
        $html .= '</div>';
        return $html;
    }

    private function buildCertificatesSection($certificates, $language)
    {
        $html = '<div class="section">';
        $html .= '<h3>' . ($language === 'so' ? 'Shahaadooyinka La Bixiyay' : 'Certificates Issued') . ' (' . count($certificates) . ')</h3>';
        
        if (empty($certificates)) {
            $html .= '<p class="empty-state">' . ($language === 'so' ? 'Ma jiraan shahaado la bixiyay' : 'No certificates issued') . '</p>';
        } else {
            $html .= '<table><thead><tr>';
            $html .= '<th>' . ($language === 'so' ? 'Lambarka' : 'Certificate Number') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Magaca' : 'Person Name') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Ujeedda' : 'Purpose') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Taariikhda' : 'Issue Date') . '</th>';
            $html .= '</tr></thead><tbody>';
            
            foreach ($certificates as $cert) {
                $html .= '<tr>';
                $html .= '<td>' . htmlspecialchars($cert['certificate_number']) . '</td>';
                $html .= '<td>' . htmlspecialchars($cert['person_full_name'] ?? $cert['person_name']) . '</td>';
                $html .= '<td>' . htmlspecialchars($cert['purpose'] ?? 'N/A') . '</td>';
                $html .= '<td>' . date('M d, Y', strtotime($cert['issue_date'])) . '</td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
        }
        
        $html .= '</div>';
        return $html;
    }

    private function buildMedicalFormsSection($forms, $language)
    {
        $html = '<div class="section">';
        $html .= '<h3>' . ($language === 'so' ? 'Foomamka Caafimaadka La Bixiyay' : 'Medical Forms Issued') . ' (' . count($forms) . ')</h3>';
        
        if (empty($forms)) {
            $html .= '<p class="empty-state">' . ($language === 'so' ? 'Ma jiraan foomam la bixiyay' : 'No medical forms issued') . '</p>';
        } else {
            $html .= '<table><thead><tr>';
            $html .= '<th>' . ($language === 'so' ? 'Lambarka Kiiska' : 'Case Number') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Magaca Bukaanka' : 'Patient Name') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Isbitaalka' : 'Hospital') . '</th>';
            $html .= '<th>' . ($language === 'so' ? 'Taariikhda' : 'Exam Date') . '</th>';
            $html .= '</tr></thead><tbody>';
            
            foreach ($forms as $form) {
                $html .= '<tr>';
                $html .= '<td>' . htmlspecialchars($form['case_number']) . '</td>';
                $html .= '<td>' . htmlspecialchars($form['person_full_name'] ?? $form['patient_name']) . '</td>';
                $html .= '<td>' . htmlspecialchars($form['hospital_name'] ?? 'N/A') . '</td>';
                $html .= '<td>' . date('M d, Y', strtotime($form['examination_date'])) . '</td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
        }
        
        $html .= '</div>';
        return $html;
    }

    private function getPeriodLabel($period, $language)
    {
        $labels = [
            'en' => [
                'today' => 'Today',
                'week' => 'This Week',
                'month' => 'This Month',
                'year' => 'This Year'
            ],
            'so' => [
                'today' => 'Maanta',
                'week' => 'Toddobaadkan',
                'month' => 'Bisha',
                'year' => 'Sannadkan'
            ]
        ];
        
        return $labels[$language][$period] ?? $labels['en'][$period];
    }

    private function getPriorityBadgeClass($priority)
    {
        $classes = [
            'low' => 'badge-low',
            'medium' => 'badge-medium',
            'high' => 'badge-high',
            'critical' => 'badge-critical'
        ];
        
        return $classes[$priority] ?? 'badge-medium';
    }

    /**
     * Get Header Image HTML
     * Fetches the report header image and returns HTML with embedded base64 image
     */
    private function getHeaderImageHTML()
    {
        try {
            // Get header image path from settings
            $headerImagePath = $this->reportSettingsModel->getHeaderImage();
            
            if ($headerImagePath) {
                // Build full file path
                $fullPath = FCPATH . 'uploads/' . $headerImagePath;
                
                // Check if file exists
                if (file_exists($fullPath)) {
                    // Read image and convert to base64
                    $imageData = file_get_contents($fullPath);
                    $base64 = base64_encode($imageData);
                    
                    // Detect MIME type
                    $finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $mimeType = finfo_file($finfo, $fullPath);
                    finfo_close($finfo);
                    
                    // Return image HTML with embedded base64 data
                    return '<img src="data:' . $mimeType . ';base64,' . $base64 . '" alt="Report Header" class="header-image" />';
                }
            }
            
            // Fallback to placeholder if no image found
            return '<div class="logo-placeholder">JP</div>';
            
        } catch (\Exception $e) {
            log_message('error', 'Error loading header image for daily operations PDF: ' . $e->getMessage());
            // Return placeholder on error
            return '<div class="logo-placeholder">JP</div>';
        }
    }
}
