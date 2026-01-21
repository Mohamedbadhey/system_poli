// ============================================
// SweetAlert2 Helper Functions
// ============================================

// Success alert
function showSuccess(title, text) {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonColor: '#10b981',
        timer: 3000
    });
}

// Error alert
function showError(title, text) {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonColor: '#ef4444'
    });
}

// Warning alert
function showWarning(title, text) {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: text,
        confirmButtonColor: '#f59e0b'
    });
}

// Info alert
function showInfo(title, text) {
    return Swal.fire({
        icon: 'info',
        title: title,
        text: text,
        confirmButtonColor: '#3b82f6'
    });
}

// Confirmation dialog
function showConfirm(title, text, confirmButtonText = 'Yes, proceed', cancelButtonText = 'Cancel') {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: text,
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText
    });
}

// Prompt dialog
function showPrompt(title, text, inputPlaceholder = '') {
    return Swal.fire({
        title: title,
        text: text,
        input: 'text',
        inputPlaceholder: inputPlaceholder,
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        inputValidator: (value) => {
            if (!value) {
                return 'You need to write something!';
            }
        }
    });
}

// Loading alert
function showLoading(title = 'Processing...', text = 'Please wait') {
    return Swal.fire({
        title: title,
        text: text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

// Close any open SweetAlert
function closeAlert() {
    Swal.close();
}
