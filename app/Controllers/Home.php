<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index()
    {
        // Redirect to static login page
        $loginPage = FCPATH . 'index.html';
        
        if (file_exists($loginPage)) {
            return redirect()->to(base_url('index.html'));
        }
        
        return view('welcome_message');
    }
}
