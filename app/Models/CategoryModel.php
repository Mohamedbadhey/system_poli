<?php

namespace App\Models;

class CategoryModel extends BaseModel
{
    protected $table = 'categories';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'name', 'description', 'color', 'icon', 
        'is_active', 'display_order', 'created_by'
    ];
    
    protected $validationRules = [
        'name' => 'required|max_length[100]|is_unique[categories.name,id,{id}]',
        'color' => 'permit_empty|max_length[7]',
        'icon' => 'permit_empty|max_length[50]',
        'is_active' => 'permit_empty|in_list[0,1]',
        'display_order' => 'permit_empty|integer'
    ];
    
    protected $validationMessages = [
        'name' => [
            'required' => 'Category name is required',
            'is_unique' => 'This category name already exists'
        ]
    ];
    
    /**
     * Get all active categories ordered by display_order
     */
    public function getActiveCategories()
    {
        return $this->where('is_active', 1)
                    ->orderBy('display_order', 'ASC')
                    ->orderBy('name', 'ASC')
                    ->findAll();
    }
    
    /**
     * Get category with case count
     */
    public function getCategoryWithCaseCount(int $categoryId, ?int $centerId = null)
    {
        $category = $this->find($categoryId);
        if (!$category) {
            return null;
        }
        
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
        
        $crimeCategory = $categoryMapping[$category['name']] ?? strtolower($category['name']);
        
        $db = \Config\Database::connect();
        $builder = $db->table('cases')
            ->where('crime_category', $crimeCategory);
        
        if ($centerId) {
            $builder->where('center_id', $centerId);
        }
        
        $category['case_count'] = $builder->countAllResults();
        
        return $category;
    }
    
    /**
     * Get all categories with case counts
     */
    public function getAllCategoriesWithCounts(?int $centerId = null)
    {
        $categories = $this->orderBy('display_order', 'ASC')
                          ->orderBy('name', 'ASC')
                          ->findAll();
        
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
        
        $db = \Config\Database::connect();
        
        foreach ($categories as &$category) {
            $crimeCategory = $categoryMapping[$category['name']] ?? strtolower($category['name']);
            
            $builder = $db->table('cases')
                ->where('crime_category', $crimeCategory);
            
            if ($centerId) {
                $builder->where('center_id', $centerId);
            }
            
            $category['case_count'] = $builder->countAllResults();
        }
        
        return $categories;
    }
    
    /**
     * Update display order
     */
    public function updateDisplayOrder(array $orderData): bool
    {
        $db = \Config\Database::connect();
        $db->transStart();
        
        foreach ($orderData as $item) {
            $this->update($item['id'], ['display_order' => $item['order']]);
        }
        
        $db->transComplete();
        
        return $db->transStatus();
    }
}
