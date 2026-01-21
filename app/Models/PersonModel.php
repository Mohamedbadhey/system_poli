<?php

namespace App\Models;

class PersonModel extends BaseModel
{
    protected $table = 'persons';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'person_type', 'first_name', 'middle_name', 'last_name',
        'date_of_birth', 'gender', 'national_id', 'phone', 'email',
        'address', 'gps_latitude', 'gps_longitude', 'photo_path',
        'fingerprint_hash', 'fingerprint_data', 'is_repeat_offender',
        'risk_level', 'created_by'
    ];
    
    protected $validationRules = [
        'person_type' => 'required|in_list[accused,accuser,witness,other]',
        'first_name' => 'required|max_length[100]',
        'middle_name' => 'permit_empty|max_length[100]',
        'last_name' => 'required|max_length[100]',
        'date_of_birth' => 'permit_empty|valid_date',
        'gender' => 'permit_empty|in_list[male,female,other]',
        'national_id' => 'permit_empty|max_length[50]',
        'phone' => 'permit_empty|max_length[20]',
        'email' => 'permit_empty|valid_email',
        'risk_level' => 'permit_empty|in_list[low,medium,high,critical]'
    ];
    
    /**
     * Search by fingerprint hash
     */
    public function findByFingerprint(string $fingerprintHash)
    {
        return $this->where('fingerprint_hash', $fingerprintHash)->first();
    }
    
    /**
     * Get criminal history
     */
    public function getCriminalHistory(int $personId)
    {
        $db = \Config\Database::connect();
        
        return $db->table('cases')
            ->select('cases.*, case_parties.party_role')
            ->join('case_parties', 'case_parties.case_id = cases.id')
            ->where('case_parties.person_id', $personId)
            ->where('case_parties.party_role', 'accused')
            ->orderBy('cases.incident_date', 'DESC')
            ->get()
            ->getResultArray();
    }
    
    /**
     * Get person full profile with aliases and case history
     */
    public function getFullProfile(int $personId)
    {
        $person = $this->find($personId);
        if (!$person) {
            return null;
        }
        
        $db = \Config\Database::connect();
        
        // Get aliases
        $person['aliases'] = $db->table('person_aliases')
            ->where('person_id', $personId)
            ->get()
            ->getResultArray();
        
        // Get case count
        $person['total_cases'] = $db->table('case_parties')
            ->where('person_id', $personId)
            ->countAllResults();
        
        // Get active cases
        $person['active_cases'] = $db->table('case_parties')
            ->select('cases.*')
            ->join('cases', 'cases.id = case_parties.case_id')
            ->where('case_parties.person_id', $personId)
            ->whereIn('cases.status', ['investigating', 'assigned', 'approved', 'court_pending'])
            ->get()
            ->getResultArray();
        
        // Check if in custody
        $person['in_custody'] = $db->table('custody_records')
            ->where('person_id', $personId)
            ->where('custody_status', 'in_custody')
            ->countAllResults() > 0;
        
        return $person;
    }
    
    /**
     * Update repeat offender status
     */
    public function updateRepeatOffenderStatus(int $personId)
    {
        $caseCount = \Config\Database::connect()
            ->table('case_parties')
            ->where('person_id', $personId)
            ->where('party_role', 'accused')
            ->countAllResults();
        
        $isRepeatOffender = $caseCount > 1 ? 1 : 0;
        
        // Auto-update risk level
        $riskLevel = 'low';
        if ($caseCount >= 5) {
            $riskLevel = 'critical';
        } elseif ($caseCount >= 3) {
            $riskLevel = 'high';
        } elseif ($caseCount >= 2) {
            $riskLevel = 'medium';
        }
        
        return $this->update($personId, [
            'is_repeat_offender' => $isRepeatOffender,
            'risk_level' => $riskLevel
        ]);
    }
    
    /**
     * Search persons by name or ID
     */
    public function searchPersons(string $keyword, ?string $personType = null, int $limit = 50)
    {
        $builder = $this->builder();
        
        $builder->groupStart()
            ->like('first_name', $keyword)
            ->orLike('last_name', $keyword)
            ->orLike('middle_name', $keyword)
            ->orLike('national_id', $keyword)
            ->orLike('phone', $keyword)
            ->groupEnd();
        
        if ($personType) {
            $builder->where('person_type', $personType);
        }
        
        return $builder->limit($limit)->get()->getResultArray();
    }
}
