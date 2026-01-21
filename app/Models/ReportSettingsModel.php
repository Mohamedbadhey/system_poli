<?php

namespace App\Models;

use CodeIgniter\Model;

class ReportSettingsModel extends Model
{
    protected $table = 'report_settings';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $allowedFields = [
        'center_id', 'setting_key', 'setting_value', 'setting_type', 
        'description', 'is_active', 'created_by', 'updated_by'
    ];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    /**
     * Get a setting by key for a specific center or system-wide
     */
    public function getSetting($key, $centerId = null)
    {
        $builder = $this->where('setting_key', $key)
                       ->where('is_active', 1);

        if ($centerId) {
            // Try to get center-specific setting first
            $centerSetting = $builder->where('center_id', $centerId)->first();
            if ($centerSetting) {
                return $this->parseSettingValue($centerSetting);
            }
        }

        // Fall back to system-wide setting
        $systemSetting = $this->where('setting_key', $key)
                             ->where('center_id', null)
                             ->where('is_active', 1)
                             ->first();

        return $systemSetting ? $this->parseSettingValue($systemSetting) : null;
    }

    /**
     * Parse setting value based on type
     */
    private function parseSettingValue($setting)
    {
        if ($setting['setting_type'] === 'json' && !empty($setting['setting_value'])) {
            $setting['setting_value'] = json_decode($setting['setting_value'], true);
        }
        return $setting;
    }

    /**
     * Update or create a setting
     */
    public function setSetting($key, $value, $centerId = null, $type = 'text', $userId = null)
    {
        $existing = $this->where('setting_key', $key)
                        ->where('center_id', $centerId)
                        ->first();

        $data = [
            'setting_key' => $key,
            'setting_value' => is_array($value) ? json_encode($value) : $value,
            'setting_type' => $type,
            'center_id' => $centerId,
            'updated_by' => $userId,
        ];

        if ($existing) {
            return $this->update($existing['id'], $data);
        } else {
            $data['created_by'] = $userId;
            return $this->insert($data);
        }
    }

    /**
     * Get report header image path
     */
    public function getHeaderImage($centerId = null)
    {
        $setting = $this->getSetting('header_image', $centerId);
        return $setting ? $setting['setting_value'] : null;
    }

    /**
     * Get report sections for full report
     */
    public function getFullReportSections($centerId = null)
    {
        $setting = $this->getSetting('full_report_sections', $centerId);
        return $setting ? $setting['setting_value'] : [];
    }

    /**
     * Get report sections for basic report
     */
    public function getBasicReportSections($centerId = null)
    {
        $setting = $this->getSetting('basic_report_sections', $centerId);
        return $setting ? $setting['setting_value'] : [];
    }

    /**
     * Update header image
     */
    public function updateHeaderImage($imagePath, $centerId = null, $userId = null)
    {
        return $this->setSetting('header_image', $imagePath, $centerId, 'image', $userId);
    }

    /**
     * Update full report sections
     */
    public function updateFullReportSections($sections, $centerId = null, $userId = null)
    {
        return $this->setSetting('full_report_sections', $sections, $centerId, 'json', $userId);
    }

    /**
     * Update basic report sections
     */
    public function updateBasicReportSections($sections, $centerId = null, $userId = null)
    {
        return $this->setSetting('basic_report_sections', $sections, $centerId, 'json', $userId);
    }

    /**
     * Get all settings for a center
     */
    public function getCenterSettings($centerId = null)
    {
        $builder = $this->where('is_active', 1);
        
        if ($centerId) {
            $builder->groupStart()
                    ->where('center_id', $centerId)
                    ->orWhere('center_id', null)
                    ->groupEnd();
        } else {
            $builder->where('center_id', null);
        }

        $settings = $builder->findAll();
        $parsed = [];

        foreach ($settings as $setting) {
            $parsed[$setting['setting_key']] = $this->parseSettingValue($setting);
        }

        return $parsed;
    }

    /**
     * Get all report settings (header and sections)
     */
    public function getReportSettings($centerId = null)
    {
        return [
            'header_image' => $this->getHeaderImage($centerId),
            'full_report_sections' => $this->getFullReportSections($centerId),
            'basic_report_sections' => $this->getBasicReportSections($centerId),
            'full_statement1' => $this->getSetting('full_statement1', $centerId)['setting_value'] ?? '',
            'full_statement2' => $this->getSetting('full_statement2', $centerId)['setting_value'] ?? '',
            'full_statement3' => $this->getSetting('full_statement3', $centerId)['setting_value'] ?? '',
            'full_footer_text' => $this->getSetting('full_footer_text', $centerId)['setting_value'] ?? '',
            'basic_statement1' => $this->getSetting('basic_statement1', $centerId)['setting_value'] ?? '',
            'basic_statement2' => $this->getSetting('basic_statement2', $centerId)['setting_value'] ?? '',
            'basic_statement3' => $this->getSetting('basic_statement3', $centerId)['setting_value'] ?? '',
            'basic_footer_text' => $this->getSetting('basic_footer_text', $centerId)['setting_value'] ?? '',
            'custom_statement1' => $this->getSetting('custom_statement1', $centerId)['setting_value'] ?? '',
            'custom_statement2' => $this->getSetting('custom_statement2', $centerId)['setting_value'] ?? '',
            'custom_statement3' => $this->getSetting('custom_statement3', $centerId)['setting_value'] ?? '',
            'custom_footer_text' => $this->getSetting('custom_footer_text', $centerId)['setting_value'] ?? '',
        ];
    }

    /**
     * Get statement 1
     */
    public function getStatement1($centerId = null)
    {
        $setting = $this->getSetting('statement1', $centerId);
        return $setting ? $setting['setting_value'] : '';
    }

    /**
     * Get statement 2
     */
    public function getStatement2($centerId = null)
    {
        $setting = $this->getSetting('statement2', $centerId);
        return $setting ? $setting['setting_value'] : '';
    }

    /**
     * Get statement 3
     */
    public function getStatement3($centerId = null)
    {
        $setting = $this->getSetting('statement3', $centerId);
        return $setting ? $setting['setting_value'] : '';
    }

    /**
     * Get footer text
     */
    public function getFooterText($centerId = null)
    {
        $setting = $this->getSetting('footer_text', $centerId);
        return $setting ? $setting['setting_value'] : '';
    }

    /**
     * Update statement 1
     */
    public function updateStatement1($text, $centerId = null, $userId = null)
    {
        return $this->setSetting('statement1', $text, $centerId, 'text', $userId);
    }

    /**
     * Update statement 2
     */
    public function updateStatement2($text, $centerId = null, $userId = null)
    {
        return $this->setSetting('statement2', $text, $centerId, 'text', $userId);
    }

    /**
     * Update statement 3
     */
    public function updateStatement3($text, $centerId = null, $userId = null)
    {
        return $this->setSetting('statement3', $text, $centerId, 'text', $userId);
    }

    /**
     * Update footer text
     */
    public function updateFooterText($text, $centerId = null, $userId = null)
    {
        return $this->setSetting('footer_text', $text, $centerId, 'text', $userId);
    }
}
