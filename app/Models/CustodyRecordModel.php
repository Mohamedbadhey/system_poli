<?php

namespace App\Models;

class CustodyRecordModel extends BaseModel
{
    protected $table = 'custody_records';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'case_id', 'person_id', 'center_id', 'custody_status',
        'custody_location', 'cell_number', 'custody_start', 'custody_end',
        'expected_release_date', 'arrest_warrant_number', 'detention_order_path',
        'legal_time_limit', 'health_status', 'medical_conditions',
        'medications', 'last_health_check', 'custody_notes', 'created_by'
    ];
    
    public function getActiveCustody(int $centerId)
    {
        return $this->select('custody_records.*, 
                CONCAT(persons.first_name, " ", persons.last_name) as person_name,
                persons.person_type,
                cases.case_number')
            ->join('persons', 'persons.id = custody_records.person_id')
            ->join('cases', 'cases.id = custody_records.case_id')
            ->where('custody_records.center_id', $centerId)
            ->where('custody_records.custody_status', 'in_custody')
            ->where('persons.person_type !=', 'other')
            ->findAll();
    }
    
    public function getCustodyWithAlerts(int $custodyId)
    {
        $custody = $this->find($custodyId);
        if (!$custody) {
            return null;
        }
        
        $db = \Config\Database::connect();
        $custody['alerts'] = $db->table('custody_alerts')
            ->where('custody_record_id', $custodyId)
            ->where('is_resolved', 0)
            ->orderBy('alert_severity', 'DESC')
            ->get()
            ->getResultArray();
        
        return $custody;
    }
}
