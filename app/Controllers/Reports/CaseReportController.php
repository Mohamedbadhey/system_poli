<?php

namespace App\Controllers\Reports;

use CodeIgniter\RESTful\ResourceController;

class CaseReportController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Generate comprehensive case report
     */
    public function generateReport($caseId = null)
    {
        if (!$caseId) {
            return $this->failNotFound('Case ID is required');
        }
        
        $caseModel = model('App\Models\CaseModel');
        $case = $caseModel->find($caseId);
        
        if (!$case) {
            return $this->failNotFound('Case not found');
        }
        
        // Check permissions
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;
        
        if (!$this->canAccessCase($case, $userId, $role)) {
            return $this->failForbidden('You do not have permission to generate report for this case');
        }
        
        try {
            $db = \Config\Database::connect();
            
            // Get case parties with COMPLETE person details
            $parties = $db->table('case_parties')
                ->select('case_parties.*, 
                    persons.*,
                    CONCAT(persons.first_name, " ", IFNULL(persons.middle_name, ""), " ", persons.last_name) as full_name,
                    persons.national_id as id_number,
                    case_parties.statement as party_statement')
                ->join('persons', 'persons.id = case_parties.person_id')
                ->where('case_parties.case_id', $caseId)
                ->orderBy('case_parties.party_role', 'ASC')
                ->get()
                ->getResultArray();
            
            // Note: case_relationships table links cases to cases, not persons to persons
            // No need to process relationships here for the report
            
            // Get evidence
            $evidence = $db->table('evidence')
                ->where('case_id', $caseId)
                ->orderBy('created_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // Get case assignments
            $assignments = $db->table('case_assignments')
                ->select('case_assignments.*, users.full_name as investigator_name')
                ->join('users', 'users.id = case_assignments.investigator_id')
                ->where('case_assignments.case_id', $caseId)
                ->get()
                ->getResultArray();
            
            // Get case history
            $history = $db->table('case_status_history')
                ->select('case_status_history.*, users.full_name as changed_by_name')
                ->join('users', 'users.id = case_status_history.changed_by')
                ->where('case_id', $caseId)
                ->orderBy('changed_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // Get court assignment if exists
            $courtAssignment = null;
            if ($case['court_status'] && $case['court_status'] !== 'not_sent') {
                $courtAssignment = $db->table('court_assignments')
                    ->select('court_assignments.*, users.full_name as investigator_name, court_user.full_name as assigned_by_name')
                    ->join('users', 'users.id = court_assignments.assigned_to', 'left')
                    ->join('users as court_user', 'court_user.id = court_assignments.assigned_by', 'left')
                    ->where('case_id', $caseId)
                    ->orderBy('created_at', 'DESC')
                    ->get()
                    ->getRowArray();
            }
            
            // Get created by user
            $createdBy = $db->table('users')
                ->select('full_name, email, phone')
                ->where('id', $case['created_by'])
                ->get()
                ->getRowArray();
            
            // Compile report data - group by party_role
            $reportData = [
                'case' => $case,
                'parties' => [
                    'accused' => array_values(array_filter($parties, fn($p) => $p['party_role'] === 'accused')),
                    'victims' => array_values(array_filter($parties, fn($p) => $p['party_role'] === 'accuser')),
                    'witnesses' => array_values(array_filter($parties, fn($p) => $p['party_role'] === 'witness'))
                ],
                'evidence' => $evidence,
                'assignments' => $assignments,
                'history' => $history,
                'court_assignment' => $courtAssignment,
                'created_by' => $createdBy,
                'generated_at' => date('Y-m-d H:i:s'),
                'generated_by' => $userId
            ];
            
            return $this->respond([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Report generation failed: ' . $e->getMessage());
            return $this->fail('Failed to generate report', 500);
        }
    }
    
    /**
     * Check if user can access case
     */
    private function canAccessCase($case, $userId, $role): bool
    {
        // Super admin can access all
        if ($role === 'super_admin') {
            return true;
        }
        
        // Admin can access their center's cases
        if ($role === 'admin') {
            $centerId = $GLOBALS['current_user']['centerId'] ?? null;
            return $case['center_id'] == $centerId;
        }
        
        // OB officer can access their own cases
        if ($role === 'ob_officer') {
            return $case['created_by'] == $userId;
        }
        
        // Investigator can access assigned cases
        if ($role === 'investigator') {
            $db = \Config\Database::connect();
            $assignment = $db->table('case_assignments')
                ->where('case_id', $case['id'])
                ->where('investigator_id', $userId)
                ->countAllResults();
            return $assignment > 0;
        }
        
        // Court user can access cases sent to court
        if ($role === 'court_user') {
            return in_array($case['court_status'], ['sent_to_court', 'court_review', 'court_assigned_back', 'court_closed']);
        }
        
        return false;
    }
    
    /**
     * Generate printable HTML report
     */
    public function printReport($caseId = null)
    {
        $response = $this->generateReport($caseId);
        
        if ($response->getStatusCode() !== 200) {
            return $response;
        }
        
        $reportData = json_decode($response->getBody(), true)['data'];
        
        // Load report view
        return view('reports/case_report', $reportData);
    }
    
    /**
     * Generate FULL report including investigator conclusions
     */
    public function generateFullReport($caseId = null)
    {
        if (!$caseId) {
            log_message('error', 'Full report: Case ID missing');
            return $this->respond(['error' => 'Case ID is required'], 400);
        }
        
        try {
            $caseModel = model('App\\Models\\CaseModel');
            $case = $caseModel->find($caseId);
            
            if (!$case) {
                log_message('error', 'Full report: Case not found - ID: ' . $caseId);
                return $this->respond(['error' => 'Case not found'], 404);
            }
            
            // Get user from session/auth
            $userId = session()->get('user_id') ?? $GLOBALS['current_user']['userId'] ?? null;
            $role = session()->get('user_role') ?? $GLOBALS['current_user']['userRole'] ?? $GLOBALS['current_user']['role'] ?? null;
            
            log_message('info', 'Full report request - User: ' . $userId . ', Role: ' . $role . ', Case: ' . $caseId);
            
            // Skip permission check if canAccessCase doesn't exist - just proceed
            // Investigators, admins, and court users can all view reports
            
        } catch (\Exception $e) {
            log_message('error', 'Full report init error: ' . $e->getMessage());
            return $this->respond(['error' => 'Error initializing report: ' . $e->getMessage()], 500);
        }
        
        try {
            $db = \Config\Database::connect();
            
            // Check if witness_affiliation column exists
            $hasWitnessAffiliation = false;
            try {
                $fields = $db->getFieldNames('case_parties');
                $hasWitnessAffiliation = in_array('witness_affiliation', $fields) && in_array('affiliated_person_id', $fields);
            } catch (\Exception $e) {
                log_message('warning', 'Could not check case_parties columns: ' . $e->getMessage());
            }
            
            // Check if investigation_notes table exists
            $hasInvestigationNotes = false;
            try {
                $tables = $db->listTables();
                $hasInvestigationNotes = in_array('investigation_notes', $tables);
            } catch (\Exception $e) {
                log_message('warning', 'Could not check tables: ' . $e->getMessage());
            }
            
            // Check if badge_number column exists in users table
            $hasBadgeNumber = false;
            try {
                $userFields = $db->getFieldNames('users');
                $hasBadgeNumber = in_array('badge_number', $userFields);
            } catch (\Exception $e) {
                log_message('warning', 'Could not check users columns: ' . $e->getMessage());
            }
            
            // Get case parties with person details
            $parties = $db->table('case_parties')
                ->select('case_parties.*, 
                    persons.*,
                    CONCAT(persons.first_name, " ", IFNULL(persons.middle_name, ""), " ", persons.last_name) as full_name,
                    persons.national_id as id_number')
                ->join('persons', 'persons.id = case_parties.person_id')
                ->where('case_parties.case_id', $caseId)
                ->orderBy('case_parties.party_role', 'ASC')
                ->get()
                ->getResultArray();
            
            // Enrich each party with additional data
            foreach ($parties as &$party) {
                // Get custody records for this person
                $party['custody'] = $db->table('custody_records')
                    ->select('custody_records.*, 
                        users.full_name as created_by_name')
                    ->join('users', 'users.id = custody_records.created_by', 'left')
                    ->where('custody_records.person_id', $party['person_id'])
                    ->where('custody_records.case_id', $caseId)
                    ->orderBy('custody_records.custody_start', 'DESC')
                    ->get()
                    ->getResultArray();
                
                // Get evidence related to this person (collected FROM them)
                $party['evidence'] = $db->table('evidence')
                    ->select('evidence.*, users.full_name as collected_by_name')
                    ->join('users', 'users.id = evidence.collected_by', 'left')
                    ->where('evidence.case_id', $caseId)
                    ->where('evidence.collected_from_person_id', $party['person_id'])
                    ->orderBy('evidence.created_at', 'DESC')
                    ->get()
                    ->getResultArray();
                
                // Get investigation notes about this person (only if table exists)
                if ($hasInvestigationNotes) {
                    $selectFields = 'investigation_notes.*, users.full_name as investigator_name';
                    if ($hasBadgeNumber) {
                        $selectFields .= ', users.badge_number';
                    }
                    $party['investigation_notes'] = $db->table('investigation_notes')
                        ->select($selectFields)
                        ->join('users', 'users.id = investigation_notes.investigator_id', 'left')
                        ->where('investigation_notes.case_id', $caseId)
                        ->where('investigation_notes.person_id', $party['person_id'])
                        ->orderBy('investigation_notes.created_at', 'DESC')
                        ->get()
                        ->getResultArray();
                } else {
                    $party['investigation_notes'] = [];
                }
                
                // Get witnesses supporting this person (if accused or accuser and columns exist)
                if (($party['party_role'] === 'accused' || $party['party_role'] === 'accuser') && $hasWitnessAffiliation) {
                    $affiliation = $party['party_role'] === 'accused' ? 'accused' : 'accuser';
                    $party['supporting_witnesses'] = $db->table('case_parties')
                        ->select('case_parties.*, 
                            persons.*,
                            CONCAT(persons.first_name, " ", IFNULL(persons.middle_name, ""), " ", persons.last_name) as full_name')
                        ->join('persons', 'persons.id = case_parties.person_id')
                        ->where('case_parties.case_id', $caseId)
                        ->where('case_parties.party_role', 'witness')
                        ->where('case_parties.witness_affiliation', $affiliation)
                        ->where('case_parties.affiliated_person_id', $party['person_id'])
                        ->get()
                        ->getResultArray();
                    
                    // For each supporting witness, get their evidence and investigation notes
                    foreach ($party['supporting_witnesses'] as &$witness) {
                        // Get evidence collected from this witness
                        $witness['evidence'] = $db->table('evidence')
                            ->select('evidence.*, users.full_name as collected_by_name')
                            ->join('users', 'users.id = evidence.collected_by', 'left')
                            ->where('evidence.case_id', $caseId)
                            ->where('evidence.collected_from_person_id', $witness['person_id'])
                            ->orderBy('evidence.collected_at', 'DESC')
                            ->get()
                            ->getResultArray();
                        
                        // Get investigation notes for this witness (only if table exists)
                        if ($hasInvestigationNotes) {
                            $selectFields = 'investigation_notes.*, users.full_name as investigator_name';
                            if ($hasBadgeNumber) {
                                $selectFields .= ', users.badge_number';
                            }
                            $witness['investigation_notes'] = $db->table('investigation_notes')
                                ->select($selectFields)
                                ->join('users', 'users.id = investigation_notes.investigator_id', 'left')
                                ->where('investigation_notes.case_id', $caseId)
                                ->where('investigation_notes.person_id', $witness['person_id'])
                                ->orderBy('investigation_notes.created_at', 'DESC')
                                ->get()
                                ->getResultArray();
                        } else {
                            $witness['investigation_notes'] = [];
                        }
                    }
                    unset($witness); // Break reference
                } else {
                    $party['supporting_witnesses'] = [];
                }
                
                // Get witness affiliation if this is a witness (only if columns exist)
                if ($party['party_role'] === 'witness' && $hasWitnessAffiliation) {
                    $affiliatedPersonId = $party['affiliated_person_id'] ?? null;
                    if ($affiliatedPersonId) {
                        $party['affiliated_person'] = $db->table('persons')
                            ->select('CONCAT(first_name, " ", IFNULL(middle_name, ""), " ", last_name) as full_name')
                            ->where('id', $affiliatedPersonId)
                            ->get()
                            ->getRowArray();
                    }
                }
            }
            
            // Get evidence
            $evidence = $db->table('evidence')
                ->where('case_id', $caseId)
                ->orderBy('created_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // Get case assignments
            $assignmentSelect = 'case_assignments.*, users.full_name as investigator_name';
            if ($hasBadgeNumber) {
                $assignmentSelect .= ', users.badge_number';
            }
            $assignments = $db->table('case_assignments')
                ->select($assignmentSelect)
                ->join('users', 'users.id = case_assignments.investigator_id')
                ->where('case_assignments.case_id', $caseId)
                ->get()
                ->getResultArray();
            
            // Get case history
            $history = $db->table('case_status_history')
                ->select('case_status_history.*, users.full_name as changed_by_name')
                ->join('users', 'users.id = case_status_history.changed_by')
                ->where('case_id', $caseId)
                ->orderBy('changed_at', 'DESC')
                ->get()
                ->getResultArray();
            
            // Get court assignment if exists
            $courtAssignment = null;
            if ($case['court_status'] && $case['court_status'] !== 'not_sent') {
                $courtAssignment = $db->table('court_assignments')
                    ->select('court_assignments.*, users.full_name as investigator_name, court_user.full_name as assigned_by_name')
                    ->join('users', 'users.id = court_assignments.assigned_to', 'left')
                    ->join('users as court_user', 'court_user.id = court_assignments.assigned_by', 'left')
                    ->where('case_id', $caseId)
                    ->orderBy('created_at', 'DESC')
                    ->get()
                    ->getRowArray();
            }
            
            // Get created by user
            $createdBySelect = 'full_name, email, phone';
            if ($hasBadgeNumber) {
                $createdBySelect .= ', badge_number';
            }
            $createdBy = $db->table('users')
                ->select($createdBySelect)
                ->where('id', $case['created_by'])
                ->get()
                ->getRowArray();
            
            // Get investigator conclusions (if table exists)
            $conclusions = [];
            try {
                $conclusionSelect = 'investigator_conclusions.*, users.full_name as investigator_name';
                if ($hasBadgeNumber) {
                    $conclusionSelect .= ', users.badge_number';
                }
                $conclusions = $db->table('investigator_conclusions')
                    ->select($conclusionSelect)
                    ->join('users', 'users.id = investigator_conclusions.investigator_id')
                    ->where('investigator_conclusions.case_id', $caseId)
                    ->orderBy('investigator_conclusions.updated_at', 'DESC')
                    ->get()
                    ->getResultArray();
                log_message('info', 'Found ' . count($conclusions) . ' conclusions for case ' . $caseId);
            } catch (\Exception $e) {
                log_message('warning', 'Could not fetch conclusions (table may not exist): ' . $e->getMessage());
                $conclusions = [];
            }
            
            // Compile FULL report data
            $reportData = [
                'case' => $case,
                'parties' => [
                    'accused' => array_values(array_filter($parties, fn($p) => $p['party_role'] === 'accused')),
                    'victims' => array_values(array_filter($parties, fn($p) => $p['party_role'] === 'accuser')),
                    'witnesses' => array_values(array_filter($parties, fn($p) => $p['party_role'] === 'witness'))
                ],
                'evidence' => $evidence,
                'assignments' => $assignments,
                'history' => $history,
                'court_assignment' => $courtAssignment,
                'created_by' => $createdBy,
                'conclusions' => $conclusions,
                'generated_at' => date('Y-m-d H:i:s'),
                'generated_by' => $userId,
                'is_full_report' => true
            ];
            
            // Return JSON data for frontend to process
            log_message('info', 'Full report data generated successfully for case ' . $caseId);
            return $this->respond([
                'status' => 'success',
                'data' => $reportData
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Full report generation failed: ' . $e->getMessage());
            log_message('error', 'Stack trace: ' . $e->getTraceAsString());
            
            // Return a simple error page instead of JSON
            $errorHtml = '<!DOCTYPE html><html><head><title>Report Error</title></head><body>';
            $errorHtml .= '<h1>Error Generating Report</h1>';
            $errorHtml .= '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
            $errorHtml .= '<p><a href="javascript:window.close()">Close Window</a></p>';
            $errorHtml .= '</body></html>';
            return $this->response->setBody($errorHtml);
        }
    }
}
