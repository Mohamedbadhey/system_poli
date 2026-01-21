<?php

namespace App\Libraries;

/**
 * PDF Generator Library
 * 
 * This is a wrapper that can use different PDF libraries
 * Currently implements a basic HTML-to-PDF approach
 * Can be extended to use TCPDF, mPDF, or DomPDF
 */
class PDFGenerator
{
    protected $reportModel;
    protected $templateEngine;
    protected $settingsModel;

    public function __construct()
    {
        $this->reportModel = new \App\Models\ReportModel();
        $this->templateEngine = new ReportTemplateEngine();
        $this->settingsModel = new \App\Models\ReportSettingsModel();
    }

    /**
     * Generate PDF from report ID
     */
    public function generateReportPDF($reportId, $outputPath = null)
    {
        $report = $this->reportModel->getReportWithDetails($reportId);
        
        if (!$report) {
            throw new \Exception('Report not found');
        }

        // Get case data for header/footer
        $db = \Config\Database::connect();
        $case = $db->table('cases')->where('id', $report['case_id'])->get()->getRowArray();

        // Build HTML content
        $html = $this->buildHTMLContent($report, $case);

        // Generate PDF
        if ($outputPath === null) {
            $year = date('Y');
            $outputPath = WRITEPATH . "uploads/reports/{$case['id']}/";
            
            if (!is_dir($outputPath)) {
                mkdir($outputPath, 0755, true);
            }
            
            $filename = "report_{$reportId}_" . date('Ymd_His') . ".pdf";
            $outputPath .= $filename;
        }

        // Use basic HTML to PDF conversion
        $this->convertHTMLToPDF($html, $outputPath);

        // Update report with file path
        $relativePath = str_replace(WRITEPATH . 'uploads/', '', $outputPath);
        $this->reportModel->updateReport($reportId, [
            'report_file_path' => $relativePath
        ]);

        return $outputPath;
    }

    /**
     * Generate PDF from case data directly (for preview)
     */
    public function generatePDFFromData($reportType, $caseId, $content, $metadata = [])
    {
        $db = \Config\Database::connect();
        $case = $db->table('cases')->where('id', $caseId)->get()->getRowArray();
        
        if (!$case) {
            throw new \Exception('Case not found');
        }

        // Build report array for HTML generation
        $report = [
            'report_type' => $reportType,
            'report_title' => $metadata['title'] ?? ucfirst($reportType) . ' Report',
            'report_content' => $content,
            'case_number' => $case['case_number'],
            'ob_number' => $case['ob_number'],
            'created_at' => date('Y-m-d H:i:s'),
            'created_by_name' => $metadata['investigator_name'] ?? 'Unknown'
        ];

        $html = $this->buildHTMLContent($report, $case);

        // Return HTML for preview or convert to PDF
        return $html;
    }

    /**
     * Build HTML content for PDF
     */
    private function buildHTMLContent($report, $case)
    {
        // Get report settings
        $centerId = $case['center_id'] ?? null;
        $reportSettings = $this->settingsModel->getReportSettings($centerId);
        
        // Determine report type (full or basic)
        $isFullReport = $this->isFullReport($report['report_type']);
        $sections = $isFullReport ? $reportSettings['full_report_sections'] : $reportSettings['basic_report_sections'];
        $headerImage = $reportSettings['header_image'];
        
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>' . htmlspecialchars($report['report_title']) . '</title>
    <style>
        @page {
            margin: 2cm;
            @top-right {
                content: "Page " counter(page) " of " counter(pages);
            }
        }
        
        body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 18pt;
            text-transform: uppercase;
        }
        
        .header .subtitle {
            font-size: 14pt;
            margin-top: 5px;
            color: #333;
        }
        
        .case-info {
            background-color: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        
        .case-info table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .case-info td {
            padding: 5px;
        }
        
        .case-info td:first-child {
            font-weight: bold;
            width: 200px;
        }
        
        .content {
            margin: 20px 0;
            white-space: pre-wrap;
            font-family: "Courier New", monospace;
            font-size: 11pt;
        }
        
        .section {
            margin: 20px 0;
        }
        
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin: 20px 0 10px 0;
            border-bottom: 1px solid #000;
            text-transform: uppercase;
        }
        
        .signature-block {
            margin-top: 50px;
            page-break-inside: avoid;
        }
        
        .signature-line {
            margin: 30px 0;
            border-top: 1px solid #000;
            width: 300px;
        }
        
        .footer {
            text-align: center;
            font-size: 9pt;
            color: #666;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
        }
        
        .confidential {
            color: red;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        
        .stamp-area {
            border: 2px dashed #999;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            min-height: 100px;
        }
        
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        table.data-table th,
        table.data-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        table.data-table th {
            background-color: #e0e0e0;
            font-weight: bold;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72pt;
            color: rgba(200, 200, 200, 0.3);
            z-index: -1;
        }
    </style>
</head>
<body>';

        // Add watermark for drafts
        if (isset($report['approval_status']) && $report['approval_status'] === 'draft') {
            $html .= '<div class="watermark">DRAFT</div>';
        }

        // Header with logo
        $html .= '<div class="header">';
        
        // Add header image if available
        if ($headerImage && file_exists(WRITEPATH . 'uploads/' . $headerImage)) {
            $imageUrl = base_url('uploads/' . $headerImage);
            $html .= '<img src="' . $imageUrl . '" alt="Header Logo" style="max-width: 200px; max-height: 100px; margin-bottom: 10px;">';
        }
        
        $html .= '<h1>Police Case Management System</h1>';
        $html .= '<div class="subtitle">' . htmlspecialchars($report['report_title']) . '</div>';
        $html .= '</div>';

        // Confidential notice for sensitive cases
        if (isset($case['is_sensitive']) && $case['is_sensitive']) {
            $html .= '<div class="confidential">CONFIDENTIAL - SENSITIVE CASE</div>';
        }

        // Case Information Box
        $html .= '<div class="case-info">';
        $html .= '<table>';
        $html .= '<tr><td>Case Number:</td><td>' . htmlspecialchars($case['case_number']) . '</td></tr>';
        $html .= '<tr><td>OB Number:</td><td>' . htmlspecialchars($case['ob_number']) . '</td></tr>';
        $html .= '<tr><td>Crime Type:</td><td>' . htmlspecialchars($case['crime_type']) . '</td></tr>';
        $html .= '<tr><td>Report Type:</td><td>' . htmlspecialchars(strtoupper(str_replace('_', ' ', $report['report_type']))) . '</td></tr>';
        $html .= '<tr><td>Report Date:</td><td>' . date('F d, Y', strtotime($report['created_at'])) . '</td></tr>';
        $html .= '<tr><td>Prepared By:</td><td>' . htmlspecialchars($report['created_by_name'] ?? 'Unknown') . '</td></tr>';
        $html .= '</table>';
        $html .= '</div>';

        // Main Content with Sections
        $html .= $this->buildReportSections($report, $case, $sections);
        
        // Additional content if provided
        if (!empty($report['report_content'])) {
            $html .= '<div class="content">';
            $html .= nl2br(htmlspecialchars($report['report_content']));
            $html .= '</div>';
        }

        // Signature Block
        if (isset($report['is_signed']) && $report['is_signed']) {
            $html .= '<div class="signature-block">';
            $html .= '<p><strong>DIGITALLY SIGNED</strong></p>';
            $html .= '<p>Signed By: ' . htmlspecialchars($report['signed_by_name'] ?? 'Unknown') . '</p>';
            $html .= '<p>Date: ' . date('F d, Y H:i:s', strtotime($report['signed_at'])) . '</p>';
            $html .= '<p>Signature Hash: ' . substr($report['signature_hash'], 0, 16) . '...</p>';
            $html .= '</div>';
        } else {
            $html .= '<div class="signature-block">';
            $html .= '<p>Prepared By:</p>';
            $html .= '<div class="signature-line"></div>';
            $html .= '<p>Name: ' . htmlspecialchars($report['created_by_name'] ?? '_______________________') . '</p>';
            $html .= '<p>Date: _______________________</p>';
            $html .= '</div>';
            
            // Approval section
            if ($report['report_type'] === 'final' || $report['report_type'] === 'court_submission') {
                $html .= '<div class="signature-block">';
                $html .= '<p>Approved By (Station Commander):</p>';
                $html .= '<div class="signature-line"></div>';
                $html .= '<p>Name: _______________________</p>';
                $html .= '<p>Rank: _______________________</p>';
                $html .= '<p>Date: _______________________</p>';
                $html .= '</div>';
                
                $html .= '<div class="stamp-area">';
                $html .= '<p>OFFICIAL STAMP</p>';
                $html .= '</div>';
            }
        }

        // Footer
        $html .= '<div class="footer">';
        $html .= '<p>Generated by Police Case Management System on ' . date('F d, Y H:i:s') . '</p>';
        $html .= '<p>Document ID: REPORT-' . ($report['id'] ?? 'PREVIEW') . '</p>';
        $html .= '<p>This document is official police record and must be handled according to regulations.</p>';
        $html .= '</div>';

        $html .= '</body></html>';

        return $html;
    }

    /**
     * Convert HTML to PDF
     * This is a basic implementation. In production, use mPDF, TCPDF, or DomPDF
     */
    private function convertHTMLToPDF($html, $outputPath)
    {
        // For now, save as HTML (can be printed to PDF by browser)
        // In production, integrate with a proper PDF library
        
        // Try to use DomPDF if available
        if (class_exists('Dompdf\Dompdf')) {
            $this->convertWithDomPDF($html, $outputPath);
        } else {
            // Fallback: Save as HTML with PDF-friendly styling
            $htmlPath = str_replace('.pdf', '.html', $outputPath);
            file_put_contents($htmlPath, $html);
            
            // Create a symlink or copy with .pdf extension
            file_put_contents($outputPath, $html);
        }
    }

    /**
     * Convert using DomPDF (if available)
     */
    private function convertWithDomPDF($html, $outputPath)
    {
        try {
            $dompdf = new \Dompdf\Dompdf([
                'enable_remote' => false,
                'enable_php' => false,
                'isHtml5ParserEnabled' => true,
                'isFontSubsettingEnabled' => true
            ]);
            
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            
            file_put_contents($outputPath, $dompdf->output());
        } catch (\Exception $e) {
            // Fallback to HTML if DomPDF fails
            file_put_contents($outputPath, $html);
        }
    }

    /**
     * Generate printable HTML (for browser printing)
     */
    public function generatePrintableHTML($reportId)
    {
        $report = $this->reportModel->getReportWithDetails($reportId);
        
        if (!$report) {
            throw new \Exception('Report not found');
        }

        $db = \Config\Database::connect();
        $case = $db->table('cases')->where('id', $report['case_id'])->get()->getRowArray();

        return $this->buildHTMLContent($report, $case);
    }

    /**
     * Generate PDF for multiple reports (batch)
     */
    public function generateBatchPDF($reportIds)
    {
        $results = [];
        
        foreach ($reportIds as $reportId) {
            try {
                $path = $this->generateReportPDF($reportId);
                $results[$reportId] = [
                    'success' => true,
                    'path' => $path
                ];
            } catch (\Exception $e) {
                $results[$reportId] = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $results;
    }

    /**
     * Download report PDF
     */
    public function downloadReport($reportId)
    {
        $report = $this->reportModel->find($reportId);
        
        if (!$report) {
            throw new \Exception('Report not found');
        }

        // Generate PDF if not exists
        if (empty($report['report_file_path']) || !file_exists(WRITEPATH . 'uploads/' . $report['report_file_path'])) {
            $this->generateReportPDF($reportId);
            $report = $this->reportModel->find($reportId);
        }

        $filePath = WRITEPATH . 'uploads/' . $report['report_file_path'];
        
        if (!file_exists($filePath)) {
            throw new \Exception('Report file not found');
        }

        return $filePath;
    }

    /**
     * Determine if report type is a full report
     */
    private function isFullReport($reportType)
    {
        $fullReportTypes = ['final', 'court_submission', 'prosecution_summary', 'supplementary'];
        return in_array($reportType, $fullReportTypes);
    }

    /**
     * Build report sections based on configuration
     */
    private function buildReportSections($report, $case, $sections)
    {
        if (empty($sections)) {
            return '';
        }

        // Sort sections by order
        uasort($sections, function($a, $b) {
            return ($a['order'] ?? 0) <=> ($b['order'] ?? 0);
        });

        $html = '';
        $db = \Config\Database::connect();

        foreach ($sections as $key => $section) {
            // Skip disabled sections
            if (empty($section['enabled'])) {
                continue;
            }

            $html .= '<div class="section">';
            $html .= '<h2 class="section-title">' . htmlspecialchars($section['title']) . '</h2>';

            // Add template/default text if available
            if (!empty($section['template'])) {
                $html .= '<p class="section-template">' . nl2br(htmlspecialchars($section['template'])) . '</p>';
            }

            // Add dynamic content based on section type
            $html .= $this->buildSectionContent($key, $report, $case, $db);

            $html .= '</div>';
        }

        return $html;
    }

    /**
     * Build content for specific section types
     */
    private function buildSectionContent($sectionKey, $report, $case, $db)
    {
        $html = '';

        switch ($sectionKey) {
            case 'case_overview':
                $html .= $this->buildCaseOverviewSection($case);
                break;

            case 'parties_involved':
                $html .= $this->buildPartiesSection($case['id'], $db);
                break;

            case 'evidence_summary':
                $html .= $this->buildEvidenceSection($case['id'], $db);
                break;

            case 'investigation_details':
                $html .= $this->buildInvestigationDetailsSection($case['id'], $db);
                break;

            case 'investigator_conclusions':
                $html .= $this->buildConclusionsSection($case['id'], $db);
                break;

            case 'recommendations':
                $html .= $this->buildRecommendationsSection($report);
                break;

            case 'summary':
                $html .= $this->buildSummarySection($report, $case);
                break;

            case 'conclusion':
                $html .= $this->buildConclusionSection($report);
                break;

            default:
                // For custom sections, just show placeholder
                $html .= '<p class="section-placeholder"><em>Content for this section should be added by the investigator.</em></p>';
                break;
        }

        return $html;
    }

    /**
     * Build case overview section
     */
    private function buildCaseOverviewSection($case)
    {
        $html = '<table class="data-table">';
        $html .= '<tr><th>Case Number</th><td>' . htmlspecialchars($case['case_number']) . '</td></tr>';
        $html .= '<tr><th>OB Number</th><td>' . htmlspecialchars($case['ob_number']) . '</td></tr>';
        $html .= '<tr><th>Crime Type</th><td>' . htmlspecialchars($case['crime_type']) . '</td></tr>';
        $html .= '<tr><th>Incident Date</th><td>' . date('F d, Y', strtotime($case['incident_date'])) . '</td></tr>';
        $html .= '<tr><th>Location</th><td>' . htmlspecialchars($case['incident_location']) . '</td></tr>';
        $html .= '<tr><th>Status</th><td>' . htmlspecialchars($case['status']) . '</td></tr>';
        $html .= '<tr><th>Priority</th><td>' . htmlspecialchars($case['priority']) . '</td></tr>';
        $html .= '</table>';
        
        if (!empty($case['description'])) {
            $html .= '<h3>Description</h3>';
            $html .= '<p>' . nl2br(htmlspecialchars($case['description'])) . '</p>';
        }

        return $html;
    }

    /**
     * Build parties involved section
     */
    private function buildPartiesSection($caseId, $db)
    {
        $parties = $db->table('case_parties')
            ->select('case_parties.*, persons.first_name, persons.middle_name, persons.last_name, persons.id_number, persons.phone')
            ->join('persons', 'persons.id = case_parties.person_id')
            ->where('case_parties.case_id', $caseId)
            ->get()
            ->getResultArray();

        if (empty($parties)) {
            return '<p><em>No parties recorded.</em></p>';
        }

        $html = '<table class="data-table">';
        $html .= '<thead><tr><th>Name</th><th>Role</th><th>ID Number</th><th>Contact</th></tr></thead>';
        $html .= '<tbody>';

        foreach ($parties as $party) {
            $fullName = trim($party['first_name'] . ' ' . ($party['middle_name'] ?? '') . ' ' . $party['last_name']);
            $html .= '<tr>';
            $html .= '<td>' . htmlspecialchars($fullName) . '</td>';
            $html .= '<td>' . htmlspecialchars(ucfirst($party['party_role'])) . '</td>';
            $html .= '<td>' . htmlspecialchars($party['id_number'] ?? 'N/A') . '</td>';
            $html .= '<td>' . htmlspecialchars($party['phone'] ?? 'N/A') . '</td>';
            $html .= '</tr>';
        }

        $html .= '</tbody></table>';
        return $html;
    }

    /**
     * Build evidence summary section
     */
    private function buildEvidenceSection($caseId, $db)
    {
        $evidence = $db->table('evidence')
            ->where('case_id', $caseId)
            ->orderBy('evidence_number', 'ASC')
            ->get()
            ->getResultArray();

        if (empty($evidence)) {
            return '<p><em>No evidence recorded.</em></p>';
        }

        $html = '<table class="data-table">';
        $html .= '<thead><tr><th>Evidence #</th><th>Type</th><th>Description</th><th>Collection Date</th><th>Status</th></tr></thead>';
        $html .= '<tbody>';

        foreach ($evidence as $item) {
            $html .= '<tr>';
            $html .= '<td>' . htmlspecialchars($item['evidence_number']) . '</td>';
            $html .= '<td>' . htmlspecialchars(ucfirst($item['evidence_type'])) . '</td>';
            $html .= '<td>' . htmlspecialchars(substr($item['description'], 0, 100)) . '...</td>';
            $html .= '<td>' . date('Y-m-d', strtotime($item['collected_date'])) . '</td>';
            $html .= '<td>' . htmlspecialchars($item['current_status']) . '</td>';
            $html .= '</tr>';
        }

        $html .= '</tbody></table>';
        $html .= '<p><strong>Total Evidence Items:</strong> ' . count($evidence) . '</p>';
        return $html;
    }

    /**
     * Build investigation details section
     */
    private function buildInvestigationDetailsSection($caseId, $db)
    {
        $notes = $db->table('investigation_notes')
            ->select('investigation_notes.*, users.full_name as investigator_name')
            ->join('users', 'users.id = investigation_notes.investigator_id', 'left')
            ->where('investigation_notes.case_id', $caseId)
            ->orderBy('investigation_notes.created_at', 'ASC')
            ->get()
            ->getResultArray();

        if (empty($notes)) {
            return '<p><em>No investigation notes recorded.</em></p>';
        }

        $html = '';
        foreach ($notes as $note) {
            $html .= '<div style="margin-bottom: 20px; padding: 10px; border-left: 3px solid #333;">';
            $html .= '<p><strong>Date:</strong> ' . date('F d, Y H:i', strtotime($note['created_at'])) . '</p>';
            $html .= '<p><strong>Investigator:</strong> ' . htmlspecialchars($note['investigator_name'] ?? 'Unknown') . '</p>';
            $html .= '<p>' . nl2br(htmlspecialchars($note['note_content'])) . '</p>';
            $html .= '</div>';
        }

        return $html;
    }

    /**
     * Build conclusions section
     */
    private function buildConclusionsSection($caseId, $db)
    {
        $conclusions = $db->table('investigator_conclusions')
            ->select('investigator_conclusions.*, users.full_name as investigator_name')
            ->join('users', 'users.id = investigator_conclusions.investigator_id', 'left')
            ->where('investigator_conclusions.case_id', $caseId)
            ->get()
            ->getResultArray();

        if (empty($conclusions)) {
            return '<p><em>No conclusions recorded.</em></p>';
        }

        $html = '';
        foreach ($conclusions as $conclusion) {
            $html .= '<div style="margin-bottom: 20px;">';
            $html .= '<h3>' . htmlspecialchars($conclusion['conclusion_title']) . '</h3>';
            $html .= '<p>' . nl2br(htmlspecialchars($conclusion['conclusion_text'])) . '</p>';
            $html .= '<p><em>By: ' . htmlspecialchars($conclusion['investigator_name'] ?? 'Unknown') . 
                     ' on ' . date('F d, Y', strtotime($conclusion['created_at'])) . '</em></p>';
            $html .= '</div>';
        }

        return $html;
    }

    /**
     * Build recommendations section
     */
    private function buildRecommendationsSection($report)
    {
        if (!empty($report['recommendations'])) {
            return '<p>' . nl2br(htmlspecialchars($report['recommendations'])) . '</p>';
        }
        return '<p><em>No recommendations provided.</em></p>';
    }

    /**
     * Build summary section (for basic reports)
     */
    private function buildSummarySection($report, $case)
    {
        $html = '<p><strong>Case Summary:</strong></p>';
        $html .= '<p>' . nl2br(htmlspecialchars($case['description'] ?? 'No summary available.')) . '</p>';
        return $html;
    }

    /**
     * Build conclusion section (for basic reports)
     */
    private function buildConclusionSection($report)
    {
        if (!empty($report['conclusion'])) {
            return '<p>' . nl2br(htmlspecialchars($report['conclusion'])) . '</p>';
        }
        return '<p><em>No conclusion provided.</em></p>';
    }
}
