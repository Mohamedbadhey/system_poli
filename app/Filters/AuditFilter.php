<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuditFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Do nothing before request
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // TEMPORARILY DISABLED - Fix audit log SQL issue
        return;
        
        // Log all state-changing operations
        $method = $request->getMethod();
        
        // Only log POST, PUT, DELETE operations
        if (!in_array(strtoupper($method), ['POST', 'PUT', 'DELETE'])) {
            return;
        }
        
        // Get user info if authenticated
        $userId = $request->userId ?? null;
        $username = $request->user['username'] ?? 'anonymous';
        
        // Prepare audit log data
        $auditData = [
            'user_id' => $userId,
            'username' => $username,
            'action' => strtoupper($method) . ' ' . $request->getUri()->getPath(),
            'entity_type' => $this->extractEntityType($request->getUri()->getPath()),
            'entity_id' => $this->extractEntityId($request->getUri()->getPath()),
            'description' => $this->generateDescription($request),
            'old_values' => null,
            'new_values' => json_encode($request->getJSON() ?? $request->getPost()),
            'ip_address' => $request->getIPAddress(),
            'user_agent' => $request->getUserAgent()->getAgentString(),
            'request_method' => $method,
            'request_url' => (string)$request->getUri(),
        ];
        
        // Save to audit log asynchronously (don't block response)
        try {
            $auditModel = model('App\Models\AuditLogModel');
            $auditModel->insert($auditData);
        } catch (\Exception $e) {
            // Log error but don't fail the request
            log_message('error', 'Audit log failed: ' . $e->getMessage());
        }
    }
    
    private function extractEntityType(string $path): string
    {
        // Extract entity type from URL path
        $parts = explode('/', trim($path, '/'));
        
        // Try to get meaningful entity type from path
        // e.g., /ob/cases -> 'cases', /admin/users -> 'users'
        if (count($parts) >= 2) {
            return $parts[count($parts) - 1] === '' ? $parts[count($parts) - 2] : $parts[count($parts) - 1];
        }
        
        // Fallback to first non-empty part or 'unknown'
        foreach ($parts as $part) {
            if (!empty($part) && !is_numeric($part)) {
                return $part;
            }
        }
        
        return 'unknown';
    }
    
    private function extractEntityId(string $path): ?int
    {
        // Extract ID from URL if present
        $parts = explode('/', trim($path, '/'));
        $lastPart = end($parts);
        return is_numeric($lastPart) ? (int)$lastPart : null;
    }
    
    private function generateDescription(RequestInterface $request): string
    {
        $method = strtoupper($request->getMethod());
        $path = $request->getUri()->getPath();
        
        return "{$method} request to {$path}";
    }
}
