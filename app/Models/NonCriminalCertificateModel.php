<?php

namespace App\Models;

use CodeIgniter\Model;

class NonCriminalCertificateModel extends Model
{
    protected $table = 'non_criminal_certificates';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    protected $allowedFields = [
        'certificate_number',
        'person_id',
        'person_name',
        'mother_name',
        'gender',
        'birth_date',
        'birth_place',
        'photo_path',
        'purpose',
        'validity_period',
        'issue_date',
        'director_name',
        'director_signature',
        'issued_by',
        'verification_token',
        'is_active',
        'verification_count',
        'last_verified_at',
        'notes'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';

    // Validation
    protected $validationRules = [
        'certificate_number' => 'required|max_length[100]|is_unique[non_criminal_certificates.certificate_number,id,{id}]',
        'person_name' => 'required|max_length[255]',
        'gender' => 'required|in_list[MALE,FEMALE,male,female]',
        'issue_date' => 'required|valid_date',
        'issued_by' => 'required|integer',
        'verification_token' => 'required|is_unique[non_criminal_certificates.verification_token,id,{id}]'
    ];

    protected $validationMessages = [
        'certificate_number' => [
            'required' => 'Certificate number is required',
            'is_unique' => 'This certificate number already exists'
        ],
        'person_name' => [
            'required' => 'Person name is required'
        ],
        'verification_token' => [
            'is_unique' => 'Verification token must be unique'
        ]
    ];

    protected $skipValidation = false;
    protected $cleanValidationRules = true;

    // Callbacks
    protected $allowCallbacks = true;
    protected $beforeInsert = [];
    protected $afterInsert = [];
    protected $beforeUpdate = [];
    protected $afterUpdate = [];
    protected $beforeFind = [];
    protected $afterFind = [];
    protected $beforeDelete = [];
    protected $afterDelete = [];

    /**
     * Get certificate with issuer information
     */
    public function getCertificateWithIssuer($id)
    {
        return $this->select('non_criminal_certificates.*, users.full_name as issuer_name, users.badge_number as issuer_badge')
                    ->join('users', 'users.id = non_criminal_certificates.issued_by', 'left')
                    ->where('non_criminal_certificates.id', $id)
                    ->first();
    }

    /**
     * Get all certificates with issuer information
     */
    public function getAllWithIssuers()
    {
        return $this->select('non_criminal_certificates.*, users.full_name as issuer_name, users.badge_number as issuer_badge')
                    ->join('users', 'users.id = non_criminal_certificates.issued_by', 'left')
                    ->orderBy('non_criminal_certificates.created_at', 'DESC')
                    ->findAll();
    }

    /**
     * Search certificates
     */
    public function searchCertificates($searchTerm)
    {
        return $this->like('person_name', $searchTerm)
                    ->orLike('certificate_number', $searchTerm)
                    ->orLike('mother_name', $searchTerm)
                    ->orderBy('created_at', 'DESC')
                    ->findAll();
    }

    /**
     * Get certificates by date range
     */
    public function getCertificatesByDateRange($startDate, $endDate)
    {
        return $this->where('issue_date >=', $startDate)
                    ->where('issue_date <=', $endDate)
                    ->orderBy('issue_date', 'DESC')
                    ->findAll();
    }

    /**
     * Get active certificates count
     */
    public function getActiveCertificatesCount()
    {
        return $this->where('is_active', 1)->countAllResults();
    }

    /**
     * Get certificates issued by specific user
     */
    public function getCertificatesByIssuer($userId)
    {
        return $this->where('issued_by', $userId)
                    ->orderBy('created_at', 'DESC')
                    ->findAll();
    }

    /**
     * Revoke certificate
     */
    public function revokeCertificate($id, $notes = null)
    {
        $updateData = ['is_active' => 0];
        if ($notes) {
            $updateData['notes'] = $notes;
        }
        return $this->update($id, $updateData);
    }

    /**
     * Reactivate certificate
     */
    public function reactivateCertificate($id)
    {
        return $this->update($id, ['is_active' => 1]);
    }

    /**
     * Get verification statistics
     */
    public function getVerificationStats($certificateId)
    {
        $cert = $this->find($certificateId);
        if (!$cert) {
            return null;
        }
        
        return [
            'verification_count' => $cert['verification_count'],
            'last_verified_at' => $cert['last_verified_at'],
            'is_active' => $cert['is_active']
        ];
    }
}
