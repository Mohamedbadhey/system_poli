<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class LanguageController extends ResourceController
{
    use ResponseTrait;

    protected $userModel;
    protected $supportedLanguages = ['en', 'so'];

    public function __construct()
    {
        $this->userModel = new \App\Models\UserModel();
    }

    /**
     * Get available languages
     */
    public function index()
    {
        try {
            $languages = [
                [
                    'code' => 'en',
                    'name' => 'English',
                    'native_name' => 'English',
                    'flag' => '🇬🇧'
                ],
                [
                    'code' => 'so',
                    'name' => 'Somali',
                    'native_name' => 'Soomaali',
                    'flag' => '🇸🇴'
                ]
            ];

            return $this->respond([
                'status' => 'success',
                'data' => $languages
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Get languages error: ' . $e->getMessage());
            return $this->fail('Failed to get languages', 500);
        }
    }

    /**
     * Get translations for a specific language
     */
    public function getTranslations($langCode = 'en')
    {
        try {
            // Validate language code
            if (!in_array($langCode, $this->supportedLanguages)) {
                return $this->fail('Unsupported language', 400);
            }

            // Load language file
            $languageFile = APPPATH . "Language/{$langCode}/App.php";
            
            if (!file_exists($languageFile)) {
                return $this->fail('Language file not found', 404);
            }

            $translations = require $languageFile;

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'language' => $langCode,
                    'translations' => $translations
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Get translations error: ' . $e->getMessage());
            return $this->fail('Failed to get translations', 500);
        }
    }

    /**
     * Update user's language preference
     */
    public function updateUserLanguage()
    {
        try {
            $userId = $this->request->getVar('user_id');
            $language = $this->request->getVar('language');

            // Validate
            if (!$userId || !$language) {
                return $this->fail('User ID and language are required', 400);
            }

            if (!in_array($language, $this->supportedLanguages)) {
                return $this->fail('Unsupported language', 400);
            }

            // Update user language
            $this->userModel->skipValidation(true);
            $updated = $this->userModel->update($userId, ['language' => $language]);

            if (!$updated) {
                return $this->fail('Failed to update language preference', 500);
            }

            return $this->respond([
                'status' => 'success',
                'message' => 'Language preference updated successfully',
                'data' => [
                    'language' => $language
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Update user language error: ' . $e->getMessage());
            return $this->fail('Failed to update language preference', 500);
        }
    }

    /**
     * Get current user's language preference
     */
    public function getUserLanguage($userId = null)
    {
        try {
            if (!$userId) {
                return $this->fail('User ID is required', 400);
            }

            $user = $this->userModel->find($userId);

            if (!$user) {
                return $this->fail('User not found', 404);
            }

            $language = $user['language'] ?? 'en';

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'language' => $language
                ]
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Get user language error: ' . $e->getMessage());
            return $this->fail('Failed to get user language', 500);
        }
    }
}
