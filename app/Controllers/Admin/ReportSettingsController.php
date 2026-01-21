<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ReportSettingsModel;

class ReportSettingsController extends ResourceController
{
    protected $format = 'json';
    protected $settingsModel;

    public function __construct()
    {
        $this->settingsModel = new ReportSettingsModel();
    }

    /**
     * Get all report settings
     */
    public function index()
    {
        try {
            $centerId = $this->request->getGet('center_id');
            $settings = $this->settingsModel->getReportSettings($centerId);

            return $this->respond([
                'status' => 'success',
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to retrieve settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get specific setting by key
     */
    public function show($key = null)
    {
        if (!$key) {
            return $this->failNotFound('Setting key is required');
        }

        try {
            $centerId = $this->request->getGet('center_id');
            $setting = $this->settingsModel->getSetting($key, $centerId);

            if (!$setting) {
                return $this->failNotFound('Setting not found');
            }

            return $this->respond([
                'status' => 'success',
                'data' => $setting
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to retrieve setting: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update header image
     */
    public function updateHeaderImage()
    {
        try {
            $file = $this->request->getFile('header_image');
            $centerId = $this->request->getPost('center_id');
            $userId = $GLOBALS['current_user']['userId'] ?? null;

            if (!$file || !$file->isValid()) {
                return $this->fail('Invalid file upload', 400);
            }

            // Validate image
            if (!in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/gif'])) {
                return $this->fail('Only JPG, PNG, and GIF images are allowed', 400);
            }

            // Create directory if it doesn't exist
            $uploadPath = FCPATH . 'uploads/reports/headers/';
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }
            
            // Move file to public uploads directory
            $newName = 'report_header_' . time() . '.' . $file->getExtension();
            $file->move($uploadPath, $newName);

            $imagePath = 'reports/headers/' . $newName;

            // Update setting
            $this->settingsModel->updateHeaderImage($imagePath, $centerId, $userId);

            return $this->respond([
                'status' => 'success',
                'message' => 'Header image updated successfully',
                'data' => [
                    'image_path' => $imagePath,
                    'image_url' => base_url('uploads/' . $imagePath)
                ]
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to update header image: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update full report sections
     */
    public function updateFullReportSections()
    {
        try {
            $data = $this->request->getJSON(true);
            $centerId = $data['center_id'] ?? null;
            $sections = $data['sections'] ?? [];
            $userId = $GLOBALS['current_user']['userId'] ?? null;

            if (empty($sections)) {
                return $this->fail('Sections data is required', 400);
            }

            // Validate sections structure
            if (!$this->validateSections($sections)) {
                return $this->fail('Invalid sections structure', 400);
            }

            $this->settingsModel->updateFullReportSections($sections, $centerId, $userId);

            return $this->respond([
                'status' => 'success',
                'message' => 'Full report sections updated successfully'
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to update sections: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update basic report sections
     */
    public function updateBasicReportSections()
    {
        try {
            $data = $this->request->getJSON(true);
            $centerId = $data['center_id'] ?? null;
            $sections = $data['sections'] ?? [];
            $userId = $GLOBALS['current_user']['userId'] ?? null;

            if (empty($sections)) {
                return $this->fail('Sections data is required', 400);
            }

            // Validate sections structure
            if (!$this->validateSections($sections)) {
                return $this->fail('Invalid sections structure', 400);
            }

            $this->settingsModel->updateBasicReportSections($sections, $centerId, $userId);

            return $this->respond([
                'status' => 'success',
                'message' => 'Basic report sections updated successfully'
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to update sections: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update any setting by key
     */
    public function update($key = null)
    {
        if (!$key) {
            return $this->failNotFound('Setting key is required');
        }

        try {
            $data = $this->request->getJSON(true);
            $value = $data['value'] ?? null;
            $centerId = $data['center_id'] ?? null;
            $type = $data['type'] ?? 'text';
            $userId = $GLOBALS['current_user']['userId'] ?? null;

            if ($value === null) {
                return $this->fail('Setting value is required', 400);
            }

            $this->settingsModel->setSetting($key, $value, $centerId, $type, $userId);

            return $this->respond([
                'status' => 'success',
                'message' => 'Setting updated successfully'
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to update setting: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update report statements (all at once)
     */
    public function updateStatements()
    {
        try {
            $data = $this->request->getJSON(true);
            $centerId = $data['center_id'] ?? null;
            $userId = $GLOBALS['current_user']['userId'] ?? null;

            // Full Report Statements
            if (isset($data['full_statement1'])) {
                $this->settingsModel->setSetting('full_statement1', $data['full_statement1'], $centerId, 'text', $userId);
            }
            if (isset($data['full_statement2'])) {
                $this->settingsModel->setSetting('full_statement2', $data['full_statement2'], $centerId, 'text', $userId);
            }
            if (isset($data['full_statement3'])) {
                $this->settingsModel->setSetting('full_statement3', $data['full_statement3'], $centerId, 'text', $userId);
            }
            if (isset($data['full_footer_text'])) {
                $this->settingsModel->setSetting('full_footer_text', $data['full_footer_text'], $centerId, 'text', $userId);
            }

            // Basic Report Statements
            if (isset($data['basic_statement1'])) {
                $this->settingsModel->setSetting('basic_statement1', $data['basic_statement1'], $centerId, 'text', $userId);
            }
            if (isset($data['basic_statement2'])) {
                $this->settingsModel->setSetting('basic_statement2', $data['basic_statement2'], $centerId, 'text', $userId);
            }
            if (isset($data['basic_statement3'])) {
                $this->settingsModel->setSetting('basic_statement3', $data['basic_statement3'], $centerId, 'text', $userId);
            }
            if (isset($data['basic_footer_text'])) {
                $this->settingsModel->setSetting('basic_footer_text', $data['basic_footer_text'], $centerId, 'text', $userId);
            }

            // Customized Report Statements
            if (isset($data['custom_statement1'])) {
                $this->settingsModel->setSetting('custom_statement1', $data['custom_statement1'], $centerId, 'text', $userId);
            }
            if (isset($data['custom_statement2'])) {
                $this->settingsModel->setSetting('custom_statement2', $data['custom_statement2'], $centerId, 'text', $userId);
            }
            if (isset($data['custom_statement3'])) {
                $this->settingsModel->setSetting('custom_statement3', $data['custom_statement3'], $centerId, 'text', $userId);
            }
            if (isset($data['custom_footer_text'])) {
                $this->settingsModel->setSetting('custom_footer_text', $data['custom_footer_text'], $centerId, 'text', $userId);
            }

            return $this->respond([
                'status' => 'success',
                'message' => 'Report statements updated successfully'
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to update statements: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Validate sections structure
     */
    private function validateSections($sections)
    {
        if (!is_array($sections)) {
            return false;
        }

        foreach ($sections as $key => $section) {
            if (!is_array($section)) {
                return false;
            }

            if (!isset($section['title']) || !isset($section['enabled']) || !isset($section['order'])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get header image URL
     */
    public function getHeaderImage()
    {
        try {
            $centerId = $this->request->getGet('center_id');
            $imagePath = $this->settingsModel->getHeaderImage($centerId);

            if (!$imagePath) {
                return $this->respond([
                    'status' => 'success',
                    'data' => null
                ]);
            }

            return $this->respond([
                'status' => 'success',
                'data' => [
                    'image_path' => $imagePath,
                    'image_url' => base_url('uploads/' . $imagePath)
                ]
            ]);
        } catch (\Exception $e) {
            return $this->fail('Failed to get header image: ' . $e->getMessage(), 500);
        }
    }
}
