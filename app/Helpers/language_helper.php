<?php

/**
 * Language Helper Functions
 */

if (!function_exists('get_user_language')) {
    /**
     * Get current user's language preference
     * 
     * @return string Language code (en, so)
     */
    function get_user_language(): string
    {
        $session = \Config\Services::session();
        $language = $session->get('user_language');
        
        if (!$language) {
            // Try to get from user data
            $userData = $session->get('user_data');
            if ($userData && isset($userData['language'])) {
                $language = $userData['language'];
            } else {
                // Default to English
                $language = 'en';
            }
        }
        
        return $language;
    }
}

if (!function_exists('set_user_language')) {
    /**
     * Set user's language preference in session
     * 
     * @param string $language Language code
     * @return void
     */
    function set_user_language(string $language): void
    {
        $session = \Config\Services::session();
        $session->set('user_language', $language);
        
        // Also set CodeIgniter's locale
        service('request')->setLocale($language);
    }
}

if (!function_exists('translate')) {
    /**
     * Get translated text
     * 
     * @param string $key Translation key
     * @param array $params Parameters to replace in translation
     * @param string|null $language Force specific language
     * @return string Translated text
     */
    function translate(string $key, array $params = [], ?string $language = null): string
    {
        if (!$language) {
            $language = get_user_language();
        }
        
        $languageFile = APPPATH . "Language/{$language}/App.php";
        
        if (!file_exists($languageFile)) {
            $language = 'en'; // Fallback to English
            $languageFile = APPPATH . "Language/{$language}/App.php";
        }
        
        $translations = require $languageFile;
        
        $text = $translations[$key] ?? $key;
        
        // Replace parameters
        if (!empty($params)) {
            foreach ($params as $paramKey => $paramValue) {
                $text = str_replace("{{$paramKey}}", $paramValue, $text);
            }
        }
        
        return $text;
    }
}

if (!function_exists('lang_text')) {
    /**
     * Alias for translate function
     * 
     * @param string $key Translation key
     * @param array $params Parameters to replace
     * @return string Translated text
     */
    function lang_text(string $key, array $params = []): string
    {
        return translate($key, $params);
    }
}
