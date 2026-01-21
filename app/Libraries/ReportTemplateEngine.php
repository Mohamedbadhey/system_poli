<?php

namespace App\Libraries;

class ReportTemplateEngine
{
    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    /**
     * Generate report from template
     */
    public function generateFromTemplate($templateType, $caseId, $additionalData = [])
    {
        $template = $this->getTemplate($templateType);
        
        if (!$template) {
            return null;
        }

        $variables = $this->collectVariables($caseId, $additionalData);
        $content = $this->replaceVariables($template['template_content'], $variables);

        return [
            'content' => $content,
            'template' => $template,
            'variables' => $variables
        ];
    }

    /**
     * Get template by type
     */
    private function getTemplate($templateType)
    {
        return $this->db->table('document_templates')
            ->where('template_type', $templateType)
            ->where('is_active', 1)
            ->get()
            ->getRowArray();
    }

    /**
     * Collect all variables for replacement
     */
    private function collectVariables($caseId, $additionalData = [])
    {
        $variables = [];

        // Get case details
        $case = $this->db->table('cases')->where('id', $caseId)->get()->getRowArray();
        if ($case) {
            $variables = array_merge($variables, $this->getCaseVariables($case));
        }

        // Get parties
        $parties = $this->db->table('case_parties')
            ->select('case_parties.*, persons.*')
            ->join('persons', 'persons.id = case_parties.person_id')
            ->where('case_parties.case_id', $caseId)
            ->get()
            ->getResultArray();

        $variables = array_merge($variables, $this->getPartiesVariables($parties));

        // Get evidence
        $evidence = $this->db->table('evidence')
            ->where('case_id', $caseId)
            ->get()
            ->getResultArray();

        $variables = array_merge($variables, $this->getEvidenceVariables($evidence));

        // Get investigator
        if (isset($case['created_by'])) {
            $investigator = $this->db->table('users')
                ->where('id', $case['created_by'])
                ->get()
                ->getRowArray();
            
            if ($investigator) {
                $variables = array_merge($variables, $this->getInvestigatorVariables($investigator));
            }
        }

        // Get police center
        if (isset($case['center_id'])) {
            $center = $this->db->table('police_centers')
                ->where('id', $case['center_id'])
                ->get()
                ->getRowArray();
            
            if ($center) {
                $variables = array_merge($variables, $this->getCenterVariables($center));
            }
        }

        // Add additional data
        $variables = array_merge($variables, $additionalData);

        // Add system variables
        $variables['report_date'] = date('Y-m-d');
        $variables['report_time'] = date('H:i:s');
        $variables['report_datetime'] = date('Y-m-d H:i:s');
        $variables['system_name'] = 'Police Case Management System';

        return $variables;
    }

    /**
     * Extract case variables
     */
    private function getCaseVariables($case)
    {
        return [
            'case_id' => $case['id'],
            'case_number' => $case['case_number'],
            'ob_number' => $case['ob_number'],
            'crime_type' => $case['crime_type'],
            'crime_category' => $case['crime_category'],
            'incident_date' => $case['incident_date'],
            'incident_time' => date('H:i', strtotime($case['incident_date'])),
            'incident_location' => $case['incident_location'],
            'incident_description' => $case['incident_description'],
            'case_status' => $case['status'],
            'court_status' => $case['court_status'],
            'priority' => $case['priority'],
            'is_sensitive' => $case['is_sensitive'] ? 'Yes' : 'No',
            'report_date_case' => $case['report_date'],
            'created_at' => $case['created_at']
        ];
    }

    /**
     * Extract parties variables
     */
    private function getPartiesVariables($parties)
    {
        $variables = [
            'total_parties' => count($parties),
            'accused_list' => '',
            'accuser_list' => '',
            'witness_list' => '',
            'accused_names' => '',
            'accuser_names' => '',
            'witness_names' => ''
        ];

        $accused = array_filter($parties, fn($p) => $p['party_role'] === 'accused');
        $accusers = array_filter($parties, fn($p) => $p['party_role'] === 'accuser');
        $witnesses = array_filter($parties, fn($p) => $p['party_role'] === 'witness');

        // Build accused list
        $accusedNames = [];
        $accusedList = '';
        foreach ($accused as $idx => $person) {
            $fullName = trim("{$person['first_name']} {$person['middle_name']} {$person['last_name']}");
            $accusedNames[] = $fullName;
            $accusedList .= ($idx + 1) . ". " . $fullName;
            $accusedList .= "\n   ID: " . ($person['national_id'] ?? 'N/A');
            $accusedList .= "\n   DOB: " . ($person['date_of_birth'] ?? 'N/A');
            $accusedList .= "\n   Address: " . ($person['address'] ?? 'N/A') . "\n\n";
        }
        $variables['accused_list'] = $accusedList;
        $variables['accused_names'] = implode(', ', $accusedNames);
        $variables['total_accused'] = count($accused);

        // Build accuser list
        $accuserNames = [];
        $accuserList = '';
        foreach ($accusers as $idx => $person) {
            $fullName = trim("{$person['first_name']} {$person['middle_name']} {$person['last_name']}");
            $accuserNames[] = $fullName;
            $accuserList .= ($idx + 1) . ". " . $fullName;
            $accuserList .= "\n   ID: " . ($person['national_id'] ?? 'N/A');
            $accuserList .= "\n   Contact: " . ($person['phone'] ?? 'N/A');
            $accuserList .= "\n   Address: " . ($person['address'] ?? 'N/A') . "\n\n";
        }
        $variables['accuser_list'] = $accuserList;
        $variables['accuser_names'] = implode(', ', $accuserNames);
        $variables['total_accusers'] = count($accusers);
        $variables['victim_names'] = $variables['accuser_names']; // Alias

        // Build witness list
        $witnessNames = [];
        $witnessList = '';
        foreach ($witnesses as $idx => $person) {
            $fullName = trim("{$person['first_name']} {$person['middle_name']} {$person['last_name']}");
            $witnessNames[] = $fullName;
            $witnessList .= ($idx + 1) . ". " . $fullName;
            $witnessList .= "\n   ID: " . ($person['national_id'] ?? 'N/A');
            $witnessList .= "\n   Contact: " . ($person['phone'] ?? 'N/A');
            $witnessList .= "\n   Affiliation: " . ($person['witness_affiliation'] ?? 'neutral') . "\n\n";
        }
        $variables['witness_list'] = $witnessList;
        $variables['witness_names'] = implode(', ', $witnessNames);
        $variables['total_witnesses'] = count($witnesses);

        return $variables;
    }

    /**
     * Extract evidence variables
     */
    private function getEvidenceVariables($evidence)
    {
        $variables = [
            'total_evidence' => count($evidence),
            'evidence_list' => '',
            'critical_evidence_count' => 0
        ];

        $evidenceList = '';
        $criticalCount = 0;

        foreach ($evidence as $idx => $item) {
            $evidenceList .= ($idx + 1) . ". {$item['evidence_number']} - {$item['title']}\n";
            $evidenceList .= "   Type: {$item['evidence_type']}\n";
            $evidenceList .= "   Description: " . ($item['description'] ?? 'N/A') . "\n";
            $evidenceList .= "   Collected: " . ($item['collected_at'] ?? 'N/A') . "\n";
            
            if ($item['is_critical']) {
                $evidenceList .= "   ** CRITICAL EVIDENCE **\n";
                $criticalCount++;
            }
            
            $evidenceList .= "\n";
        }

        $variables['evidence_list'] = $evidenceList;
        $variables['critical_evidence_count'] = $criticalCount;

        // Group by type
        $byType = [];
        foreach ($evidence as $item) {
            $type = $item['evidence_type'];
            if (!isset($byType[$type])) {
                $byType[$type] = 0;
            }
            $byType[$type]++;
        }

        foreach ($byType as $type => $count) {
            $variables["evidence_{$type}_count"] = $count;
        }

        return $variables;
    }

    /**
     * Extract investigator variables
     */
    private function getInvestigatorVariables($investigator)
    {
        return [
            'investigator_name' => $investigator['full_name'],
            'investigator_badge' => $investigator['badge_number'] ?? 'N/A',
            'investigator_email' => $investigator['email'] ?? 'N/A',
            'investigator_phone' => $investigator['phone'] ?? 'N/A',
            'investigator_role' => $investigator['role']
        ];
    }

    /**
     * Extract center variables
     */
    private function getCenterVariables($center)
    {
        return [
            'police_center_name' => $center['center_name'],
            'police_center_code' => $center['center_code'],
            'police_center_location' => $center['location'] ?? 'N/A',
            'police_center_phone' => $center['phone'] ?? 'N/A'
        ];
    }

    /**
     * Replace template variables with actual values
     */
    private function replaceVariables($template, $variables)
    {
        $content = $template;

        foreach ($variables as $key => $value) {
            // Handle null values
            if ($value === null) {
                $value = 'N/A';
            }

            // Replace {{variable}} format
            $content = str_replace('{{' . $key . '}}', $value, $content);
            
            // Also support {variable} format
            $content = str_replace('{' . $key . '}', $value, $content);
        }

        return $content;
    }

    /**
     * Get all available variables for a template type
     */
    public function getAvailableVariables($templateType)
    {
        $baseVariables = [
            // Case variables
            'case_number', 'ob_number', 'crime_type', 'crime_category',
            'incident_date', 'incident_time', 'incident_location', 'incident_description',
            'case_status', 'court_status', 'priority', 'is_sensitive',
            
            // Party variables
            'total_parties', 'total_accused', 'total_accusers', 'total_witnesses',
            'accused_list', 'accused_names', 'accuser_list', 'accuser_names',
            'witness_list', 'witness_names', 'victim_names',
            
            // Evidence variables
            'total_evidence', 'evidence_list', 'critical_evidence_count',
            'evidence_photo_count', 'evidence_video_count', 'evidence_audio_count',
            'evidence_document_count', 'evidence_physical_count', 'evidence_digital_count',
            
            // Investigator variables
            'investigator_name', 'investigator_badge', 'investigator_email', 'investigator_phone',
            
            // Center variables
            'police_center_name', 'police_center_code', 'police_center_location', 'police_center_phone',
            
            // System variables
            'report_date', 'report_time', 'report_datetime', 'system_name'
        ];

        return $baseVariables;
    }

    /**
     * Validate template syntax
     */
    public function validateTemplate($templateContent)
    {
        $errors = [];

        // Check for unclosed variables
        preg_match_all('/\{\{([^}]+)$/', $templateContent, $unclosed);
        if (!empty($unclosed[0])) {
            $errors[] = 'Template contains unclosed variable tags';
        }

        // Check for invalid variable names
        preg_match_all('/\{\{([^}]+)\}\}/', $templateContent, $matches);
        if (!empty($matches[1])) {
            foreach ($matches[1] as $varName) {
                if (!preg_match('/^[a-z_][a-z0-9_]*$/i', trim($varName))) {
                    $errors[] = "Invalid variable name: {$varName}";
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}
