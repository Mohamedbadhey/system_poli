<?php

namespace App\Models;

class UserModel extends BaseModel
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'center_id', 'username', 'email', 'password', 'password_hash', 'full_name',
        'phone', 'role', 'badge_number', 'language', 'is_active', 'last_login',
        'failed_login_attempts', 'locked_until', 'created_by'
    ];
    
    protected $validationRules = [
        'center_id' => 'required|integer',
        'username' => 'required|min_length[3]|max_length[50]|is_unique[users.username,id,{id}]',
        'email' => 'required|valid_email|is_unique[users.email,id,{id}]',
        'password_hash' => 'permit_empty',
        'full_name' => 'required|min_length[3]|max_length[200]',
        'phone' => 'permit_empty|max_length[20]',
        'role' => 'required|in_list[super_admin,admin,ob_officer,investigator,court_user]',
        'badge_number' => 'permit_empty|max_length[50]',
        'is_active' => 'permit_empty|in_list[0,1]'
    ];
    
    protected $validationMessages = [
        'username' => [
            'is_unique' => 'This username is already taken.'
        ],
        'email' => [
            'is_unique' => 'This email is already registered.'
        ]
    ];
    
    protected $beforeInsert = ['hashPassword'];
    protected $beforeUpdate = ['hashPassword'];
    
    /**
     * Hash password before insert/update
     */
    protected function hashPassword(array $data)
    {
        if (isset($data['data']['password']) && !empty($data['data']['password'])) {
            $data['data']['password_hash'] = password_hash($data['data']['password'], PASSWORD_BCRYPT, ['cost' => 12]);
            unset($data['data']['password']);
        }
        
        return $data;
    }
    
    /**
     * Verify password
     */
    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
    
    /**
     * Get user with center details
     */
    public function getUserWithCenter(int $userId)
    {
        $this->select('users.*, police_centers.center_name, police_centers.center_code');
        $this->join('police_centers', 'police_centers.id = users.center_id');
        $this->where('users.id', $userId);
        return $this->first();
    }
    
    /**
     * Get users by center
     */
    public function getUsersByCenter(int $centerId, ?string $role = null)
    {
        $this->where('center_id', $centerId);
        $this->where('is_active', 1);
        
        if ($role) {
            $this->where('role', $role);
        }
        
        return $this->findAll();
    }
    
    /**
     * Get investigators for assignment
     */
    public function getInvestigators(int $centerId)
    {
        $this->where('center_id', $centerId);
        $this->where('role', 'investigator');
        $this->where('is_active', 1);
        return $this->findAll();
    }
    
    /**
     * Update last login
     */
    public function updateLastLogin(int $userId)
    {
        try {
            $this->skipValidation(true);
            return $this->update($userId, [
                'last_login' => date('Y-m-d H:i:s'),
                'failed_login_attempts' => 0,
                'locked_until' => null
            ]);
        } catch (\Exception $e) {
            log_message('error', 'updateLastLogin error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Increment failed login attempts
     */
    public function incrementFailedAttempts(int $userId)
    {
        try {
            $user = $this->find($userId);
            if (!$user) {
                return false;
            }
            
            $attempts = ($user['failed_login_attempts'] ?? 0) + 1;
            $updateData = ['failed_login_attempts' => $attempts];
            
            // Lock account after 5 failed attempts
            if ($attempts >= 5) {
                $updateData['locked_until'] = date('Y-m-d H:i:s', strtotime('+30 minutes'));
            }
            
            $this->skipValidation(true);
            return $this->update($userId, $updateData);
        } catch (\Exception $e) {
            log_message('error', 'incrementFailedAttempts error: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if account is locked
     */
    public function isLocked(int $userId): bool
    {
        $user = $this->find($userId);
        if (!$user) {
            return false;
        }
        
        // Check if locked_until is set and is a valid date
        if (empty($user['locked_until']) || $user['locked_until'] === null) {
            return false;
        }
        
        try {
            $lockedUntil = strtotime($user['locked_until']);
            if ($lockedUntil === false) {
                return false;
            }
            
            if ($lockedUntil > time()) {
                return true;
            }
            
            // Unlock if time has passed
            $this->skipValidation(true);
            $this->update($userId, [
                'locked_until' => null,
                'failed_login_attempts' => 0
            ]);
            
            return false;
        } catch (\Exception $e) {
            log_message('error', 'isLocked error: ' . $e->getMessage());
            return false;
        }
    }
}
