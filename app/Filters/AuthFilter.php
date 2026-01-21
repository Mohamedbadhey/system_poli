<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthFilter implements FilterInterface
{
    /**
     * Authenticate requests using JWT tokens
     * 
     * @param RequestInterface $request
     * @param array|null $arguments - Optional role requirements
     * @return RequestInterface|ResponseInterface
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        $response = Services::response();
        
        // Get authorization header
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader)) {
            return $response->setJSON([
                'status' => 'error',
                'message' => 'No authorization token provided'
            ])->setStatusCode(401);
        }
        
        // Extract token
        $token = null;
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        }
        
        if (empty($token)) {
            return $response->setJSON([
                'status' => 'error',
                'message' => 'Invalid authorization header format'
            ])->setStatusCode(401);
        }
        
        try {
            // Decode JWT token
            $key = getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production';
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            
            // Check token expiration
            if ($decoded->exp < time()) {
                return $response->setJSON([
                    'status' => 'error',
                    'message' => 'Token has expired'
                ])->setStatusCode(401);
            }
            
            // Verify token in database
            $sessionModel = model('App\Models\UserSessionModel');
            $tokenHash = hash('sha256', $token);
            $session = $sessionModel->where('token_hash', $tokenHash)
                                   ->where('user_id', $decoded->user_id)
                                   ->where('expires_at >', date('Y-m-d H:i:s'))
                                   ->first();
            
            if (!$session) {
                return $response->setJSON([
                    'status' => 'error',
                    'message' => 'Invalid or expired session'
                ])->setStatusCode(401);
            }
            
            // Load user data
            $userModel = model('App\Models\UserModel');
            $user = $userModel->find($decoded->user_id);
            
            if (!$user || !$user['is_active']) {
                return $response->setJSON([
                    'status' => 'error',
                    'message' => 'User account is inactive'
                ])->setStatusCode(401);
            }
            
            // Check role requirements if specified
            if (!empty($arguments)) {
                $allowedRoles = $arguments;
                if (!in_array($user['role'], $allowedRoles)) {
                    return $response->setJSON([
                        'status' => 'error',
                        'message' => 'Insufficient permissions'
                    ])->setStatusCode(403);
                }
            }
            
            // Store user data in a global variable that controllers can access
            // This is a workaround since request properties don't persist
            $GLOBALS['current_user'] = [
                'id' => $user['id'],
                'userId' => $user['id'],
                'userRole' => $user['role'],
                'centerId' => $user['center_id'],
                'username' => $user['username'],
                'user' => $user
            ];
            
            // Also try to set on request (for some controllers that might work)
            $request->userId = $user['id'];
            $request->userRole = $user['role'];
            $request->centerId = $user['center_id'];
            $request->username = $user['username'];
            $request->user = $user; // Add this for controllers that expect it
            
        } catch (\Exception $e) {
            return $response->setJSON([
                'status' => 'error',
                'message' => 'Invalid token: ' . $e->getMessage()
            ])->setStatusCode(401);
        }
        
        return $request;
    }

    /**
     * Allows After filters to inspect and modify the response object as needed.
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Do nothing
    }
}
