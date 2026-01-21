    /**
     * Update custody documentation
     */
    public function updateCustodyDocumentation($caseId, $custodyId)
    {
        $input = $this->request->getPost();
        $accusedPhoto = null;
        $courtOrderImage = null;
        
        $db = \Config\Database::connect();
        
        // Get existing record
        $existing = $db->table('custody_documentation')->where('id', $custodyId)->get()->getRowArray();
        if (!$existing) {
            return $this->fail('Custody record not found', 404);
        }
        
        // Handle photo uploads
        if ($file = $this->request->getFile('accused_photo')) {
            if ($file->isValid() && !$file->hasMoved()) {
                $newName = $file->getRandomName();
                $uploadPath = WRITEPATH . 'uploads/custody-photos/';
                if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
                
                if ($file->move($uploadPath, $newName)) {
                    $publicPath = FCPATH . 'uploads/custody-photos/';
                    if (!is_dir($publicPath)) mkdir($publicPath, 0755, true);
                    copy($uploadPath . $newName, $publicPath . $newName);
                    $accusedPhoto = 'uploads/custody-photos/' . $newName;
                    
                    if ($existing['accused_photo']) {
                        $oldPath = FCPATH . $existing['accused_photo'];
                        if (file_exists($oldPath)) @unlink($oldPath);
                    }
                }
            }
        }
        
        if ($file = $this->request->getFile('court_order_image')) {
            if ($file->isValid() && !$file->hasMoved()) {
                $newName = $file->getRandomName();
                $uploadPath = WRITEPATH . 'uploads/court-orders/';
                if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
                
                if ($file->move($uploadPath, $newName)) {
                    $publicPath = FCPATH . 'uploads/court-orders/';
                    if (!is_dir($publicPath)) mkdir($publicPath, 0755, true);
                    copy($uploadPath . $newName, $publicPath . $newName);
                    $courtOrderImage = 'uploads/court-orders/' . $newName;
                    
                    if ($existing['court_order_image']) {
                        $oldPath = FCPATH . $existing['court_order_image'];
                        if (file_exists($oldPath)) @unlink($oldPath);
                    }
                }
            }
        }
        
        // Calculate custody end date
        $custodyEnd = null;
        $custodyDuration = null;
        if (isset($input['custody_duration_value']) && isset($input['custody_duration_unit'])) {
            $durationValue = (int)$input['custody_duration_value'];
            $durationUnit = $input['custody_duration_unit'];
            $custodyDuration = $durationValue . ' ' . $durationUnit;
            
            $startDate = new \DateTime($input['custody_start']);
            
            if ($durationUnit === 'days') {
                $startDate->add(new \DateInterval('P' . $durationValue . 'D'));
            } elseif ($durationUnit === 'months') {
                $startDate->add(new \DateInterval('P' . $durationValue . 'M'));
            } elseif ($durationUnit === 'years') {
                $startDate->add(new \DateInterval('P' . $durationValue . 'Y'));
            }
            
            $custodyEnd = $startDate->format('Y-m-d H:i:s');
        }
        
        // Prepare update data
        $updateData = [
            'custody_start' => $input['custody_start'],
            'custody_end' => $custodyEnd,
            'custody_duration' => $custodyDuration,
            'custody_location' => $input['custody_location'],
            'notes' => $input['notes'] ?? null,
            'updated_at' => date('Y-m-d H:i:s'),
            'updated_by' => $this->request->userId
        ];
        
        if ($accusedPhoto) $updateData['accused_photo'] = $accusedPhoto;
        if ($courtOrderImage) $updateData['court_order_image'] = $courtOrderImage;
        
        $db->table('custody_documentation')->where('id', $custodyId)->update($updateData);
        
        return $this->respond(['status' => 'success', 'message' => 'Updated successfully']);
    }
