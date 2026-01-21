/**
 * Toast Helper Function
 * Provides a unified showToast function using SweetAlert2
 */

function showToast(message, type = 'info') {
    if (typeof Swal !== 'undefined') {
        const icon = type === 'error' ? 'error' : 
                     type === 'success' ? 'success' : 
                     type === 'warning' ? 'warning' : 'info';
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: icon,
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    } else {
        // Fallback to console
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Also export for module compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = showToast;
}
