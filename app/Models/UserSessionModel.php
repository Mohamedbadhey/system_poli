<?php

namespace App\Models;

class UserSessionModel extends BaseModel
{
    protected $table = 'user_sessions';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'user_id', 'token_hash', 'refresh_token_hash', 
        'ip_address', 'user_agent', 'expires_at'
    ];
    
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = null;
    protected $dateFormat = 'datetime';
    
    protected $skipValidation = true; // Skip validation for session creation
    protected $returnType = 'array';
    
    /**
     * Create new session
     */
    public function createSession(int $userId, string $token, string $refreshToken, array $metadata = [])
    {
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 minutes'));
        
        $data = [
            'user_id' => $userId,
            'token_hash' => hash('sha256', $token),
            'refresh_token_hash' => hash('sha256', $refreshToken),
            'ip_address' => $metadata['ip_address'] ?? null,
            'user_agent' => $metadata['user_agent'] ?? null,
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s') // Explicitly set created_at
        ];
        
        log_message('info', 'Creating session for user: ' . $userId . ' with data: ' . json_encode($data));
        
        // Use query builder directly to bypass model issues
        $db = \Config\Database::connect();
        try {
            $result = $db->table($this->table)->insert($data);
            if ($result) {
                $insertId = $db->insertID();
                log_message('info', 'Session created successfully with ID: ' . $insertId);
                return $insertId;
            } else {
                log_message('error', 'Session insert failed: ' . $db->error());
                return false;
            }
        } catch (\Exception $e) {
            log_message('error', 'Session insert exception: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Cleanup expired sessions
     */
    public function cleanupExpiredSessions()
    {
        return $this->where('expires_at <', date('Y-m-d H:i:s'))->delete();
    }
    
    /**
     * Revoke all user sessions
     */
    public function revokeUserSessions(int $userId)
    {
        return $this->where('user_id', $userId)->delete();
    }
}
