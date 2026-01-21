<?php

namespace App\Models;

use CodeIgniter\Model;

class InvestigatorConclusionModel extends Model
{
    protected $table = 'investigator_conclusions';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    protected $allowedFields = [
        'case_id',
        'investigator_id',
        'conclusion_title',
        'findings',
        'recommendations',
        'conclusion_summary',
        'status',
        'submitted_at',
        'reviewed_by',
        'reviewed_at',
        'review_notes'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    // Validation
    protected $validationRules = [
        'case_id' => 'required|integer',
        'investigator_id' => 'required|integer',
        'conclusion_title' => 'required|string|max_length[255]',
        'findings' => 'required|string',
        'conclusion_summary' => 'required|string',
        'status' => 'in_list[draft,submitted,reviewed]'
    ];

    protected $validationMessages = [
        'case_id' => [
            'required' => 'Case ID is required',
            'integer' => 'Case ID must be a valid number'
        ],
        'conclusion_title' => [
            'required' => 'Conclusion title is required',
            'max_length' => 'Title cannot exceed 255 characters'
        ],
        'findings' => [
            'required' => 'Findings are required'
        ],
        'conclusion_summary' => [
            'required' => 'Conclusion summary is required'
        ]
    ];

    /**
     * Get conclusion for a case by a specific investigator
     */
    public function getConclusionByCase($caseId, $investigatorId = null)
    {
        $builder = $this->builder();
        $builder->where('case_id', $caseId);
        
        if ($investigatorId) {
            $builder->where('investigator_id', $investigatorId);
        }
        
        $builder->orderBy('updated_at', 'DESC');
        return $builder->get()->getRowArray();
    }

    /**
     * Get all conclusions for a case with investigator details
     */
    public function getConclusionsWithInvestigator($caseId)
    {
        return $this->select('investigator_conclusions.*, users.full_name as investigator_name, users.badge_number')
            ->join('users', 'users.id = investigator_conclusions.investigator_id')
            ->where('investigator_conclusions.case_id', $caseId)
            ->orderBy('investigator_conclusions.updated_at', 'DESC')
            ->findAll();
    }

    /**
     * Submit conclusion for review
     */
    public function submitConclusion($conclusionId)
    {
        return $this->update($conclusionId, [
            'status' => 'submitted',
            'submitted_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Mark conclusion as reviewed
     */
    public function reviewConclusion($conclusionId, $reviewerId, $notes = null)
    {
        return $this->update($conclusionId, [
            'status' => 'reviewed',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => date('Y-m-d H:i:s'),
            'review_notes' => $notes
        ]);
    }
}
