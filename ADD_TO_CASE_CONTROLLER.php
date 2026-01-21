<?php
// ============================================
// ADD THESE METHODS TO: app/Controllers/Investigation/CaseController.php
// Add them before the closing } of the class
// ============================================

    /**
     * Get court acknowledgment for case
     */
    public function getCourtAcknowledgment($caseId)
    {
        $db = \Config\Database::connect();
        $acknowledgment = $db->table('court_acknowledgments')
            ->where('case_id', $caseId)
            ->orderBy('uploaded_at', 'DESC')
            ->get()
            ->getRowArray();
        
        return $this->respond(['status' => 'success', 'data' => $acknowledgment]);
    }
    
    /**
     * Upload court acknowledgment
     */
    public function uploadCourtAcknowledgment($caseId)
    {
        $file = $this->request->getFile('court_acknowledgment');
        
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!in_array($file->getMimeType(), $allowedTypes)) {
                return $this->fail('Invalid file type', 400);
            }
            
            if ($file->getSize() > 10 * 1024 * 1024) {
                return $this->fail('File exceeds 10MB', 400);
            }
            
            $newName = $file->getRandomName();
            $uploadPath = WRITEPATH . 'uploads/court-acknowledgments';
            if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
            $file->move($uploadPath, $newName);
            
            $db = \Config\Database::connect();
            $oldAck = $db->table('court_acknowledgments')->where('case_id', $caseId)->get()->getRowArray();
            if ($oldAck && file_exists($oldAck['file_path'])) @unlink($oldAck['file_path']);
            $db->table('court_acknowledgments')->delete(['case_id' => $caseId]);
            $db->table('court_acknowledgments')->insert([
                'case_id' => $caseId,
                'file_path' => 'writable/uploads/court-acknowledgments/' . $newName,
                'file_name' => $file->getName(),
                'file_type' => $file->getMimeType(),
                'uploaded_at' => date('Y-m-d H:i:s'),
                'uploaded_by' => $this->request->userId
            ]);
            
            return $this->respond(['status' => 'success', 'message' => 'Uploaded']);
        }
        
        return $this->fail('Invalid file', 400);
    }
    
    /**
     * Delete court acknowledgment
     */
    public function deleteCourtAcknowledgment($caseId)
    {
        $db = \Config\Database::connect();
        $ack = $db->table('court_acknowledgments')->where('case_id', $caseId)->get()->getRowArray();
        if ($ack) {
            if (file_exists($ack['file_path'])) @unlink($ack['file_path']);
            $db->table('court_acknowledgments')->delete(['case_id' => $caseId]);
            return $this->respond(['status' => 'success', 'message' => 'Deleted']);
        }
        return $this->fail('Not found', 404);
    }
    
    /**
     * Get custody documentation
     */
    public function getCustodyDocumentation($caseId)
    {
        $db = \Config\Database::connect();
        $docs = $db->table('custody_documentation cd')
            ->select('cd.*, p.first_name, p.last_name')
            ->join('persons p', 'p.id = cd.accused_person_id')
            ->where('cd.case_id', $caseId)
            ->orderBy('cd.custody_start', 'DESC')
            ->get()
            ->getResultArray();
        return $this->respond(['status' => 'success', 'data' => $docs]);
    }
    
    /**
     * Save custody documentation
     */
    public function saveCustodyDocumentation($caseId)
    {
        $input = $this->request->getPost();
        $accusedPhoto = null;
        $courtOrderImage = null;
        
        if ($file = $this->request->getFile('accused_photo')) {
            if ($file->isValid() && !$file->hasMoved()) {
                $newName = $file->getRandomName();
                $uploadPath = WRITEPATH . 'uploads/custody-photos';
                if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
                $file->move($uploadPath, $newName);
                $accusedPhoto = 'writable/uploads/custody-photos/' . $newName;
            }
        }
        
        if ($file = $this->request->getFile('court_order_image')) {
            if ($file->isValid() && !$file->hasMoved()) {
                $newName = $file->getRandomName();
                $uploadPath = WRITEPATH . 'uploads/court-orders';
                if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
                $file->move($uploadPath, $newName);
                $courtOrderImage = 'writable/uploads/court-orders/' . $newName;
            }
        }
        
        $db = \Config\Database::connect();
        $db->table('custody_documentation')->insert([
            'case_id' => $caseId,
            'accused_person_id' => $input['accused_person_id'],
            'custody_start' => $input['custody_start'],
            'custody_location' => $input['custody_location'],
            'accused_photo' => $accusedPhoto,
            'court_order_image' => $courtOrderImage,
            'notes' => $input['notes'] ?? null,
            'custody_status' => 'in_custody',
            'created_at' => date('Y-m-d H:i:s'),
            'created_by' => $this->request->userId
        ]);
        
        return $this->respond(['status' => 'success', 'message' => 'Saved']);
    }
