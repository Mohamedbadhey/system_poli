// ============================================
// Language Translation System
// ============================================

const LanguageManager = {
    currentLanguage: 'en',
    translations: {},
    initialized: false,

    /**
     * Initialize language system
     */
    async init() {
        if (this.initialized) return;

        // Get user's saved language preference
        const savedLanguage = localStorage.getItem('user_language') || 'en';
        await this.setLanguage(savedLanguage);
        
        this.initialized = true;
    },

    /**
     * Set current language and load translations
     */
    async setLanguage(langCode) {
        try {
            // Load translations from API
            const response = await fetch(`${API_BASE_URL}/language/translations/${langCode}`);
            const data = await response.json();

            if (data.status === 'success') {
                this.currentLanguage = langCode;
                this.translations = data.data.translations;
                localStorage.setItem('user_language', langCode);
                
                // Update page content
                this.translatePage();
                
                // Update HTML lang attribute
                document.documentElement.lang = langCode;
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load language:', error);
            return false;
        }
    },

    /**
     * Get translation for a key
     */
    t(key, params = {}) {
        let text = this.translations[key] || key;
        
        // Replace parameters
        Object.keys(params).forEach(paramKey => {
            text = text.replace(`{${paramKey}}`, params[paramKey]);
        });
        
        return text;
    },

    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder) {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Translate titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Translate values
        document.querySelectorAll('[data-i18n-value]').forEach(element => {
            const key = element.getAttribute('data-i18n-value');
            element.value = this.t(key);
        });

        // Update language selector
        this.updateLanguageSelector();
    },

    /**
     * Update language selector UI
     */
    updateLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = this.currentLanguage;
        }

        // Update flag/icon
        const languageBtn = document.getElementById('languageBtn');
        if (languageBtn) {
            const flag = this.currentLanguage === 'so' ? '🇸🇴' : '🇬🇧';
            const langText = this.currentLanguage === 'so' ? 'SO' : 'EN';
            languageBtn.innerHTML = `<span class="flag">${flag}</span> ${langText}`;
        }
    },

    /**
     * Save user language preference to server
     */
    async saveUserLanguage(userId) {
        try {
            const response = await api.post('/language/user/update', {
                user_id: userId,
                language: this.currentLanguage
            });

            if (response.status === 'success') {
                console.log('Language preference saved');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to save language preference:', error);
            return false;
        }
    },

    /**
     * Get available languages
     */
    async getAvailableLanguages() {
        try {
            const response = await fetch(`${API_BASE_URL}/language`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Failed to get languages:', error);
            return [];
        }
    }
};

/**
 * Initialize language system when DOM is ready
 */
$(document).ready(async function() {
    // Initialize language system
    await LanguageManager.init();
});

/**
 * Change language handler
 */
async function changeLanguage(langCode) {
    const success = await LanguageManager.setLanguage(langCode);
    
    if (success) {
        // Save to user preferences if logged in
        const user = getCurrentUser();
        if (user && user.id) {
            await LanguageManager.saveUserLanguage(user.id);
        }
        
        // Show success message
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: LanguageManager.t('language_changed'),
                timer: 1500,
                showConfirmButton: false
            });
        }
        
        // Reload page to apply translations to dynamically loaded content
        setTimeout(() => {
            location.reload();
        }, 1500);
    } else {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to change language'
            });
        }
    }
}

// Export for global use
window.LanguageManager = LanguageManager;
window.changeLanguage = changeLanguage;

/**
 * Global applyTranslations function (alias for translatePage)
 * Used by dynamically loaded pages
 */
window.applyTranslations = function() {
    LanguageManager.translatePage();
};
