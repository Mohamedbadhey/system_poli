<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class AuditController extends ResourceController
{
    protected $modelName = 'App\Models\AuditLogModel';
    protected $format = 'json';
    
    public function index()
    {
        $auditModel = model('App\Models\AuditLogModel');
        
        $page = $this->request->getGet('page') ?? 1;
        $perPage = $this->request->getGet('per_page') ?? 50;
        $userId = $this->request->getGet('user_id');
        $entityType = $this->request->getGet('entity_type');
        $action = $this->request->getGet('action');
        $dateFrom = $this->request->getGet('date_from');
        $dateTo = $this->request->getGet('date_to');
        
        // Apply filters
        if ($userId) {
            $auditModel->where('user_id', $userId);
        }
        
        if ($entityType) {
            $auditModel->where('entity_type', $entityType);
        }
        
        if ($action) {
            $auditModel->like('action', $action);
        }
        
        if ($dateFrom) {
            $auditModel->where('created_at >=', $dateFrom);
        }
        
        if ($dateTo) {
            $auditModel->where('created_at <=', $dateTo . ' 23:59:59');
        }
        
        // Get logs with pagination
        $logs = $auditModel->orderBy('created_at', 'DESC')
            ->paginate($perPage, 'default', $page);
        
        return $this->respond([
            'status' => 'success',
            'data' => $logs,
            'pagination' => $auditModel->pager->getDetails()
        ]);
    }
    
    public function show($id = null)
    {
        $auditModel = model('App\Models\AuditLogModel');
        $log = $auditModel->find($id);
        
        if (!$log) {
            return $this->failNotFound('Audit log not found');
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $log
        ]);
    }
}
