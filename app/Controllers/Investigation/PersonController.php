<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;

class PersonController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get all persons involved in investigator's assigned cases
     * GET /investigation/persons
     */
    public function index()
    {
        $investigatorId = $this->request->userId;
        $db = \Config\Database::connect();
        
        // Get all persons from cases assigned to this investigator
        $persons = $db->table('persons p')
            ->select('p.*, 
                COUNT(DISTINCT cp.case_id) as total_cases,
                COUNT(DISTINCT CASE WHEN ca.investigator_id = ' . $investigatorId . ' THEN cp.case_id END) as investigator_cases,
                cr.custody_status,
                cr.custody_location,
                GROUP_CONCAT(DISTINCT cp.party_role) as roles')
            ->join('case_parties cp', 'cp.person_id = p.id', 'inner')
            ->join('case_assignments ca', 'ca.case_id = cp.case_id', 'inner')
            ->join('custody_records cr', 'cr.person_id = p.id AND cr.custody_status IN ("in_custody", "bailed")', 'left')
            ->where('ca.investigator_id', $investigatorId)
            ->where('ca.status', 'active')
            ->groupBy('p.id')
            ->orderBy('investigator_cases', 'DESC')
            ->get()
            ->getResultArray();
        
        // Get detailed case information for each person
        foreach ($persons as &$person) {
            $person['cases'] = $db->table('cases c')
                ->select('c.id, c.case_number, c.crime_type, c.status, c.priority, c.created_at, cp.party_role')
                ->join('case_parties cp', 'cp.case_id = c.id')
                ->join('case_assignments ca', 'ca.case_id = c.id')
                ->where('cp.person_id', $person['id'])
                ->where('ca.investigator_id', $investigatorId)
                ->where('ca.status', 'active')
                ->get()
                ->getResultArray();
            
            // Get criminal history count (based on past cases where person was accused)
            $person['criminal_history_count'] = $db->table('cases c')
                ->join('case_parties cp', 'cp.case_id = c.id')
                ->where('cp.person_id', $person['id'])
                ->where('cp.party_role', 'accused')
                ->where('c.status', 'closed')
                ->countAllResults();
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $persons
        ]);
    }
    
    /**
     * Get detailed information about a specific person
     * GET /investigation/persons/:id
     */
    public function show($id = null)
    {
        $investigatorId = $this->request->userId;
        $db = \Config\Database::connect();
        
        // Get person details
        $person = $db->table('persons')
            ->where('id', $id)
            ->get()
            ->getRowArray();
        
        if (!$person) {
            return $this->failNotFound('Person not found');
        }
        
        // Get all cases involving this person
        $person['cases'] = $db->table('cases c')
            ->select('c.*, cp.party_role, ca.investigator_id')
            ->join('case_parties cp', 'cp.case_id = c.id')
            ->join('case_assignments ca', 'ca.case_id = c.id', 'left')
            ->where('cp.person_id', $id)
            ->get()
            ->getResultArray();
        
        // Get custody records
        $person['custody_records'] = $db->table('custody_records')
            ->where('person_id', $id)
            ->orderBy('created_at', 'DESC')
            ->get()
            ->getResultArray();
        
        // Get criminal history (past cases where person was accused and closed)
        $person['criminal_history'] = $db->table('cases c')
            ->select('c.id, c.case_number, c.crime_type, c.incident_date, c.incident_location, c.status, c.closed_at')
            ->join('case_parties cp', 'cp.case_id = c.id')
            ->where('cp.person_id', $id)
            ->where('cp.party_role', 'accused')
            ->where('c.status', 'closed')
            ->orderBy('c.incident_date', 'DESC')
            ->get()
            ->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => $person
        ]);
    }
}
