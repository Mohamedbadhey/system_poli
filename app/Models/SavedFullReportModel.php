<?php

namespace App\Models;

use CodeIgniter\Model;

class SavedFullReportModel extends Model
{
    protected $table = 'saved_full_reports';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    protected $allowedFields = [
        'case_id',
        'case_number',
        'report_title',
        'report_language',
        'report_html',
        'pdf_filename',
        'pdf_url',
        'verification_code',
        'qr_code',
        'generated_by',
        'last_accessed',
        'access_count'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = null;

    // Validation
    protected $validationRules = [
        'case_id' => 'required|integer',
        'report_title' => 'required',
        'report_language' => 'in_list[en,so]'
    ];

    protected $validationMessages = [
        'case_id' => [
            'required' => 'Case ID is required',
            'integer' => 'Case ID must be a valid integer'
        ],
        'report_title' => [
            'required' => 'Report title is required'
        ]
    ];

    protected $skipValidation = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert = ['generateVerificationCode'];
    protected $beforeUpdate = [];
    protected $afterInsert = [];
    protected $afterUpdate = [];

    /**
     * Generate unique verification code before insert
     */
    protected function generateVerificationCode(array $data)
    {
        if (!isset($data['data']['verification_code']) || empty($data['data']['verification_code'])) {
            // Generate unique code: REPORT-XXXXXXXX-XXXXXX
            $caseNumber = $data['data']['case_number'] ?? 'UNKNOWN';
            $timestamp = time();
            $random = strtoupper(substr(md5($timestamp . $caseNumber . uniqid()), 0, 6));
            
            $data['data']['verification_code'] = 'REPORT-' . str_pad($timestamp, 10, '0', STR_PAD_LEFT) . '-' . $random;
        }

        return $data;
    }

    /**
     * Get report by verification code
     */
    public function getByVerificationCode($code)
    {
        $report = $this->where('verification_code', $code)->first();
        
        if ($report) {
            // Increment access count
            $this->update($report['id'], [
                'last_accessed' => date('Y-m-d H:i:s'),
                'access_count' => $report['access_count'] + 1
            ]);
        }
        
        return $report;
    }

    /**
     * Get reports by case ID
     */
    public function getByCaseId($caseId)
    {
        return $this->where('case_id', $caseId)
                    ->orderBy('created_at', 'DESC')
                    ->findAll();
    }

    /**
     * Get report by ID
     */
    public function getById($id)
    {
        $report = $this->find($id);
        
        if ($report) {
            // Increment access count
            $this->update($id, [
                'last_accessed' => date('Y-m-d H:i:s'),
                'access_count' => $report['access_count'] + 1
            ]);
        }
        
        return $report;
    }

    /**
     * Delete old reports (older than X days)
     */
    public function deleteOldReports($days = 90)
    {
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        return $this->where('created_at <', $cutoffDate)->delete();
    }
}
