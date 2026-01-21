// ============================================
// Authentication Logic
// ============================================

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
        // Redirect to dashboard if already logged in
        if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
            window.location.href = 'dashboard.html';
        }
        return true;
    }
    
    // Redirect to login if not authenticated
    if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
    
    return false;
}

// Login form handler
$(document).ready(function() {
    if ($('#loginForm').length) {
        $('#loginForm').on('submit', async function(e) {
            e.preventDefault();
            
            const username = $('#username').val();
            const password = $('#password').val();
            const loginBtn = $('#loginBtn');
            const alert = $('#loginAlert');
            
            // Disable button
            loginBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Logging in...');
            alert.hide();
            
            try {
                const response = await authAPI.login({ username, password });
                
                if (response.status === 'success') {
                    // Store token and user data
                    const { token, refresh_token, user } = response.data;
                    
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('refresh_token', refresh_token);
                    localStorage.setItem('user_data', JSON.stringify(user));
                    
                    // Set API token
                    api.setToken(token);
                    
                    // Show success message
                    alert.removeClass('alert-error').addClass('alert-success')
                        .html('<i class="fas fa-check-circle"></i> Login successful! Redirecting...')
                        .show();
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    throw new Error(response.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert.removeClass('alert-success').addClass('alert-error')
                    .html(`<i class="fas fa-exclamation-circle"></i> ${error.message || 'Login failed. Please check your credentials.'}`)
                    .show();
                
                loginBtn.prop('disabled', false).html('<i class="fas fa-sign-in-alt"></i> Login');
            }
        });
    }
});

// Logout function
async function logout() {
    const t = window.LanguageManager ? LanguageManager.t.bind(LanguageManager) : (key) => key;
    const confirmMsg = t('logout_confirm');
    
    if (confirm(confirmMsg)) {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage
            api.clearToken();
            
            // Redirect to login
            window.location.href = 'index.html';
        }
    }
}

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

// Check if user has role
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Check if user has any of the roles
function hasAnyRole(roles) {
    const user = getCurrentUser();
    return user && roles.includes(user.role);
}

// Token refresh logic
async function refreshAuthToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
        logout();
        return;
    }
    
    try {
        const response = await authAPI.refreshToken(refreshToken);
        
        if (response.status === 'success') {
            const { token } = response.data;
            localStorage.setItem('auth_token', token);
            api.setToken(token);
            return token;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
    }
}

// Auto-refresh token every 25 minutes
setInterval(() => {
    if (getCurrentUser()) {
        refreshAuthToken();
    }
}, 25 * 60 * 1000);

// Change password function
async function changePassword() {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) return;
    
    const newPassword = prompt('Enter new password (min 8 characters):');
    if (!newPassword || newPassword.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const response = await authAPI.changePassword({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
        });
        
        if (response.status === 'success') {
            alert('Password changed successfully! Please login again.');
            logout();
        }
    } catch (error) {
        alert('Failed to change password: ' + error.message);
    }
}
