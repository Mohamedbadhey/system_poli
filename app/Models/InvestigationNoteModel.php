<?php

namespace App\Models;

use CodeIgniter\Model;

class InvestigationNoteModel extends Model
{
    protected $table = 'investigation_notes';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'case_id', 'person_id', 'investigator_id', 'note_type', 'note_text', 
        'is_edited', 'last_edited_at', 'last_edited_by'
    ];
    
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    
    protected $validationRules = [
        'case_id' => 'required|integer',
        'person_id' => 'required|integer',
        'investigator_id' => 'required|integer',
        'note_type' => 'required|in_list[investigation,statement,observation,interview]',
        'note_text' => 'required|min_length[5]'
    ];
    
    /**
     * Get all notes for a case
     */
    public function getCaseNotes(int $caseId)
    {
        return $this->select('investigation_notes.*, users.full_name as investigator_name, persons.first_name, persons.last_name')
            ->join('users', 'users.id = investigation_notes.investigator_id')
            ->join('persons', 'persons.id = investigation_notes.person_id')
            ->where('investigation_notes.case_id', $caseId)
            ->orderBy('investigation_notes.created_at', 'DESC')
            ->findAll();
    }
    
    /**
     * Get notes for a specific person in a case
     */
    public function getPersonNotes(int $caseId, int $personId)
    {
        return $this->select('investigation_notes.*, users.full_name as investigator_name, 
                             editors.full_name as last_editor_name')
            ->join('users', 'users.id = investigation_notes.investigator_id')
            ->join('users as editors', 'editors.id = investigation_notes.last_edited_by', 'left')
            ->where('investigation_notes.case_id', $caseId)
            ->where('investigation_notes.person_id', $personId)
            ->orderBy('investigation_notes.created_at', 'DESC')
            ->findAll();
    }
    
    /**
     * Edit a note and save history
     */
    public function editNote(int $noteId, int $editorId, string $newText)
    {
        // Get current note
        $note = $this->find($noteId);
        if (!$note) {
            return false;
        }
        
        $db = \Config\Database::connect();
        
        // Save edit history
        $db->table('note_edit_history')->insert([
            'note_id' => $noteId,
            'edited_by' => $editorId,
            'old_text' => $note['note_text'],
            'new_text' => $newText,
            'edited_at' => date('Y-m-d H:i:s')
        ]);
        
        // Update the note
        return $this->update($noteId, [
            'note_text' => $newText,
            'is_edited' => 1,
            'last_edited_at' => date('Y-m-d H:i:s'),
            'last_edited_by' => $editorId
        ]);
    }
    
    /**
     * Get edit history for a note
     */
    public function getNoteEditHistory(int $noteId)
    {
        $db = \Config\Database::connect();
        return $db->table('note_edit_history')
            ->select('note_edit_history.*, users.full_name as editor_name')
            ->join('users', 'users.id = note_edit_history.edited_by')
            ->where('note_edit_history.note_id', $noteId)
            ->orderBy('note_edit_history.edited_at', 'DESC')
            ->get()
            ->getResultArray();
    }
    
    /**
     * Add a new note
     */
    public function addNote(int $caseId, int $personId, int $investigatorId, string $noteText, string $noteType = 'investigation')
    {
        return $this->insert([
            'case_id' => $caseId,
            'person_id' => $personId,
            'investigator_id' => $investigatorId,
            'note_type' => $noteType,
            'note_text' => $noteText
        ]);
    }
}
