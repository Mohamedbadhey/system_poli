-- ============================================
-- SEED DATA FOR PCMS
-- Default data for initial system setup
-- ============================================

-- Insert Default Police Center
INSERT INTO police_centers (center_code, center_name, location, gps_latitude, gps_longitude, phone, email, is_active) VALUES
('HQ001', 'Central Police Station', '123 Main Street, Capital City', -1.286389, 36.817223, '+254712345678', 'central@police.gov', 1),
('EAST001', 'East Division Police Station', '456 Eastern Road, Capital City', -1.292066, 36.821946, '+254712345679', 'east@police.gov', 1),
('WEST001', 'West Division Police Station', '789 Western Avenue, Capital City', -1.283333, 36.816667, '+254712345680', 'west@police.gov', 1);

-- Insert Super Admin (Default password: Admin@123456)
-- Password hash for 'Admin@123456' using bcrypt cost 12
INSERT INTO users (center_id, username, email, password_hash, full_name, phone, role, badge_number, is_active) VALUES
(1, 'superadmin', 'superadmin@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'System Administrator', '+254700000001', 'super_admin', 'SA001', 1);

-- Insert Default Admins
INSERT INTO users (center_id, username, email, password_hash, full_name, phone, role, badge_number, is_active, created_by) VALUES
(1, 'admin_central', 'admin.central@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'John Kamau', '+254700000002', 'admin', 'A001', 1, 1),
(2, 'admin_east', 'admin.east@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'Mary Wanjiku', '+254700000003', 'admin', 'A002', 1, 1),
(3, 'admin_west', 'admin.west@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'Peter Omondi', '+254700000004', 'admin', 'A003', 1, 1);

-- Insert OB Officers
INSERT INTO users (center_id, username, email, password_hash, full_name, phone, role, badge_number, is_active, created_by) VALUES
(1, 'ob_officer1', 'ob1@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'James Mwangi', '+254700000005', 'ob_officer', 'OB001', 1, 2),
(2, 'ob_officer2', 'ob2@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'Grace Akinyi', '+254700000006', 'ob_officer', 'OB002', 1, 3);

-- Insert Investigators
INSERT INTO users (center_id, username, email, password_hash, full_name, phone, role, badge_number, is_active, created_by) VALUES
(1, 'investigator1', 'inv1@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'David Kipchoge', '+254700000007', 'investigator', 'INV001', 1, 2),
(1, 'investigator2', 'inv2@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'Sarah Njeri', '+254700000008', 'investigator', 'INV002', 1, 2),
(2, 'investigator3', 'inv3@police.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'Michael Otieno', '+254700000009', 'investigator', 'INV003', 1, 3);

-- Insert Court User
INSERT INTO users (center_id, username, email, password_hash, full_name, phone, role, badge_number, is_active, created_by) VALUES
(1, 'court_user1', 'court1@judiciary.gov', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYNpYnNxN0u', 'Judge Alice Muthoni', '+254700000010', 'court_user', 'CT001', 1, 1);

-- Insert System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('system_name', 'Police Case Management System', 'string', 'System name', 1),
('system_version', '1.0.0', 'string', 'Current system version', 1),
('max_file_upload_size', '52428800', 'integer', 'Maximum file upload size in bytes (50MB)', 0),
('custody_time_limit_hours', '48', 'integer', 'Default custody time limit in hours', 0),
('custody_warning_threshold', '36', 'integer', 'Hours before custody limit to show warning', 0),
('password_expiry_days', '90', 'integer', 'Password expiry period in days', 0),
('session_timeout_minutes', '30', 'integer', 'Session timeout in minutes', 0),
('enable_biometric', '1', 'boolean', 'Enable biometric fingerprint capture', 0),
('enable_gps', '1', 'boolean', 'Enable GPS location capture', 0),
('enable_notifications', '1', 'boolean', 'Enable system notifications', 0),
('court_email', 'court@judiciary.gov', 'string', 'Court system email address', 0),
('evidence_retention_years', '7', 'integer', 'Evidence retention period in years', 0);

-- Insert Document Templates
INSERT INTO document_templates (template_name, template_type, template_content, variables) VALUES
('Investigation Report', 'investigation_report', 
'INVESTIGATION REPORT\n\nCase Number: {{case_number}}\nOB Number: {{ob_number}}\nDate: {{report_date}}\n\nINVESTIGATOR DETAILS:\nName: {{investigator_name}}\nBadge Number: {{investigator_badge}}\n\nCASE SUMMARY:\n{{case_summary}}\n\nFINDINGS:\n{{findings}}\n\nEVIDENCE COLLECTED:\n{{evidence_list}}\n\nCONCLUSION:\n{{conclusion}}\n\nRECOMMENDATION:\n{{recommendation}}\n\nSigned:\n{{investigator_signature}}\nDate: {{signature_date}}',
'["case_number", "ob_number", "report_date", "investigator_name", "investigator_badge", "case_summary", "findings", "evidence_list", "conclusion", "recommendation", "investigator_signature", "signature_date"]'
),
('Court Submission Letter', 'court_submission', 
'COURT SUBMISSION\n\nTo: The Honorable Court\nFrom: {{police_center_name}}\nDate: {{submission_date}}\n\nRe: Case Number {{case_number}} - {{crime_type}}\n\nDear Sir/Madam,\n\nWe hereby submit the investigation file for the above-mentioned case for your kind consideration.\n\nACCUSED: {{accused_names}}\nCRIME: {{crime_type}}\nINCIDENT DATE: {{incident_date}}\n\nAll evidence and investigation reports are attached herewith.\n\nYours faithfully,\n{{admin_name}}\n{{admin_title}}\n{{police_center_name}}',
'["police_center_name", "submission_date", "case_number", "crime_type", "accused_names", "incident_date", "admin_name", "admin_title"]'
);
