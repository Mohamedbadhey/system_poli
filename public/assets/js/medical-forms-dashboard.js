// Medical Forms Dashboard - Complete Management System
// =====================================================

let allForms = [];
let filteredForms = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Medical Forms Dashboard Initializing...');
    checkAuthentication();
    loadMedicalForms();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Authentication Required',
            text: 'Please login to access the dashboard',
            confirmButtonText: 'Go to Login'
        }).then(() => {
            window.location.href = '/public/index.html';
        });
    }
}

// Load all medical forms
async function loadMedicalForms() {
    const baseUrl = window.location.origin;
    const token = localStorage.getItem('auth_token');
    
    try {
        console.log('Fetching medical forms...');
        const response = await fetch(`${baseUrl}/investigation/medical-forms/my-forms`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Sort forms by created_at in descending order (newest first)
            allForms = result.data.sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            filteredForms = [...allForms];
            console.log(`Loaded ${allForms.length} medical forms (sorted by newest first)`);
            updateStats();
            renderTable();
        } else {
            showError('Failed to load medical forms: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading medical forms:', error);
        showError('Error connecting to server');
    }
}

// Update statistics
function updateStats() {
    const total = allForms.length;
    const accusers = allForms.filter(f => f.party_type === 'accuser').length;
    const accused = allForms.filter(f => f.party_type === 'accused').length;
    const witnesses = allForms.filter(f => f.party_type === 'witness').length;
    
    document.getElementById('totalForms').textContent = total;
    document.getElementById('accuserForms').textContent = accusers;
    document.getElementById('accusedForms').textContent = accused;
    document.getElementById('witnessForms').textContent = witnesses;
}

// Render table with pagination
function renderTable() {
    const tableContainer = document.getElementById('tableContainer');
    const resultCount = document.getElementById('resultCount');
    
    if (filteredForms.length === 0) {
        tableContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-folder-open"></i>
                <h3>No Medical Forms Found</h3>
                <p>Create your first medical examination form to get started.</p>
                <a href="medical-examination-report.html" class="btn btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-plus"></i> Create New Form
                </a>
            </div>
        `;
        document.getElementById('paginationContainer').style.display = 'none';
        resultCount.textContent = 'No forms found';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredForms.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredForms.length);
    const pageData = filteredForms.slice(startIndex, endIndex);
    
    // Update result count
    resultCount.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredForms.length} forms`;
    
    // Generate table HTML
    let tableHTML = `
        <table class="forms-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Case Number</th>
                    <th>Patient Name</th>
                    <th>Party Type</th>
                    <th>Hospital</th>
                    <th>Exam Date</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    pageData.forEach(form => {
        const examDate = form.examination_date ? new Date(form.examination_date).toLocaleDateString() : 'N/A';
        const createdDate = new Date(form.created_at).toLocaleDateString();
        const partyTypeBadge = getPartyTypeBadge(form.party_type);
        
        tableHTML += `
            <tr>
                <td>#${form.id}</td>
                <td><strong>${form.case_number || 'N/A'}</strong></td>
                <td>${form.patient_name}</td>
                <td>${partyTypeBadge}</td>
                <td>${form.hospital_name || 'N/A'}</td>
                <td>${examDate}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="viewForm(${form.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editForm(${form.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="printForm(${form.id})" title="Print">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteForm(${form.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
    
    // Update pagination
    updatePagination(totalPages);
}

// Get party type badge HTML
function getPartyTypeBadge(type) {
    const badges = {
        'accuser': '<span class="badge badge-accuser"><i class="fas fa-user-injured"></i> Accuser</span>',
        'accused': '<span class="badge badge-accused"><i class="fas fa-user-shield"></i> Accused</span>',
        'witness': '<span class="badge badge-witness"><i class="fas fa-eye"></i> Witness</span>'
    };
    return badges[type] || `<span class="badge">${type}</span>`;
}

// Update pagination controls
function updatePagination(totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Pagination functions
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredForms.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

// Apply filters
function applyFilters() {
    const caseFilter = document.getElementById('filterCase').value.toLowerCase();
    const patientFilter = document.getElementById('filterPatient').value.toLowerCase();
    const typeFilter = document.getElementById('filterType').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const globalSearch = document.getElementById('globalSearch').value.toLowerCase();
    
    filteredForms = allForms.filter(form => {
        // Case filter
        if (caseFilter && !form.case_number?.toLowerCase().includes(caseFilter)) {
            return false;
        }
        
        // Patient filter
        if (patientFilter && !form.patient_name.toLowerCase().includes(patientFilter)) {
            return false;
        }
        
        // Type filter
        if (typeFilter && form.party_type !== typeFilter) {
            return false;
        }
        
        // Date range filter
        if (dateFrom || dateTo) {
            const examDate = form.examination_date ? new Date(form.examination_date) : null;
            if (examDate) {
                if (dateFrom && examDate < new Date(dateFrom)) {
                    return false;
                }
                if (dateTo && examDate > new Date(dateTo)) {
                    return false;
                }
            }
        }
        
        // Global search
        if (globalSearch) {
            const searchableText = `
                ${form.case_number} 
                ${form.patient_name} 
                ${form.hospital_name} 
                ${form.party_type}
            `.toLowerCase();
            
            if (!searchableText.includes(globalSearch)) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderTable();
}

// Clear all filters
function clearFilters() {
    document.getElementById('filterCase').value = '';
    document.getElementById('filterPatient').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('globalSearch').value = '';
    
    filteredForms = [...allForms];
    currentPage = 1;
    renderTable();
}

// View form (read-only)
async function viewForm(formId) {
    const form = allForms.find(f => f.id === formId);
    if (!form) return;
    
    // Parse form data
    let formData = {};
    try {
        formData = JSON.parse(form.form_data);
    } catch (e) {
        console.error('Error parsing form data:', e);
    }
    
    // Build detailed view HTML
    const detailsHTML = `
        <div style="text-align: left; max-height: 600px; overflow-y: auto;">
            <h3 style="margin-bottom: 20px; color: #667eea;">Medical Form Details</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <strong>Form ID:</strong> #${form.id}
                </div>
                <div>
                    <strong>Case Number:</strong> ${form.case_number || 'N/A'}
                </div>
                <div>
                    <strong>Patient Name:</strong> ${form.patient_name}
                </div>
                <div>
                    <strong>Party Type:</strong> ${form.party_type}
                </div>
                <div>
                    <strong>Hospital:</strong> ${form.hospital_name || 'N/A'}
                </div>
                <div>
                    <strong>Examination Date:</strong> ${form.examination_date || 'N/A'}
                </div>
                <div>
                    <strong>Report Date:</strong> ${form.report_date || 'N/A'}
                </div>
                <div>
                    <strong>Created:</strong> ${new Date(form.created_at).toLocaleString()}
                </div>
            </div>
            
            <h4 style="margin-top: 20px; color: #6b7280;">Form Data Fields:</h4>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 13px; max-height: 300px; overflow-y: auto;">
                ${Object.keys(formData).length > 0 ? 
                    Object.entries(formData).map(([key, value]) => 
                        `<div style="margin-bottom: 8px;">
                            <strong>${key}:</strong> ${value || 'N/A'}
                        </div>`
                    ).join('') 
                    : '<p>No form data available</p>'
                }
            </div>
        </div>
    `;
    
    Swal.fire({
        html: detailsHTML,
        width: 800,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'swal-wide'
        }
    });
}

// Edit form
function editForm(formId) {
    Swal.fire({
        icon: 'info',
        title: 'Edit Medical Form',
        text: 'You will be redirected to the medical form editor',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Redirect to form with form ID in URL
            window.location.href = `medical-examination-report.html?edit=${formId}`;
        }
    });
}

// Print form
function printForm(formId) {
    Swal.fire({
        icon: 'info',
        title: 'Print Medical Form',
        text: 'You will be redirected to the printable view',
        showCancelButton: true,
        confirmButtonText: 'Continue',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Open form in new window for printing
            window.open(`medical-examination-report.html?view=${formId}`, '_blank');
        }
    });
}

// Delete form
async function deleteForm(formId) {
    const form = allForms.find(f => f.id === formId);
    if (!form) return;
    
    const result = await Swal.fire({
        icon: 'warning',
        title: 'Delete Medical Form?',
        html: `
            <p>Are you sure you want to delete this medical form?</p>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: left;">
                <strong>Case:</strong> ${form.case_number}<br>
                <strong>Patient:</strong> ${form.patient_name}<br>
                <strong>Date:</strong> ${new Date(form.created_at).toLocaleDateString()}
            </div>
            <p style="color: #ef4444; margin-top: 15px;"><strong>This action cannot be undone!</strong></p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef4444'
    });
    
    if (result.isConfirmed) {
        const baseUrl = window.location.origin;
        const token = localStorage.getItem('auth_token');
        
        try {
            const response = await fetch(`${baseUrl}/investigation/medical-forms/${formId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const deleteResult = await response.json();
            
            if (deleteResult.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Medical form has been deleted successfully',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Reload data
                loadMedicalForms();
            } else {
                showError('Failed to delete form: ' + deleteResult.message);
            }
        } catch (error) {
            console.error('Error deleting form:', error);
            showError('Error connecting to server');
        }
    }
}

// Refresh data
function refreshData() {
    Swal.fire({
        icon: 'info',
        title: 'Refreshing...',
        text: 'Loading latest data',
        timer: 1000,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    loadMedicalForms();
}

// Show error message
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
}

// Export functions to global scope
window.viewForm = viewForm;
window.editForm = editForm;
window.printForm = printForm;
window.deleteForm = deleteForm;
window.refreshData = refreshData;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.previousPage = previousPage;
window.nextPage = nextPage;
