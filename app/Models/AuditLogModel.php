<?php

namespace App\Models;

class AuditLogModel extends BaseModel
{
    protected $table = 'audit_logs';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'user_id', 'username', 'action', 'entity_type', 'entity_id',
        'description', 'old_values', 'new_values', 'ip_address',
        'user_agent', 'request_method', 'request_url'
    ];
    
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = null;
    
    // Audit logs are immutable (prevent updates and deletes)
    
    public function update($id = null, $data = null): bool
    {
        // Audit logs are immutable
        return false;
    }
    
    public function delete($id = null, bool $purge = false)
    {
        // Audit logs cannot be deleted
        return false;
    }
}
