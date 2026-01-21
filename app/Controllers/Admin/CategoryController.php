<?php

namespace App\Controllers\Admin;

use CodeIgniter\RESTful\ResourceController;

class CategoryController extends ResourceController
{
    protected $modelName = 'App\Models\CategoryModel';
    protected $format = 'json';
    
    /**
     * Get all categories
     */
    public function index()
    {
        $categoryModel = model('App\Models\CategoryModel');
        $centerId = $GLOBALS['current_user']['centerId'] ?? null;
        
        // Get categories with case counts
        $categories = $categoryModel->getAllCategoriesWithCounts($centerId);
        
        return $this->respond([
            'status' => 'success',
            'data' => $categories
        ]);
    }
    
    /**
     * Get single category
     */
    public function show($id = null)
    {
        $categoryModel = model('App\Models\CategoryModel');
        $centerId = $GLOBALS['current_user']['centerId'] ?? null;
        
        $category = $categoryModel->getCategoryWithCaseCount($id, $centerId);
        
        if (!$category) {
            return $this->failNotFound('Category not found');
        }
        
        return $this->respond([
            'status' => 'success',
            'data' => $category
        ]);
    }
    
    /**
     * Create new category
     */
    public function create()
    {
        $rules = [
            'name' => 'required|max_length[100]|is_unique[categories.name]',
            'description' => 'permit_empty',
            'color' => 'permit_empty|max_length[7]',
            'icon' => 'permit_empty|max_length[50]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        
        $data = [
            'name' => $input['name'] ?? null,
            'description' => $input['description'] ?? null,
            'color' => $input['color'] ?? '#3498db',
            'icon' => $input['icon'] ?? 'fa-folder',
            'is_active' => $input['is_active'] ?? 1,
            'display_order' => $input['display_order'] ?? 0,
            'created_by' => $userId
        ];
        
        $categoryModel = model('App\Models\CategoryModel');
        
        try {
            $categoryId = $categoryModel->insert($data);
            
            if (!$categoryId) {
                return $this->fail($categoryModel->errors(), 400);
            }
            
            $category = $categoryModel->find($categoryId);
            
            // Log the action (optional)
            // TODO: Implement audit logging if needed
            
            return $this->respondCreated([
                'status' => 'success',
                'message' => 'Category created successfully',
                'data' => $category
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Category creation failed: ' . $e->getMessage());
            return $this->fail('Failed to create category', 500);
        }
    }
    
    /**
     * Update category
     */
    public function update($id = null)
    {
        $categoryModel = model('App\Models\CategoryModel');
        $category = $categoryModel->find($id);
        
        if (!$category) {
            return $this->failNotFound('Category not found');
        }
        
        $rules = [
            'name' => "permit_empty|max_length[100]|is_unique[categories.name,id,{$id}]",
            'color' => 'permit_empty|max_length[7]',
            'icon' => 'permit_empty|max_length[50]'
        ];
        
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors(), 400);
        }
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $input = $this->request->getJSON(true) ?? $this->request->getRawInput();
        
        $data = array_filter([
            'name' => $input['name'] ?? null,
            'description' => $input['description'] ?? null,
            'color' => $input['color'] ?? null,
            'icon' => $input['icon'] ?? null,
            'is_active' => isset($input['is_active']) ? $input['is_active'] : null,
            'display_order' => isset($input['display_order']) ? $input['display_order'] : null
        ], function($value) {
            return $value !== null;
        });
        
        try {
            $categoryModel->update($id, $data);
            
            $updatedCategory = $categoryModel->find($id);
            
            // Log the action (optional)
            // TODO: Implement audit logging if needed
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Category updated successfully',
                'data' => $updatedCategory
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Category update failed: ' . $e->getMessage());
            return $this->fail('Failed to update category', 500);
        }
    }
    
    /**
     * Delete category
     */
    public function delete($id = null)
    {
        $categoryModel = model('App\Models\CategoryModel');
        $category = $categoryModel->find($id);
        
        if (!$category) {
            return $this->failNotFound('Category not found');
        }
        
        // Check if category is used in any cases
        $db = \Config\Database::connect();
        $caseCount = $db->table('cases')
            ->where('crime_category', $category['name'])
            ->countAllResults();
        
        if ($caseCount > 0) {
            return $this->fail("Cannot delete category. It is used in {$caseCount} case(s)", 400);
        }
        
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        try {
            $categoryModel->delete($id);
            
            // Log the action (optional)
            // TODO: Implement audit logging if needed
            
            return $this->respondDeleted([
                'status' => 'success',
                'message' => 'Category deleted successfully'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Category deletion failed: ' . $e->getMessage());
            return $this->fail('Failed to delete category', 500);
        }
    }
    
    /**
     * Toggle category active status
     */
    public function toggleStatus($id = null)
    {
        $categoryModel = model('App\Models\CategoryModel');
        $category = $categoryModel->find($id);
        
        if (!$category) {
            return $this->failNotFound('Category not found');
        }
        
        $newStatus = $category['is_active'] ? 0 : 1;
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        
        try {
            $categoryModel->update($id, ['is_active' => $newStatus]);
            
            $updatedCategory = $categoryModel->find($id);
            
            // Log the action (optional)
            // TODO: Implement audit logging if needed
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Category status updated successfully',
                'data' => $updatedCategory
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Category status toggle failed: ' . $e->getMessage());
            return $this->fail('Failed to update category status', 500);
        }
    }
    
    /**
     * Update display order of categories
     */
    public function updateOrder()
    {
        $input = $this->request->getJSON(true) ?? $this->request->getPost();
        $orderData = $input['order'] ?? [];
        
        if (empty($orderData)) {
            return $this->fail('Order data is required', 400);
        }
        
        $categoryModel = model('App\Models\CategoryModel');
        
        try {
            $categoryModel->updateDisplayOrder($orderData);
            
            return $this->respond([
                'status' => 'success',
                'message' => 'Category order updated successfully'
            ]);
        } catch (\Exception $e) {
            log_message('error', 'Category order update failed: ' . $e->getMessage());
            return $this->fail('Failed to update category order', 500);
        }
    }
    
    /**
     * Get cases by category
     */
    public function getCasesByCategory($categoryId = null)
    {
        $categoryModel = model('App\Models\CategoryModel');
        $category = $categoryModel->find($categoryId);
        
        if (!$category) {
            return $this->failNotFound('Category not found');
        }
        
        $centerId = $GLOBALS['current_user']['centerId'] ?? null;
        $userId = $GLOBALS['current_user']['userId'] ?? null;
        $role = $GLOBALS['current_user']['userRole'] ?? null;
        
        // Map category names to crime_category ENUM values
        $categoryMapping = [
            'Violent Crimes' => 'violent',
            'Property Crimes' => 'property',
            'Drug Related' => 'drug',
            'Cybercrime' => 'cybercrime',
            'Sexual Offenses' => 'sexual',
            'Juvenile Cases' => 'juvenile',
            'Other' => 'other'
        ];
        
        // Get the ENUM value for this category
        $crimeCategory = $categoryMapping[$category['name']] ?? strtolower($category['name']);
        
        $db = \Config\Database::connect();
        $builder = $db->table('cases')
            ->select('cases.*, users.full_name as created_by_name')
            ->join('users', 'users.id = cases.created_by', 'left')
            ->where('cases.crime_category', $crimeCategory);
        
        // Apply role-based filtering
        if ($role === 'ob_officer') {
            $builder->where('cases.created_by', $userId);
        } elseif ($role === 'admin') {
            $builder->where('cases.center_id', $centerId);
        } elseif ($role === 'investigator') {
            $builder->join('case_assignments', 'case_assignments.case_id = cases.id')
                    ->where('case_assignments.investigator_id', $userId)
                    ->where('case_assignments.status', 'active');
        } else {
            // Super admin can see all
            if ($centerId) {
                $builder->where('cases.center_id', $centerId);
            }
        }
        
        $builder->orderBy('cases.created_at', 'DESC');
        
        $cases = $builder->get()->getResultArray();
        
        return $this->respond([
            'status' => 'success',
            'data' => [
                'category' => $category,
                'cases' => $cases
            ]
        ]);
    }
}
