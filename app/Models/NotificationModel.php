<?php

namespace App\Models;

use CodeIgniter\Model;

class NotificationModel extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'user_id', 'case_id', 'type', 'title', 'message', 
        'link', 'is_read', 'read_at'
    ];
    
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = false;
    
    /**
     * Create a notification
     */
    public function createNotification(array $data)
    {
        $notification = [
            'user_id' => (int)$data['user_id'],
            'case_id' => isset($data['case_id']) ? (int)$data['case_id'] : null,
            'type' => (string)$data['type'],
            'title' => (string)$data['title'],
            'message' => (string)$data['message'],
            'link' => isset($data['link']) ? (string)$data['link'] : null,
            'is_read' => 0
        ];
        
        try {
            $result = $this->insert($notification);
            return $result ? $this->getInsertID() : false;
        } catch (\Exception $e) {
            log_message('error', 'Notification creation failed: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get unread notifications for a user
     */
    public function getUnreadNotifications(int $userId)
    {
        $this->where('user_id', $userId);
        $this->where('is_read', 0);
        $this->orderBy('created_at', 'DESC');
        return $this->findAll();
    }
    
    /**
     * Get all notifications for a user
     */
    public function getUserNotifications(int $userId, int $limit = 50)
    {
        $this->where('user_id', $userId);
        $this->orderBy('created_at', 'DESC');
        $this->limit($limit);
        return $this->findAll();
    }
    
    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId): bool
    {
        return $this->update($notificationId, [
            'is_read' => 1,
            'read_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(int $userId): bool
    {
        $this->where('user_id', $userId);
        $this->where('is_read', 0);
        $this->set([
            'is_read' => 1,
            'read_at' => date('Y-m-d H:i:s')
        ]);
        return $this->update();
    }
    
    /**
     * Get unread count for a user
     */
    public function getUnreadCount(int $userId): int
    {
        $this->where('user_id', $userId);
        $this->where('is_read', 0);
        return $this->countAllResults();
    }
}
