/**
 * Evidence Edit and History Management
 */

class EvidenceEditManager {
    constructor() {
        this.apiBase = '/investigation';
        this.currentEvidence = null;
        this.init();
    }

    init() {
        // Initialize event listeners will be set by parent pages
        console.log('EvidenceEditManager initialized');
    }

    /**
     * Show edit evidence modal
     */
    showEditModal(evidenceId) {
        console.log('[DEBUG] Opening edit modal for evidence:', evidenceId);
        
        // Fetch evidence details
        fetch(`${this.apiBase}/evidence/${evidenceId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('[DEBUG] Evidence data received:', data);
            if (data.status === 'success') {
                this.currentEvidence = data.data;
                this.renderEditModal(data.data);
            } else {
                showNotification(t('failed_update_evidence'), 'error');
            }
        })
        .catch(error => {
            console.error('[ERROR] Failed to load evidence details:', error);
            showNotification(t('failed_load_evidence') + ': ' + error.message, 'error');
        });
    }

    /**
     * Render edit evidence modal using SweetAlert2
     */
    renderEditModal(evidence) {
        const lastEditedInfo = evidence.is_edited ? 
            `<div style="margin-top: 10px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 12px; color: #6b7280;">
                Last edited by <strong>${evidence.last_editor_name || 'Unknown'}</strong> on ${formatDateTime(evidence.last_edited_at)}
            </div>` : '';

        Swal.fire({
            title: '<i class="fas fa-edit"></i> ' + t('edit_evidence'),
            html: `
                <div style="text-align: left;">
                    <div style="padding: 12px; background: #dbeafe; border-radius: 4px; margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i>
                        <span data-i18n="evidence_number">${t('evidence_number')}:</span> <strong>${evidence.evidence_number}</strong>
                        ${evidence.is_edited ? '<span style="background: #fbbf24; color: #000; padding: 2px 8px; border-radius: 3px; margin-left: 8px; font-size: 11px;" data-i18n="previously_edited">' + t('previously_edited') + '</span>' : ''}
                    </div>

                    <div style="margin-bottom: 20px; padding: 12px; background: #f3f4f6; border-radius: 4px; border-left: 4px solid #3b82f6;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <strong style="display: block; margin-bottom: 4px;" data-i18n="current_file">${t('current_file')}:</strong>
                                <span style="color: #6b7280;">
                                    <i class="fas fa-file"></i> ${escapeHtml(evidence.file_name)}
                                </span>
                                <span style="margin-left: 10px; font-size: 12px; color: #9ca3af;">
                                    (${(evidence.file_size / 1024).toFixed(2)} KB)
                                </span>
                            </div>
                            <button type="button" onclick="evidenceEditManager.showReplaceFileDialog(${evidence.id})" 
                                    style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
                                <i class="fas fa-upload"></i> <span data-i18n="replace_file">${t('replace_file')}</span>
                            </button>
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;"><span data-i18n="title">${t('title')}</span> <span style="color: #dc2626;">*</span></label>
                        <input type="text" id="edit_title" class="swal2-input" 
                               value="${escapeHtml(evidence.title)}" 
                               style="width: 100%; margin: 0;" required>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;"><span data-i18n="description">${t('description')}</span></label>
                        <textarea id="edit_description" class="swal2-textarea" rows="4" 
                                  style="width: 100%; margin: 0;">${escapeHtml(evidence.description || '')}</textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;"><span data-i18n="evidence_type">${t('evidence_type')}</span> <span style="color: #dc2626;">*</span></label>
                            <select id="edit_evidence_type" class="swal2-select" style="width: 100%; margin: 0;">
                                <option value="photo" ${evidence.evidence_type === 'photo' ? 'selected' : ''} data-i18n="photo">${t('photo')}</option>
                                <option value="video" ${evidence.evidence_type === 'video' ? 'selected' : ''} data-i18n="video">${t('video')}</option>
                                <option value="audio" ${evidence.evidence_type === 'audio' ? 'selected' : ''} data-i18n="audio">${t('audio')}</option>
                                <option value="document" ${evidence.evidence_type === 'document' ? 'selected' : ''} data-i18n="document">${t('document')}</option>
                                <option value="physical" ${evidence.evidence_type === 'physical' ? 'selected' : ''} data-i18n="physical_item">${t('physical_item')}</option>
                                <option value="digital" ${evidence.evidence_type === 'digital' ? 'selected' : ''} data-i18n="digital_evidence">${t('digital_evidence')}</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;"><span data-i18n="location_collected">${t('location_collected')}</span></label>
                            <input type="text" id="edit_location_collected" class="swal2-input" 
                                   value="${escapeHtml(evidence.location_collected || '')}" 
                                   style="width: 100%; margin: 0;">
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;"><span data-i18n="tags">${t('tags')}</span></label>
                        <input type="text" id="edit_tags" class="swal2-input" 
                               value="${escapeHtml(evidence.tags || '')}" 
                               data-i18n-placeholder="tags_placeholder" placeholder="${t('tags_placeholder')}"
                               style="width: 100%; margin: 0;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="edit_is_critical" 
                                   ${evidence.is_critical ? 'checked' : ''}
                                   style="margin-right: 8px; width: 18px; height: 18px;">
                            <span style="font-weight: 600;" data-i18n="mark_critical">${t('mark_critical')}</span>
                        </label>
                    </div>

                    <div style="padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong data-i18n="note">${t('note')}:</strong> <span data-i18n="changes_tracked">${t('changes_tracked')}</span>
                    </div>

                    ${lastEditedInfo}
                </div>
            `,
            width: '700px',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> ' + t('save_changes'),
            denyButtonText: '<i class="fas fa-history"></i> ' + t('view_history'),
            cancelButtonText: t('cancel'),
            customClass: {
                confirmButton: 'btn btn-primary',
                denyButton: 'btn btn-secondary',
                cancelButton: 'btn btn-secondary'
            },
            preConfirm: () => {
                const title = document.getElementById('edit_title').value.trim();
                if (!title) {
                    Swal.showValidationMessage('Title is required');
                    return false;
                }
                return true;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.saveChanges();
            } else if (result.isDenied) {
                this.showEditHistory(evidence.id);
            }
        });
    }

    /**
     * Save evidence changes
     */
    saveChanges() {
        const changes = {
            title: document.getElementById('edit_title').value.trim(),
            description: document.getElementById('edit_description').value.trim(),
            evidence_type: document.getElementById('edit_evidence_type').value,
            location_collected: document.getElementById('edit_location_collected').value.trim(),
            tags: document.getElementById('edit_tags').value.trim(),
            is_critical: document.getElementById('edit_is_critical').checked ? 1 : 0
        };

        console.log('[DEBUG] Saving changes:', changes);

        // Show loading
        Swal.fire({
            title: t('saving'),
            html: t('please_wait'),
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch(`${this.apiBase}/evidence/${this.currentEvidence.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(changes)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('[DEBUG] Save response:', data);
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: t('success'),
                    text: t('evidence_updated_success'),
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Trigger refresh event
                if (typeof refreshEvidenceList === 'function') {
                    refreshEvidenceList();
                }
                // Don't call loadAllEvidence without case ID
                // It will be refreshed when the modal is closed or when user navigates
            } else {
                Swal.fire({
                    icon: 'error',
                    title: t('error'),
                    text: data.message || t('failed_update_evidence')
                });
            }
        })
        .catch(error => {
            console.error('[ERROR] Failed to save changes:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error updating evidence: ' + error.message
            });
        });
    }

    /**
     * Show edit history modal
     */
    showEditHistory(evidenceId) {
        fetch(`${this.apiBase}/evidence/${evidenceId}/history`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.renderEditHistoryModal(evidenceId, data.data);
            } else {
                showNotification('Failed to load edit history', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error loading edit history', 'error');
        });
    }

    /**
     * Render edit history modal using SweetAlert2 with file previews
     */
    renderEditHistoryModal(evidenceId, history) {
        let historyHtml;
        let groupedHistory = []; // Declare outside if/else so it's accessible later
        
        if (history.length === 0) {
            historyHtml = `
                <div style="padding: 20px; text-align: center; color: #6b7280;">
                    <i class="fas fa-info-circle" style="font-size: 48px; color: #3b82f6; margin-bottom: 10px;"></i>
                    <p data-i18n="no_edit_history">${t('no_edit_history')}</p>
                </div>
            `;
        } else {
            // Group file-related changes that happen at the same time
            let i = 0;
            
            while (i < history.length) {
                const entry = history[i];
                
                // Check if this is a file_name change
                if (entry.field_name === 'file_name') {
                    // Look for related file_path and file_size changes
                    const fileGroup = {
                        ...entry,
                        file_path_old: null,
                        file_path_new: null,
                        file_size_old: null,
                        file_size_new: null,
                        version_id: null // Important for downloads
                    };
                    
                    // Check next few entries for file_path and file_size
                    for (let j = i + 1; j < Math.min(i + 5, history.length); j++) {
                        const nextEntry = history[j];
                        if (nextEntry.edited_at === entry.edited_at && nextEntry.edited_by === entry.edited_by) {
                            if (nextEntry.field_name === 'file_path') {
                                fileGroup.file_path_old = nextEntry.old_value;
                                fileGroup.file_path_new = nextEntry.new_value;
                                fileGroup.version_id = nextEntry.version_id; // Get version_id from file_path entry!
                            } else if (nextEntry.field_name === 'file_size') {
                                fileGroup.file_size_old = nextEntry.old_value;
                                fileGroup.file_size_new = nextEntry.new_value;
                            }
                        }
                    }
                    
                    fileGroup.isFileChange = true;
                    groupedHistory.push(fileGroup);
                    
                    // Skip the related entries
                    i++;
                    while (i < history.length && 
                           (history[i].field_name === 'file_path' || history[i].field_name === 'file_size') &&
                           history[i].edited_at === entry.edited_at) {
                        i++;
                    }
                } else if (entry.field_name !== 'file_path' && entry.field_name !== 'file_size') {
                    // Regular entry (not part of file change)
                    groupedHistory.push({...entry, isFileChange: false});
                    i++;
                } else {
                    // Skip standalone file_path/file_size entries (should be grouped)
                    i++;
                }
            }
            
            historyHtml = `
                <div style="max-height: 600px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <thead>
                            <tr style="background: #1f2937; color: white; position: sticky; top: 0; z-index: 10;">
                                <th style="padding: 10px; text-align: left; width: 15%;" data-i18n="date">${t('date')}</th>
                                <th style="padding: 10px; text-align: left; width: 15%;" data-i18n="edited_by">${t('edited_by')}</th>
                                <th style="padding: 10px; text-align: left; width: 15%;" data-i18n="field_changed">${t('field_changed')}</th>
                                <th style="padding: 10px; text-align: left; width: 27%;" data-i18n="old_value">${t('old_value')}</th>
                                <th style="padding: 10px; text-align: left; width: 28%;" data-i18n="new_value">${t('new_value')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groupedHistory.map((entry, index) => {
                                if (entry.isFileChange) {
                                    // Determine file type from filename
                                    const oldFileExt = entry.old_value.split('.').pop().toLowerCase();
                                    const newFileExt = entry.new_value.split('.').pop().toLowerCase();
                                    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                                    const isOldImage = imageExts.includes(oldFileExt);
                                    const isNewImage = imageExts.includes(newFileExt);
                                    
                                    // Generate preview HTML for old file
                                    const oldPreviewId = `old_preview_${index}`;
                                    const newPreviewId = `new_preview_${index}`;
                                    
                                    // Special rendering for file changes with previews and download buttons
                                    return `
                                        <tr style="background: ${index % 2 === 0 ? '#fff3cd' : '#fffbeb'}; border-bottom: 2px solid #fbbf24;">
                                            <td style="padding: 10px; font-size: 12px; vertical-align: top;">
                                                ${formatDateTime(entry.edited_at)}
                                            </td>
                                            <td style="padding: 10px; vertical-align: top;">
                                                <strong>${escapeHtml(entry.editor_name)}</strong>
                                            </td>
                                            <td style="padding: 10px; vertical-align: top;">
                                                <span style="background: #ef4444; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block;">
                                                    <i class="fas fa-exchange-alt"></i> <span data-i18n="file_replaced">${t('file_replaced')}</span>
                                                </span>
                                            </td>
                                            <td style="padding: 12px; vertical-align: top; background: #f3f4f6; border-radius: 4px;">
                                                <!-- Old File Preview -->
                                                <div id="${oldPreviewId}" style="width: 120px; height: 120px; background: white; border: 2px solid #d1d5db; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; overflow: hidden;">
                                                    <i class="fas fa-spinner fa-spin" style="color: #9ca3af;"></i>
                                                </div>
                                                <div style="margin-bottom: 8px;">
                                                    <i class="fas fa-file" style="color: #6b7280;"></i>
                                                    <strong style="color: #374151; font-size: 11px;">${escapeHtml(entry.old_value)}</strong>
                                                </div>
                                                ${entry.file_size_old ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">Size: ${(entry.file_size_old / 1024).toFixed(2)} KB</div>` : ''}
                                                <button onclick="evidenceEditManager.downloadVersionById(${evidenceId}, ${entry.version_id})" 
                                                        style="padding: 6px 12px; background: #6b7280; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600; width: 100%;">
                                                    <i class="fas fa-download"></i> <span data-i18n="download_old_version">${t('download_old_version')}</span>
                                                </button>
                                            </td>
                                            <td style="padding: 12px; vertical-align: top; background: #d1fae5; border-radius: 4px;">
                                                <!-- New File Preview -->
                                                <div id="${newPreviewId}" style="width: 120px; height: 120px; background: white; border: 2px solid #10b981; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; overflow: hidden;">
                                                    <i class="fas fa-spinner fa-spin" style="color: #10b981;"></i>
                                                </div>
                                                <div style="margin-bottom: 8px;">
                                                    <i class="fas fa-file" style="color: #059669;"></i>
                                                    <strong style="color: #065f46; font-size: 11px;">${escapeHtml(entry.new_value)}</strong>
                                                </div>
                                                ${entry.file_size_new ? `<div style="font-size: 11px; color: #047857; margin-bottom: 8px;">Size: ${(entry.file_size_new / 1024).toFixed(2)} KB</div>` : ''}
                                                <button onclick="evidenceEditManager.downloadCurrentVersion(${evidenceId})" 
                                                        style="padding: 6px 12px; background: #059669; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600; width: 100%;">
                                                    <i class="fas fa-download"></i> <span data-i18n="download_new_version">${t('download_new_version')}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                } else {
                                    // Normal rendering for non-file changes
                                    return `
                                        <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; border-bottom: 1px solid #e5e7eb;">
                                            <td style="padding: 10px; font-size: 12px;">
                                                ${formatDateTime(entry.edited_at)}
                                            </td>
                                            <td style="padding: 10px;">
                                                <strong>${escapeHtml(entry.editor_name)}</strong>
                                            </td>
                                            <td style="padding: 10px;">
                                                <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">
                                                    ${this.formatFieldName(entry.field_name)}
                                                </span>
                                            </td>
                                            <td style="padding: 10px; color: #6b7280; word-wrap: break-word;">
                                                ${this.formatFieldValue(entry.field_name, entry.old_value)}
                                            </td>
                                            <td style="padding: 10px; color: #059669; word-wrap: break-word; font-weight: 600;">
                                                ${this.formatFieldValue(entry.field_name, entry.new_value)}
                                            </td>
                                        </tr>
                                    `;
                                }
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Store for didOpen callback
        const self = this;
        const historyForPreviews = groupedHistory;
        
        Swal.fire({
            title: '<i class="fas fa-history"></i> ' + t('evidence_edit_history'),
            html: historyHtml,
            width: '1100px',
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: t('close'),
            customClass: {
                confirmButton: 'btn btn-secondary',
                popup: 'high-z-index-modal'
            },
            didOpen: () => {
                // Force this modal to appear on top by setting highest z-index
                const containers = document.querySelectorAll('.swal2-container');
                if (containers.length > 0) {
                    const lastContainer = containers[containers.length - 1];
                    lastContainer.style.zIndex = '9999999';
                    const popup = lastContainer.querySelector('.swal2-popup');
                    if (popup) {
                        popup.style.zIndex = '9999999';
                    }
                }
                
                // Load previews after modal opens (SweetAlert2 doesn't run inline scripts)
                historyForPreviews.forEach((entry, index) => {
                    if (entry.isFileChange) {
                        const oldFileExt = entry.old_value.split('.').pop().toLowerCase();
                        const newFileExt = entry.new_value.split('.').pop().toLowerCase();
                        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
                        const isOldImage = imageExts.includes(oldFileExt);
                        const isNewImage = imageExts.includes(newFileExt);
                        
                        const oldPreviewId = `old_preview_${index}`;
                        const newPreviewId = `new_preview_${index}`;
                        
                        console.log('[DEBUG] Loading previews for entry:', index, { isOldImage, isNewImage, versionId: entry.version_id });
                        
                        // Load old file preview/icon
                        if (isOldImage) {
                            self.loadHistoryFilePreview(oldPreviewId, evidenceId, entry.file_path_old, true, entry.version_id);
                        } else {
                            self.showHistoryFileIcon(oldPreviewId, oldFileExt);
                        }
                        
                        // Load new file preview/icon
                        if (isNewImage) {
                            self.loadHistoryFilePreview(newPreviewId, evidenceId, null, false);
                        } else {
                            self.showHistoryFileIcon(newPreviewId, newFileExt);
                        }
                    }
                });
            }
        });
    }

    /**
     * Download old version by version ID
     */
    downloadVersionById(evidenceId, versionId) {
        console.log('[DEBUG] Downloading version:', { evidenceId, versionId });
        
        if (!versionId || versionId === 'null' || versionId === 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Version Not Found',
                html: `
                    <p>Unable to find the old version in the database.</p>
                    <p>This might happen if:</p>
                    <ul style="text-align: left;">
                        <li>The file was replaced before versioning was enabled</li>
                        <li>The version data wasn't saved properly</li>
                    </ul>
                `,
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Download using version ID with auth token
        fetch(`${this.apiBase}/evidence/${evidenceId}/download-version/${versionId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `evidence_v${versionId}.file`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('[DEBUG] Old version downloaded:', filename);
        })
        .catch(error => {
            console.error('[ERROR] Old version download failed:', error);
            Swal.fire({
                icon: 'error',
                title: 'Download Failed',
                text: 'Error downloading old version: ' + error.message
            });
        });
    }

    /**
     * Download old version of file by path (LEGACY - for backwards compatibility)
     */
    downloadVersionByPath(evidenceId, filePath) {
        console.log('[DEBUG] Downloading version by path (legacy):', filePath);
        
        if (!filePath) {
            Swal.fire('Error', 'File path not available', 'error');
            return;
        }
        
        Swal.fire({
            icon: 'warning',
            title: 'Old Version Download',
            html: `
                <p><strong>Old version download requires file versioning to be set up.</strong></p>
                <p>The file path is: <code style="font-size: 11px;">${escapeHtml(filePath)}</code></p>
                <hr>
                <p><strong>To enable old version downloads:</strong></p>
                <ol style="text-align: left; padding-left: 20px;">
                    <li>Apply database migration: <code>evidence_file_versions_migration.sql</code></li>
                    <li>Replace files after migration is applied</li>
                    <li>Old versions will then be downloadable</li>
                </ol>
                <p style="margin-top: 15px;">For now, download the current version instead:</p>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-download"></i> Download Current Version',
            cancelButtonText: 'Close',
            width: '600px'
        }).then((result) => {
            if (result.isConfirmed) {
                this.downloadCurrentVersion(evidenceId);
            }
        });
    }

    /**
     * Download file directly by path (fallback method) - DEPRECATED
     */
    downloadFileByPath(evidenceId, filePath) {
        console.log('[DEPRECATED] downloadFileByPath called');
        this.downloadVersionByPath(evidenceId, filePath);
    }

    /**
     * Download current version of file
     */
    downloadCurrentVersion(evidenceId) {
        console.log('[DEBUG] Downloading current version of evidence:', evidenceId);
        
        // Fetch with auth token and trigger download
        fetch(`${this.apiBase}/evidence/${evidenceId}/download`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Get filename from Content-Disposition header if available
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `evidence_${evidenceId}.file`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('[DEBUG] File downloaded:', filename);
        })
        .catch(error => {
            console.error('[ERROR] Download failed:', error);
            Swal.fire({
                icon: 'error',
                title: 'Download Failed',
                text: 'Error downloading file: ' + error.message
            });
        });
    }

    /**
     * Show replace file dialog with preview
     */
    showReplaceFileDialog(evidenceId) {
        const currentEvidence = this.currentEvidence;
        
        const dialogHtml = `
            <div style="text-align: left;">
                <div style="padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 15px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong data-i18n="warning">${t('warning')}:</strong> <span data-i18n="replace_warning">${t('replace_warning')}</span>
                </div>
                
                <!-- File Comparison -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <!-- Current File -->
                    <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                        <h4 style="margin: 0 0 10px 0; color: #dc2626; font-size: 14px;">
                            <i class="fas fa-file"></i> <span data-i18n="current_file">${t('current_file')}</span>
                        </h4>
                        <div id="current_file_preview" style="min-height: 150px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #9ca3af;"></i>
                        </div>
                        <div style="font-size: 12px; color: #6b7280;">
                            <strong>${escapeHtml(currentEvidence.file_name)}</strong><br>
                            <span data-i18n="file_size">${t('file_size')}:</span> ${(currentEvidence.file_size / 1024).toFixed(2)} KB<br>
                            <span data-i18n="type">${t('type')}:</span> ${currentEvidence.file_type || 'Unknown'}
                        </div>
                    </div>
                    
                    <!-- New File -->
                    <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb;">
                        <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 14px;">
                            <i class="fas fa-upload"></i> <span data-i18n="new_file">${t('new_file')}</span>
                        </h4>
                        <div id="new_file_preview" style="min-height: 150px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; flex-direction: column;">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #d1d5db; margin-bottom: 10px;"></i>
                            <span style="color: #9ca3af; font-size: 13px;">No file selected</span>
                        </div>
                        <div id="new_file_info" style="font-size: 12px; color: #6b7280;">
                            <em>Select a file to preview</em>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;"><span data-i18n="select_file">${t('select_file')}</span> <span style="color: #dc2626;">*</span></label>
                    <input type="file" id="replace_file" class="swal2-file" style="width: 100%;" accept="*/*" onchange="evidenceEditManager.previewNewFile(this)">
                    <small style="color: #6b7280;">Maximum file size: 50MB</small>
                </div>
            </div>
        `;
        
        Swal.fire({
            title: '<i class="fas fa-upload"></i> ' + t('replace_evidence_file'),
            html: dialogHtml,
            width: '800px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-upload"></i> ' + t('upload_replace'),
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-secondary'
            },
            didOpen: () => {
                // Load preview of current file
                this.loadCurrentFilePreview(evidenceId);
            },
            preConfirm: () => {
                const fileInput = document.getElementById('replace_file');
                const file = fileInput.files[0];
                
                if (!file) {
                    Swal.showValidationMessage('Please select a file to replace with');
                    return false;
                }
                
                if (file.size > 52428800) { // 50MB
                    Swal.showValidationMessage('File size must be less than 50MB');
                    return false;
                }
                
                return file;
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                this.uploadReplacementFile(evidenceId, result.value);
            }
        });
    }

    /**
     * Load preview of current file
     */
    loadCurrentFilePreview(evidenceId) {
        const previewDiv = document.getElementById('current_file_preview');
        const evidence = this.currentEvidence;
        
        // Check if it's an image
        if (evidence.file_type && evidence.file_type.startsWith('image/')) {
            // Load image preview
            fetch(`${this.apiBase}/evidence/${evidenceId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            })
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                previewDiv.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 150px; object-fit: contain;">`;
            })
            .catch(error => {
                console.error('Error loading preview:', error);
                this.showFileIcon(previewDiv, evidence.file_type);
            });
        } else {
            // Show icon for non-image files
            this.showFileIcon(previewDiv, evidence.file_type);
        }
    }

    /**
     * Preview new file before upload
     */
    previewNewFile(input) {
        const file = input.files[0];
        const previewDiv = document.getElementById('new_file_preview');
        const infoDiv = document.getElementById('new_file_info');
        
        if (!file) {
            previewDiv.innerHTML = `
                <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #d1d5db; margin-bottom: 10px;"></i>
                <span style="color: #9ca3af; font-size: 13px;">No file selected</span>
            `;
            infoDiv.innerHTML = '<em>Select a file to preview</em>';
            return;
        }
        
        // Update file info
        infoDiv.innerHTML = `
            <strong>${escapeHtml(file.name)}</strong><br>
            Size: ${(file.size / 1024).toFixed(2)} KB<br>
            Type: ${file.type || 'Unknown'}
        `;
        
        // Check if it's an image
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewDiv.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 150px; object-fit: contain;">`;
            };
            reader.readAsDataURL(file);
        } else {
            // Show icon for non-image files
            this.showFileIcon(previewDiv, file.type);
        }
    }

    /**
     * Show file icon based on file type
     */
    showFileIcon(container, fileType) {
        let icon = 'fa-file';
        let color = '#6b7280';
        
        if (fileType) {
            if (fileType.startsWith('image/')) {
                icon = 'fa-file-image';
                color = '#3b82f6';
            } else if (fileType.startsWith('video/')) {
                icon = 'fa-file-video';
                color = '#8b5cf6';
            } else if (fileType.startsWith('audio/')) {
                icon = 'fa-file-audio';
                color = '#ec4899';
            } else if (fileType.includes('pdf')) {
                icon = 'fa-file-pdf';
                color = '#ef4444';
            } else if (fileType.includes('word') || fileType.includes('document')) {
                icon = 'fa-file-word';
                color = '#2563eb';
            } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
                icon = 'fa-file-excel';
                color = '#059669';
            } else if (fileType.includes('zip') || fileType.includes('compressed')) {
                icon = 'fa-file-archive';
                color = '#f59e0b';
            }
        }
        
        container.innerHTML = `<i class="fas ${icon}" style="font-size: 48px; color: ${color};"></i>`;
    }

    /**
     * Show file icon in history by file extension
     */
    showHistoryFileIcon(elementId, fileExtension) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let icon = 'fa-file';
        let color = '#6b7280';
        
        // Map file extensions to icons
        const ext = fileExtension.toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
            icon = 'fa-file-image';
            color = '#3b82f6';
        } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
            icon = 'fa-file-video';
            color = '#8b5cf6';
        } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
            icon = 'fa-file-audio';
            color = '#ec4899';
        } else if (ext === 'pdf') {
            icon = 'fa-file-pdf';
            color = '#ef4444';
        } else if (['doc', 'docx'].includes(ext)) {
            icon = 'fa-file-word';
            color = '#2563eb';
        } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
            icon = 'fa-file-excel';
            color = '#059669';
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            icon = 'fa-file-archive';
            color = '#f59e0b';
        } else if (['txt', 'log'].includes(ext)) {
            icon = 'fa-file-alt';
            color = '#6b7280';
        }
        
        element.innerHTML = `<i class="fas ${icon}" style="font-size: 64px; color: ${color};"></i>`;
    }

    /**
     * Load file preview in history modal
     */
    loadHistoryFilePreview(elementId, evidenceId, oldFilePath, isOldVersion, versionId = null) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('[ERROR] Preview element not found:', elementId);
            return;
        }
        
        console.log('[DEBUG] Loading preview:', { elementId, evidenceId, oldFilePath, isOldVersion, versionId });
        
        // For current version (new file)
        if (!isOldVersion) {
            fetch(`${this.apiBase}/evidence/${evidenceId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                element.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Current File" title="Current version">`;
                console.log('[DEBUG] Current file preview loaded');
            })
            .catch(error => {
                console.error('[ERROR] Failed to load current preview:', error);
                element.innerHTML = `<div style="text-align: center;"><i class="fas fa-image" style="font-size: 48px; color: #9ca3af;"></i><br><small style="color: #9ca3af;">Preview unavailable</small></div>`;
            });
        } 
        // For old version
        else if (versionId) {
            // Load old version preview using version ID
            fetch(`${this.apiBase}/evidence/${evidenceId}/download-version/${versionId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                element.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Old Version" title="Previous version">`;
                console.log('[DEBUG] Old version preview loaded');
            })
            .catch(error => {
                console.error('[ERROR] Failed to load old preview:', error);
                element.innerHTML = `<div style="text-align: center; padding: 10px;"><i class="fas fa-image" style="font-size: 48px; color: #9ca3af;"></i><br><small style="color: #6b7280;">Old Version<br>(Preview unavailable)</small></div>`;
            });
        } else {
            // No version ID available
            element.innerHTML = `<div style="text-align: center; padding: 10px;"><i class="fas fa-image" style="font-size: 48px; color: #9ca3af;"></i><br><small style="color: #6b7280;">Old Version<br>(Not available)</small></div>`;
        }
    }

    /**
     * Upload replacement file
     */
    uploadReplacementFile(evidenceId, file) {
        const formData = new FormData();
        formData.append('file', file);

        console.log('[DEBUG] Uploading replacement file:', file.name);

        // Show loading
        Swal.fire({
            title: t('uploading'),
            html: t('please_wait'),
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch(`${this.apiBase}/evidence/${evidenceId}/replace-file`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('[DEBUG] File replacement response:', data);
            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: t('success'),
                    text: t('file_replaced_success'),
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    // Close the edit modal and refresh
                    Swal.close();
                    
                    // Trigger refresh (only for Evidence Management page)
                    if (typeof refreshEvidenceList === 'function') {
                        refreshEvidenceList();
                    }
                    // Note: Don't call loadAllEvidence here as it requires caseId parameter
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: t('error'),
                    text: data.message || t('failed_replace_file')
                });
            }
        })
        .catch(error => {
            console.error('[ERROR] Failed to replace file:', error);
            Swal.fire({
                icon: 'error',
                title: t('error'),
                text: t('failed_replace_file') + ': ' + error.message
            });
        });
    }

    /**
     * Format field name for display
     */
    formatFieldName(fieldName) {
        const names = {
            'title': 'Title',
            'description': 'Description',
            'evidence_type': 'Evidence Type',
            'location_collected': 'Location Collected',
            'is_critical': 'Critical Status',
            'tags': 'Tags',
            'file_name': 'File Name',
            'file_path': 'File Path',
            'file_type': 'File Type',
            'file_size': 'File Size'
        };
        return names[fieldName] || fieldName;
    }

    /**
     * Format field value for display
     */
    formatFieldValue(fieldName, value) {
        if (value === null || value === undefined || value === '') {
            return '<em class="text-muted">(empty)</em>';
        }

        if (fieldName === 'is_critical') {
            return value == '1' ? '<span class="badge badge-danger">Critical</span>' : '<span class="badge badge-secondary">Normal</span>';
        }

        if (fieldName === 'file_size') {
            const sizeKB = parseInt(value) / 1024;
            return sizeKB.toFixed(2) + ' KB';
        }

        if (fieldName === 'file_name') {
            return '<i class="fas fa-file"></i> ' + escapeHtml(value);
        }

        return escapeHtml(value);
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(datetime) {
    if (!datetime) return 'N/A';
    const date = new Date(datetime);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Check if SweetAlert2 is available (preferred)
    if (typeof Swal !== 'undefined') {
        const icon = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
        Swal.fire({
            icon: icon,
            title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
            text: message,
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
        return;
    }
    
    // Fallback to Bootstrap toast if available
    if (typeof $ !== 'undefined' && $.fn.toast) {
        const toastHtml = `
            <div class="toast" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 250px;">
                <div class="toast-header bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} text-white">
                    <strong class="mr-auto">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</strong>
                    <button type="button" class="ml-2 mb-1 close text-white" data-dismiss="toast">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        const $toast = $(toastHtml);
        $('body').append($toast);
        $toast.toast({ delay: 3000 }).toast('show');
        $toast.on('hidden.bs.toast', function() {
            $(this).remove();
        });
        return;
    }
    
    // Ultimate fallback to native alert
    alert(`${type.toUpperCase()}: ${message}`);
}

// Initialize global instance
let evidenceEditManager;
$(document).ready(function() {
    evidenceEditManager = new EvidenceEditManager();
});
