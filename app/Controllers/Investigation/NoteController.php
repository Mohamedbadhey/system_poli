<?php

namespace App\Controllers\Investigation;

use CodeIgniter\RESTful\ResourceController;

class NoteController extends ResourceController
{
    protected $format = 'json';
    
    /**
     * Get notes for a specific person in a case
     * GET /investigation/cases/{caseId}/persons/{personId}/notes
     */
    public function getPersonNotes($caseId = null, $personId = null)
    {
        if (!$caseId || !$personId) {
            return $this->fail('Case ID and Person ID are required', 400);
        }
        
        // Verify investigator has access to this case
        $this->verifyAccess($caseId);
        
        $noteModel = model('App\Models\InvestigationNoteModel');
        $notes = $noteModel->getPersonNotes($caseId, $personId);
        
        return $this->respond([
            'status' => 'success',
            'data' => $notes
        ]);
    }
    
    /**
     * Add a note for a person
     * POST /investigation/cases/{caseId}/persons/{personId}/notes
     */
    public function addNote($caseId = null, $personId = null)
    {
        if (!$caseId || !$personId) {
            return $this->fail('Case ID and Person ID are required', 400);
        }
        
        // Verify investigator has access to this case
        $this->verifyAccess($caseId);
        
        $rules = [
            'note_text' => 'required|min_length[5]',
            'note_type' => 'permit_empty|in_list[investigation,statement,observation,interview]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $noteText = $this->request->getPost('note_text') ?? $this->request->getJSON()->note_text ?? null;
        $noteType = $this->request->getPost('note_type') ?? $this->request->getJSON()->note_type ?? 'investigation';
        $investigatorId = $this->request->userId;
        
        if (!$noteText) {
            return $this->fail('Note text is required', 400);
        }
        
        $noteModel = model('App\Models\InvestigationNoteModel');
        $noteId = $noteModel->addNote($caseId, $personId, $investigatorId, $noteText, $noteType);
        
        if ($noteId) {
            // Get the created note with investigator name
            $note = $noteModel->select('investigation_notes.*, users.full_name as investigator_name')
                ->join('users', 'users.id = investigation_notes.investigator_id')
                ->find($noteId);
            
            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Note added successfully',
                'data' => $note
            ]);
        }
        
        return $this->fail('Failed to add note', 500);
    }
    
    /**
     * Edit a note
     * PUT /investigation/notes/{noteId}
     */
    public function editNote($noteId = null)
    {
        if (!$noteId) {
            return $this->fail('Note ID is required', 400);
        }
        
        $noteModel = model('App\Models\InvestigationNoteModel');
        $note = $noteModel->find($noteId);
        
        if (!$note) {
            return $this->failNotFound('Note not found');
        }
        
        // Verify investigator has access to this case
        $this->verifyAccess($note['case_id']);
        
        $rules = [
            'note_text' => 'required|min_length[5]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $json = $this->request->getJSON(true);
        $noteText = $json['note_text'] ?? null;
        
        if (!$noteText) {
            return $this->fail('Note text is required', 400);
        }
        
        $editorId = $this->request->userId;
        
        // Edit the note and save history
        $success = $noteModel->editNote($noteId, $editorId, $noteText);
        
        if ($success) {
            // Get updated note
            $updatedNote = $noteModel->select('investigation_notes.*, users.full_name as investigator_name, 
                                              editors.full_name as last_editor_name')
                ->join('users', 'users.id = investigation_notes.investigator_id')
                ->join('users as editors', 'editors.id = investigation_notes.last_edited_by', 'left')
                ->find($noteId);
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Note edited successfully',
                'data' => $updatedNote
            ]);
        }
        
        return $this->fail('Failed to edit note', 500);
    }
    
    /**
     * Get edit history for a note
     * GET /investigation/notes/{noteId}/history
     */
    public function getNoteHistory($noteId = null)
    {
        if (!$noteId) {
            return $this->fail('Note ID is required', 400);
        }
        
        $noteModel = model('App\Models\InvestigationNoteModel');
        $note = $noteModel->find($noteId);
        
        if (!$note) {
            return $this->failNotFound('Note not found');
        }
        
        // Verify investigator has access to this case
        $this->verifyAccess($note['case_id']);
        
        $history = $noteModel->getNoteEditHistory($noteId);
        
        return $this->respond([
            'status' => 'success',
            'data' => $history
        ]);
    }
    
    /**
     * Get all notes for a case (for timeline)
     * GET /investigation/cases/{caseId}/notes
     */
    public function getCaseNotes($caseId = null)
    {
        if (!$caseId) {
            return $this->fail('Case ID is required', 400);
        }
        
        // Verify investigator has access to this case
        $this->verifyAccess($caseId);
        
        $noteModel = model('App\Models\InvestigationNoteModel');
        $notes = $noteModel->getCaseNotes($caseId);
        
        return $this->respond([
            'status' => 'success',
            'data' => $notes
        ]);
    }
    
    /**
     * Verify investigator has access to the case
     */
    private function verifyAccess($caseId)
    {
        $investigatorId = $this->request->userId;
        $role = $this->request->userRole;
        
        // Admin and super_admin have access to all cases
        if (in_array($role, ['admin', 'super_admin'])) {
            return true;
        }
        
        // Check if investigator is assigned to this case
        $db = \Config\Database::connect();
        $assignment = $db->table('case_assignments')
            ->where('case_id', $caseId)
            ->where('investigator_id', $investigatorId)
            // Allow both active and completed assignments (for closed cases)
            ->whereIn('status', ['active', 'completed'])
            ->get()
            ->getRowArray();
        
        if (!$assignment) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException('You are not assigned to this case');
        }
        
        return true;
    }
}
