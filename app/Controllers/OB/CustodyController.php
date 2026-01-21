<?php

namespace App\Controllers\OB;

use CodeIgniter\RESTful\ResourceController;

class CustodyController extends ResourceController
{
    protected $modelName = 'App\\Models\\CustodyRecordModel';
    protected $format = 'json';
    
    /**
     * Get all custody records (with optional filtering)
     */
    public function index()
    {
        $custodyModel = model('App\\Models\\CustodyRecordModel');
        $builder = $custodyModel->select('custody_records.*, 
                CONCAT(persons.first_name, " ", persons.last_name) as person_name,
                persons.person_type,
                cases.case_number')
            ->join('persons', 'persons.id = custody_records.person_id')
            ->join('cases', 'cases.id = custody_records.case_id')
            ->where('custody_records.center_id', $this->request->centerId)
            ->where('persons.person_type !=', 'other');
        
        // Optional status filter
        $status = $this->request->getGet('status');
        if ($status) {
            $builder->where('custody_records.custody_status', $status);
        }
        
        $custody = $builder->findAll();
        
        return $this->respond([
            'status' => 'success',
            'data' => $custody
        ]);
    }
    
    /**
     * Create custody record
     */
    public function create()
    {
        $rules = [
            'case_id' => 'required|integer',
            'person_id' => 'required|integer',
            'custody_location' => 'required',
            'custody_start' => 'required|valid_date'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        // Get input from both JSON and POST (handles both content types)
        $input = $this->request->getJSON(true) ?: $this->request->getPost();
        
        // Check if person is already in custody
        $custodyModel = model('App\Models\CustodyRecordModel');
        $existing = $custodyModel->where('person_id', $input['person_id'])
            ->where('custody_status', 'in_custody')
            ->first();
        
        if ($existing) {
            return $this->fail('Person is already in custody', 400);
        }
        
        $data = [
            'case_id' => $input['case_id'],
            'person_id' => $input['person_id'],
            'center_id' => $this->request->centerId,
            'custody_status' => 'in_custody',
            'custody_location' => $input['custody_location'],
            'cell_number' => $input['cell_number'] ?? null,
            'custody_start' => $input['custody_start'],
            'expected_release_date' => $input['expected_release_date'] ?? null,
            'arrest_warrant_number' => $input['arrest_warrant_number'] ?? null,
            'legal_time_limit' => $input['legal_time_limit'] ?? 48,
            'health_status' => $input['health_status'] ?? 'good',
            'medical_conditions' => $input['medical_conditions'] ?? null,
            'medications' => $input['medications'] ?? null,
            'custody_notes' => $input['custody_notes'] ?? null,
            'created_by' => $this->request->userId
        ];
        
        $custodyId = $custodyModel->insert($data);
        
        if (!$custodyId) {
            return $this->fail('Failed to create custody record', 500);
        }
        
        // Create initial daily log
        $this->createInitialDailyLog($custodyId, $data);
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Custody record created successfully',
            'data' => $custodyModel->find($custodyId)
        ]);
    }
    
    /**
     * Update custody record
     */
    public function update($id = null)
    {
        $custodyModel = model('App\\Models\\CustodyRecordModel');
        $custody = $custodyModel->find($id);
        
        if (!$custody) {
            return $this->failNotFound('Custody record not found');
        }
        
        $input = $this->request->getJSON(true) ?: $this->request->getPost();
        
        $updateData = [];
        
        // Allow updating these fields (case_id should NOT be updated)
        $allowedFields = [
            'custody_status', 'custody_location', 'cell_number',
            'custody_end', 'custody_notes', 'health_status',
            'medical_conditions', 'medications'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateData[$field] = $input[$field];
            }
        }
        
        if (empty($updateData)) {
            return $this->fail('No valid fields to update', 400);
        }
        
        $custodyModel->update($id, $updateData);
        
        // Log the update
        $db = \Config\Database::connect();
        $db->table('custody_daily_logs')->insert([
            'custody_record_id' => $id,
            'log_date' => date('Y-m-d'),
            'log_time' => date('H:i:s'),
            'custody_status' => $updateData['custody_status'] ?? $custody['custody_status'],
            'location' => $updateData['custody_location'] ?? $custody['custody_location'],
            'health_status' => $custody['health_status'],
            'health_notes' => 'Custody status updated',
            'logged_by' => $this->request->userId
        ]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Custody record updated successfully',
            'data' => $custodyModel->find($id)
        ]);
    }
    
    /**
     * Get custody details
     */
    public function show($id = null)
    {
        $custodyModel = model('App\Models\CustodyRecordModel');
        $custody = $custodyModel->getCustodyWithAlerts($id);
        
        if (!$custody) {
            return $this->failNotFound('Custody record not found');
        }
        
        // Get person and case details
        $db = \Config\Database::connect();
        $custody['person'] = $db->table('persons')
            ->where('id', $custody['person_id'])
            ->get()
            ->getRowArray();
        
        $custody['case'] = $db->table('cases')
            ->where('id', $custody['case_id'])
            ->get()
            ->getRowArray();
        
        // Get daily logs
        $custody['daily_logs'] = $db->table('custody_daily_logs')
            ->where('custody_record_id', $id)
            ->orderBy('log_date', 'DESC')
            ->limit(30)
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $custody
        ]);
    }
    
    /**
     * Add daily custody log
     */
    public function addDailyLog($id = null)
    {
        $custodyModel = model('App\Models\CustodyRecordModel');
        $custody = $custodyModel->find($id);
        
        if (!$custody) {
            return $this->failNotFound('Custody record not found');
        }
        
        // Get input from both JSON and POST (handles both content types)
        $input = $this->request->getJSON(true) ?: $this->request->getPost();
        
        $logData = [
            'custody_record_id' => $id,
            'log_date' => $input['log_date'] ?? date('Y-m-d'),
            'log_time' => $input['log_time'] ?? date('H:i:s'),
            'custody_status' => $input['custody_status'] ?? 'in_custody',
            'location' => $input['location'] ?? $custody['custody_location'],
            'health_check_done' => $input['health_check_done'] ?? 0,
            'health_status' => $input['health_status'] ?? 'good',
            'health_notes' => $input['health_notes'] ?? null,
            'meal_provided' => $input['meal_provided'] ?? 0,
            'exercise_allowed' => $input['exercise_allowed'] ?? 0,
            'visitor_allowed' => $input['visitor_allowed'] ?? 0,
            'visitor_names' => $input['visitor_names'] ?? null,
            'behavior_notes' => $input['behavior_notes'] ?? null,
            'incident_notes' => $input['incident_notes'] ?? null,
            'logged_by' => $this->request->userId
        ];
        
        $db = \Config\Database::connect();
        $db->table('custody_daily_logs')->insert($logData);
        
        // Update custody record health status
        $custodyModel->update($id, [
            'health_status' => $logData['health_status'],
            'last_health_check' => date('Y-m-d H:i:s')
        ]);
        
        // Check custody time limit and create alerts
        $this->checkCustodyTimeLimits($custody);
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Daily log added successfully'
        ]);
    }
    
    /**
     * Get active custody list
     */
    public function getActiveCustody()
    {
        $custodyModel = model('App\Models\CustodyRecordModel');
        $custody = $custodyModel->getActiveCustody($this->request->centerId);
        
        return $this->respond([
            'status' => 'success',
            'data' => $custody
        ]);
    }
    
    /**
     * Record custody movement
     */
    public function recordMovement($id = null)
    {
        $custodyModel = model('App\Models\CustodyRecordModel');
        $custody = $custodyModel->find($id);
        
        if (!$custody) {
            return $this->failNotFound('Custody record not found');
        }
        
        // Get input from both JSON and POST (handles both content types)
        $input = $this->request->getJSON(true) ?: $this->request->getPost();
        
        $movementData = [
            'custody_record_id' => $id,
            'movement_type' => $input['movement_type'],
            'from_location' => $input['from_location'],
            'to_location' => $input['to_location'],
            'movement_start' => $input['movement_start'],
            'movement_end' => $input['movement_end'] ?? null,
            'authorized_by' => $this->request->userId,
            'escorted_by' => $input['escorted_by'] ?? null,
            'vehicle_details' => $input['vehicle_details'] ?? null,
            'purpose' => $input['purpose'] ?? null,
            'outcome' => $input['outcome'] ?? null,
            'notes' => $input['notes'] ?? null,
            'created_by' => $this->request->userId
        ];
        
        $db = \Config\Database::connect();
        $db->table('custody_movement_log')->insert($movementData);
        
        return $this->respondCreated([
            'status' => 'success',
            'message' => 'Movement recorded successfully'
        ]);
    }
    
    /**
     * Create initial daily log
     */
    private function createInitialDailyLog(int $custodyId, array $custodyData)
    {
        $db = \Config\Database::connect();
        $db->table('custody_daily_logs')->insert([
            'custody_record_id' => $custodyId,
            'log_date' => date('Y-m-d'),
            'log_time' => date('H:i:s'),
            'custody_status' => 'in_custody',
            'location' => $custodyData['custody_location'],
            'health_status' => $custodyData['health_status'],
            'health_notes' => 'Initial custody intake',
            'logged_by' => $custodyData['created_by']
        ]);
    }
    
    /**
     * Check custody time limits and create alerts
     */
    private function checkCustodyTimeLimits(array $custody)
    {
        $hoursInCustody = (time() - strtotime($custody['custody_start'])) / 3600;
        $timeLimit = $custody['legal_time_limit'] ?? 48;
        
        $db = \Config\Database::connect();
        
        if ($hoursInCustody >= $timeLimit) {
            // Time limit exceeded
            $existingAlert = $db->table('custody_alerts')
                ->where('custody_record_id', $custody['id'])
                ->where('alert_type', 'time_limit_exceeded')
                ->where('is_resolved', 0)
                ->get()
                ->getRowArray();
            
            if (!$existingAlert) {
                $db->table('custody_alerts')->insert([
                    'custody_record_id' => $custody['id'],
                    'alert_type' => 'time_limit_exceeded',
                    'alert_severity' => 'critical',
                    'alert_message' => "Legal custody time limit of {$timeLimit} hours has been exceeded"
                ]);
            }
        } elseif ($hoursInCustody >= ($timeLimit * 0.75)) {
            // 75% of time limit reached
            $existingAlert = $db->table('custody_alerts')
                ->where('custody_record_id', $custody['id'])
                ->where('alert_type', 'time_limit_warning')
                ->where('is_resolved', 0)
                ->get()
                ->getRowArray();
            
            if (!$existingAlert) {
                $db->table('custody_alerts')->insert([
                    'custody_record_id' => $custody['id'],
                    'alert_type' => 'time_limit_warning',
                    'alert_severity' => 'high',
                    'alert_message' => "Approaching custody time limit - {$hoursInCustody} hours in custody"
                ]);
            }
        }
    }
}
