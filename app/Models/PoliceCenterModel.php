<?php

namespace App\Models;

class PoliceCenterModel extends BaseModel
{
    protected $table = 'police_centers';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'center_code', 'center_name', 'location', 
        'gps_latitude', 'gps_longitude', 'phone', 
        'email', 'is_active'
    ];
    
    protected $validationRules = [
        'center_code' => 'required|max_length[20]|is_unique[police_centers.center_code,id,{id}]',
        'center_name' => 'required|max_length[200]',
        'location' => 'required|max_length[255]',
        'gps_latitude' => 'permit_empty|decimal',
        'gps_longitude' => 'permit_empty|decimal',
        'phone' => 'permit_empty|max_length[20]',
        'email' => 'permit_empty|valid_email|max_length[100]',
        'is_active' => 'permit_empty|in_list[0,1]'
    ];
    
    /**
     * Get active centers
     */
    public function getActiveCenters()
    {
        return $this->where('is_active', 1)->findAll();
    }
    
    /**
     * Get center statistics
     */
    public function getCenterStats(int $centerId)
    {
        $db = \Config\Database::connect();
        
        $stats = [
            'total_users' => $db->table('users')
                ->where('center_id', $centerId)
                ->where('is_active', 1)
                ->countAllResults(),
            
            'total_cases' => $db->table('cases')
                ->where('center_id', $centerId)
                ->countAllResults(),
            
            'active_cases' => $db->table('cases')
                ->where('center_id', $centerId)
                ->whereIn('status', ['investigating', 'assigned', 'approved'])
                ->countAllResults(),
            
            'in_custody' => $db->table('custody_records')
                ->where('center_id', $centerId)
                ->where('custody_status', 'in_custody')
                ->countAllResults()
        ];
        
        return $stats;
    }
}
