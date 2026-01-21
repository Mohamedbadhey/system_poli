<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;

class AuthController extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format = 'json';
    
    /**
     * User login
     * POST /auth/login
     */
    public function login()
    {
        try {
            $rules = [
                'username' => 'required',
                'password' => 'required'
            ];
            
            if (!$this->validate($rules)) {
                return $this->fail($this->validator->getErrors(), 400);
            }
            
            $username = $this->request->getPost('username');
            $password = $this->request->getPost('password');
            
            log_message('info', "Login attempt for username: {$username}");
            
            $userModel = model('App\Models\UserModel');
            $userModel->skipValidation(true); // Skip validation for login lookup
            $user = $userModel->where('username', $username)->first();
        
        if (!$user) {
            log_message('warning', "Login failed: User not found - {$username}");
            return $this->fail('Invalid credentials', 401);
        }
        
        log_message('info', "User found: {$user['username']}, active: {$user['is_active']}");
        
        // Check if account is locked
        if ($userModel->isLocked($user['id'])) {
            log_message('warning', "Login failed: Account locked - {$username}");
            return $this->fail('Account is locked due to multiple failed login attempts. Please try again later.', 403);
        }
        
        // Verify password
        $passwordVerified = $userModel->verifyPassword($password, $user['password_hash']);
        log_message('info', "Password verification result: " . ($passwordVerified ? 'success' : 'failed'));
        
        if (!$passwordVerified) {
            $userModel->incrementFailedAttempts($user['id']);
            log_message('warning', "Login failed: Invalid password - {$username}");
            return $this->fail('Invalid credentials', 401);
        }
        
        // Check if user is active
        if (!$user['is_active']) {
            return $this->fail('Account is inactive', 403);
        }
        
        // Generate JWT tokens
        $tokenData = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'center_id' => $user['center_id'],
            'iat' => time(),
            'exp' => time() + (8 * 60 * 60) // 8 hours (was 30 minutes)
        ];
        
        $refreshTokenData = [
            'user_id' => $user['id'],
            'iat' => time(),
            'exp' => time() + (30 * 24 * 60 * 60) // 30 days (was 7 days)
        ];
        
        $key = getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production';
        $token = JWT::encode($tokenData, $key, 'HS256');
        $refreshToken = JWT::encode($refreshTokenData, $key, 'HS256');
        
        // Create session
        try {
            $sessionModel = model('App\Models\UserSessionModel');
            $sessionId = $sessionModel->createSession($user['id'], $token, $refreshToken, [
                'ip_address' => $this->request->getIPAddress(),
                'user_agent' => $this->request->getUserAgent()->getAgentString()
            ]);
            log_message('info', "Session created: {$sessionId}");
        } catch (\Exception $e) {
            log_message('error', 'Session creation failed: ' . $e->getMessage());
            // Continue even if session creation fails
        }
        
        // Update last login
        try {
            $userModel->updateLastLogin($user['id']);
            log_message('info', "Last login updated");
        } catch (\Exception $e) {
            log_message('error', 'Update last login failed: ' . $e->getMessage());
            // Continue even if update fails
        }
        
        // Remove sensitive data
        unset($user['password_hash']);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'user' => $user,
                'token' => $token,
                'refresh_token' => $refreshToken,
                'expires_in' => 1800 // 30 minutes in seconds
            ]
        ]);
        } catch (\Exception $e) {
            log_message('error', 'Login error: ' . $e->getMessage() . ' | Trace: ' . $e->getTraceAsString());
            return $this->fail('Login error: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * User logout
     * POST /auth/logout
     */
    public function logout()
    {
        $userId = $this->request->userId;
        
        // Revoke all user sessions
        $sessionModel = model('App\Models\UserSessionModel');
        $sessionModel->revokeUserSessions($userId);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Logout successful'
        ]);
    }
    
    /**
     * Refresh access token
     * POST /auth/refresh-token
     */
    public function refreshToken()
    {
        $refreshToken = $this->request->getPost('refresh_token');
        
        if (!$refreshToken) {
            return $this->fail('Refresh token is required', 400);
        }
        
        try {
            $key = getenv('JWT_SECRET') ?: 'your-secret-key-change-in-production';
            $decoded = JWT::decode($refreshToken, new \Firebase\JWT\Key($key, 'HS256'));
            
            // Generate new access token
            $tokenData = [
                'user_id' => $decoded->user_id,
                'iat' => time(),
                'exp' => time() + (8 * 60 * 60) // 8 hours
            ];
            
            $newToken = JWT::encode($tokenData, $key, 'HS256');
            
            // Update session
            $sessionModel = model('App\Models\UserSessionModel');
            $tokenHash = hash('sha256', $newToken);
            $refreshTokenHash = hash('sha256', $refreshToken);
            
            $session = $sessionModel->where('refresh_token_hash', $refreshTokenHash)
                ->where('user_id', $decoded->user_id)
                ->first();
            
            if ($session) {
                $sessionModel->update($session['id'], [
                    'token_hash' => $tokenHash,
                    'expires_at' => date('Y-m-d H:i:s', strtotime('+8 hours'))
                ]);
            }
            
            return $this->respond([
                'status' => 'success',
                'data' => [
                    'token' => $newToken,
                    'expires_in' => 1800
                ]
            ]);
            
        } catch (\Exception $e) {
            return $this->fail('Invalid refresh token', 401);
        }
    }
    
    /**
     * Get current user info
     * GET /auth/me
     */
    public function me()
    {
        // Get user from request (set by AuthFilter)
        $user = $this->request->user ?? $GLOBALS['current_user']['user'] ?? null;
        
        if (!$user) {
            return $this->fail('User not found', 401);
        }
        
        unset($user['password_hash']);
        
        return $this->respond([
            'status' => 'success',
            'data' => $user
        ]);
    }
    
    /**
     * Change password
     * POST /auth/change-password
     */
    public function changePassword()
    {
        $rules = [
            'current_password' => 'required',
            'new_password' => 'required|min_length[8]',
            'confirm_password' => 'required|matches[new_password]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $userId = $this->request->userId;
        $currentPassword = $this->request->getPost('current_password');
        $newPassword = $this->request->getPost('new_password');
        
        $userModel = model('App\Models\UserModel');
        $user = $userModel->find($userId);
        
        // Verify current password
        if (!$userModel->verifyPassword($currentPassword, $user['password_hash'])) {
            return $this->fail('Current password is incorrect', 400);
        }
        
        // Update password
        $userModel->update($userId, ['password' => $newPassword]);
        
        return $this->respond([
            'status' => 'success',
            'message' => 'Password changed successfully'
        ]);
    }
}
