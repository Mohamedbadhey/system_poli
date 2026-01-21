<?php

namespace App\Models;

use CodeIgniter\Model;

class MedicalExaminationFormModel extends Model
{
    protected $table = 'medical_examination_forms';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    
    protected $allowedFields = [
        'case_id',
        'person_id',
        'case_number',
        'patient_name',
        'party_type',
        'form_data',
        'qr_code',
        'verification_code',
        'report_date',
        'hospital_name',
        'examination_date',
        'created_by'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    // Validation
    protected $validationRules = [
        'case_id' => 'required|integer',
        'patient_name' => 'required|max_length[255]',
        'form_data' => 'required'
    ];

    protected $validationMessages = [
        'case_id' => [
            'required' => 'Case ID is required',
            'integer' => 'Case ID must be a valid number'
        ],
        'patient_name' => [
            'required' => 'Patient name is required',
            'max_length' => 'Patient name cannot exceed 255 characters'
        ],
        'form_data' => [
            'required' => 'Form data is required'
        ]
    ];

    // Callbacks
    protected $beforeInsert = [];
    protected $afterInsert = [];
    protected $beforeUpdate = [];
    protected $afterUpdate = [];
    protected $beforeFind = [];
    protected $afterFind = [];
    protected $beforeDelete = [];
    protected $afterDelete = [];

    /**
     * Get forms with case and person details
     */
    public function getFormWithDetails($formId)
    {
        return $this->select('medical_examination_forms.*, cases.case_number, cases.incident_description as case_description')
            ->join('cases', 'cases.id = medical_examination_forms.case_id', 'left')
            ->where('medical_examination_forms.id', $formId)
            ->first();
    }

    /**
     * Get all forms for a case with person details
     */
    public function getFormsByCase($caseId)
    {
        return $this->select('medical_examination_forms.*, persons.full_name as person_name, persons.person_type')
            ->join('persons', 'persons.id = medical_examination_forms.person_id', 'left')
            ->where('medical_examination_forms.case_id', $caseId)
            ->orderBy('medical_examination_forms.created_at', 'DESC')
            ->findAll();
    }
}
