<?php

namespace App\Models;

use CodeIgniter\Model;

class BaseModel extends Model
{
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $useSoftDeletes = false;
    
    /**
     * Validation rules
     */
    protected $validationRules = [];
    protected $validationMessages = [];
    protected $skipValidation = false;
    
    /**
     * Get records with pagination
     */
    public function getPaginated(int $perPage = 20, array $filters = [])
    {
        $builder = $this->builder();
        
        // Apply filters
        foreach ($filters as $field => $value) {
            if (!empty($value)) {
                if (is_array($value)) {
                    $builder->whereIn($field, $value);
                } else {
                    $builder->where($field, $value);
                }
            }
        }
        
        return [
            'data' => $builder->paginate($perPage),
            'pager' => $this->pager
        ];
    }
    
    /**
     * Search records
     */
    public function search(string $keyword, array $fields = [], int $limit = 50)
    {
        $builder = $this->builder();
        
        if (!empty($keyword) && !empty($fields)) {
            $builder->groupStart();
            foreach ($fields as $field) {
                $builder->orLike($field, $keyword);
            }
            $builder->groupEnd();
        }
        
        return $builder->limit($limit)->get()->getResultArray();
    }
    
    /**
     * Bulk insert with validation - Overridden to match parent signature
     */
    public function insertBatch(?array $set = null, ?bool $escape = null, int $batchSize = 100, bool $testing = false)
    {
        return parent::insertBatch($set, $escape, $batchSize, $testing);
    }
    
    /**
     * Safe delete (prevents accidental deletion)
     */
    public function safeDelete($id, bool $purge = false)
    {
        if (!$id) {
            return false;
        }
        
        // Check if record exists
        $record = $this->find($id);
        if (!$record) {
            return false;
        }
        
        return $this->delete($id, $purge);
    }
}
