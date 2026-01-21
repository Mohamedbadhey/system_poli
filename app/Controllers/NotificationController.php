<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class NotificationController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get all notifications for current user
     * GET /api/notifications
     */
    public function index()
    {
        $userId = $this->request->userId;
        $notificationModel = model('App\Models\NotificationModel');
        
        $notifications = $notificationModel->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit(50)
            ->findAll();
        
        return $this->respond([
            'status' => 'success',
            'data' => $notifications
        ]);
    }
    
    /**
     * Get unread notifications
     * GET /api/notifications/unread
     */
    public function unread()
    {
        $userId = $this->request->userId;
        $notificationModel = model('App\Models\NotificationModel');
        
        $notifications = $notificationModel->where('user_id', $userId)
            ->where('is_read', 0)
            ->orderBy('created_at', 'DESC')
            ->findAll();
        
        return $this->respond([
            'status' => 'success',
            'data' => $notifications
        ]);
    }
    
    /**
     * Mark notification as read
     * POST /api/notifications/{id}/read
     */
    public function markAsRead($id = null)
    {
        $userId = $this->request->userId;
        $notificationModel = model('App\Models\NotificationModel');
        
        $notification = $notificationModel->where('id', $id)
            ->where('user_id', $userId)
            ->first();
        
        if (!$notification) {
            return $this->failNotFound('Notification not found');
        }
        
        $notificationModel->update($id, [
            'is_read' => 1,
            'read_at' => date('Y-m-d H:i:s')
        ]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Notification marked as read'
        ]);
    }
    
    /**
     * Mark all notifications as read
     * POST /api/notifications/read-all
     */
    public function markAllAsRead()
    {
        $userId = $this->request->userId;
        $notificationModel = model('App\Models\NotificationModel');
        
        $notificationModel->where('user_id', $userId)
            ->where('is_read', 0)
            ->set([
                'is_read' => 1,
                'read_at' => date('Y-m-d H:i:s')
            ])
            ->update();
        
        return $this->respond([
            'status' => 'success',
            'message' => 'All notifications marked as read'
        ]);
    }
}
