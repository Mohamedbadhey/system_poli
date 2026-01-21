-- ============================================
-- POLICE CASE MANAGEMENT SYSTEM - TEST DATA
-- Sample data for testing and development
-- ============================================

-- Insert Police Centers
INSERT INTO police_centers (center_code, center_name, location, gps_latitude, gps_longitude, phone, email, is_active) VALUES
('KSM-001', 'Kismayo Central Police Station', 'Kismayo City Center, Jubaland', -0.3582653, 42.5452803, '+252-61-1234567', 'central@kismayo.police.gov', 1),
('KSM-002', 'Kismayo Port Police Station', 'Port Area, Kismayo', -0.3581100, 42.5491500, '+252-61-1234568', 'port@kismayo.police.gov', 1),
('KSM-003', 'Kismayo Airport Security', 'Kismayo International Airport', -0.3773700, 42.4592300, '+252-61-1234569', 'airport@kismayo.police.gov', 1);

-- Insert Test Users (password for all: 'password123')
-- Password hash: $2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK
INSERT INTO users (center_id, username, email, password_hash, full_name, phone, role, badge_number, is_active, created_by) VALUES
-- Super Admin
(1, 'superadmin', 'superadmin@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Mohamed Ahmed Hassan', '+252-61-1000001', 'super_admin', 'SA-001', 1, NULL),
-- Admins
(1, 'admin1', 'admin1@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Ahmed Omar Ali', '+252-61-1000002', 'admin', 'ADM-001', 1, 1),
(2, 'admin2', 'admin2@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Fatima Hassan Mohamed', '+252-61-1000003', 'admin', 'ADM-002', 1, 1),
-- OB Officers
(1, 'ob_officer1', 'ob1@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Ali Abdi Farah', '+252-61-2000001', 'ob_officer', 'OB-101', 1, 2),
(1, 'ob_officer2', 'ob2@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Amina Mohamed Sheikh', '+252-61-2000002', 'ob_officer', 'OB-102', 1, 2),
(2, 'ob_officer3', 'ob3@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Hassan Ibrahim Yusuf', '+252-61-2000003', 'ob_officer', 'OB-201', 1, 3),
-- Investigators
(1, 'investigator1', 'inv1@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Omar Abdullahi Mohamed', '+252-61-3000001', 'investigator', 'INV-101', 1, 2),
(1, 'investigator2', 'inv2@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Khadija Ali Hassan', '+252-61-3000002', 'investigator', 'INV-102', 1, 2),
(2, 'investigator3', 'inv3@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Abdirahman Mohamed Ali', '+252-61-3000003', 'investigator', 'INV-201', 1, 3),
-- Court User
(1, 'court_user1', 'court1@pcms.gov', '$2y$12$OPoNc4TcBg6KfMgM2.UhDe/NyfMe4ET2Zf.Ev28JgP/01lBQqfFYK', 'Ibrahim Hassan Sheikh', '+252-61-4000001', 'court_user', 'CRT-001', 1, 2);

-- Insert Sample Persons
INSERT INTO persons (person_type, first_name, middle_name, last_name, date_of_birth, gender, national_id, phone, email, address, is_repeat_offender, risk_level, created_by) VALUES
-- Accusers
('accuser', 'Halima', 'Ahmed', 'Mohamed', '1985-05-15', 'female', 'KSM-198505-1234', '+252-61-5000001', 'halima.ahmed@example.com', 'Block A, District 3, Kismayo', 0, 'low', 4),
('accuser', 'Abdi', 'Omar', 'Hassan', '1990-08-20', 'male', 'KSM-199008-2345', '+252-61-5000002', 'abdi.omar@example.com', 'Block B, District 1, Kismayo', 0, 'low', 4),
('accuser', 'Sahra', 'Ibrahim', 'Ali', '1988-03-12', 'female', 'KSM-198803-3456', '+252-61-5000003', NULL, 'Block C, District 2, Kismayo', 0, 'low', 5),
-- Accused
('accused', 'Mohamed', 'Hassan', 'Farah', '1995-11-30', 'male', 'KSM-199511-4567', '+252-61-5000004', NULL, 'Block D, District 4, Kismayo', 1, 'medium', 4),
('accused', 'Ahmed', 'Ali', 'Omar', '1992-07-08', 'male', 'KSM-199207-5678', '+252-61-5000005', NULL, 'Block E, District 5, Kismayo', 0, 'low', 4),
('accused', 'Fatima', 'Abdi', 'Sheikh', '1998-02-25', 'female', 'KSM-199802-6789', NULL, NULL, 'Block F, District 6, Kismayo', 0, 'low', 5),
-- Witnesses
('witness', 'Ali', 'Mohamed', 'Yusuf', '1980-09-10', 'male', 'KSM-198009-7890', '+252-61-5000006', NULL, 'Block G, District 7, Kismayo', 0, 'low', 4),
('witness', 'Mariam', 'Hassan', 'Ibrahim', '1993-12-18', 'female', 'KSM-199312-8901', '+252-61-5000007', NULL, 'Block H, District 8, Kismayo', 0, 'low', 4);

-- Insert Sample Cases
INSERT INTO cases (case_number, ob_number, center_id, incident_date, report_date, incident_location, incident_gps_latitude, incident_gps_longitude, incident_description, crime_type, crime_category, priority, is_sensitive, status, created_by) VALUES
-- Draft Cases
('CASE/KSM-001/2024/0001', 'OB/KSM-001/2024/0001', 1, '2024-12-28 14:30:00', '2024-12-28 16:00:00', 'Market Street, Kismayo City Center', -0.3582653, 42.5452803, 'Theft of mobile phone and cash from a market stall. The victim reported that an unknown person stole her phone (Samsung Galaxy) and 500,000 Somali Shillings while she was attending to customers.', 'Theft', 'property', 'medium', 0, 'draft', 4),
('CASE/KSM-001/2024/0002', 'OB/KSM-001/2024/0002', 1, '2024-12-27 20:15:00', '2024-12-28 08:30:00', 'Residential Area, Block B, District 1', -0.3590000, 42.5460000, 'Assault case reported. Victim claims he was physically assaulted by neighbor during a dispute over property boundaries. Victim sustained minor injuries.', 'Assault', 'violent', 'high', 0, 'draft', 5),
-- Submitted Cases
('CASE/KSM-001/2024/0003', 'OB/KSM-001/2024/0003', 1, '2024-12-26 10:00:00', '2024-12-27 09:00:00', 'Port Area, Warehouse District', -0.3581100, 42.5491500, 'Burglary reported at warehouse. Unknown suspects broke into warehouse overnight and stole electronic goods worth approximately $5,000. Security camera footage available.', 'Burglary', 'property', 'high', 0, 'submitted', 4),
-- Approved Cases
('CASE/KSM-001/2024/0004', 'OB/KSM-001/2024/0004', 1, '2024-12-25 16:45:00', '2024-12-26 10:00:00', 'Main Road, Near Central Mosque', -0.3575000, 42.5445000, 'Vehicle accident resulting in injury. Driver lost control and hit pedestrian. Victim transported to hospital with non-life-threatening injuries. Driver claims mechanical failure.', 'Traffic Accident', 'other', 'medium', 0, 'approved', 4),
-- Investigating Cases
('CASE/KSM-002/2024/0001', 'OB/KSM-002/2024/0001', 2, '2024-12-20 13:00:00', '2024-12-21 08:00:00', 'Port Security Checkpoint', -0.3582000, 42.5492000, 'Attempted smuggling of contraband goods discovered during routine inspection. Suspect detained and goods seized. Investigation ongoing to identify accomplices.', 'Smuggling', 'other', 'critical', 1, 'investigating', 6);

-- Insert Case Parties (Link persons to cases)
INSERT INTO case_parties (case_id, person_id, party_role, is_primary, statement_date) VALUES
-- Case 1 parties
(1, 1, 'accuser', 1, '2024-12-28 16:30:00'),
(1, 7, 'witness', 0, '2024-12-28 16:45:00'),
-- Case 2 parties
(2, 2, 'accuser', 1, '2024-12-28 09:00:00'),
(2, 4, 'accused', 1, NULL),
(2, 8, 'witness', 0, '2024-12-28 09:30:00'),
-- Case 3 parties
(3, 3, 'accuser', 1, '2024-12-27 10:00:00'),
(3, 5, 'accused', 1, NULL),
-- Case 4 parties
(4, 1, 'accuser', 1, '2024-12-26 11:00:00'),
(4, 6, 'accused', 1, '2024-12-26 11:30:00'),
-- Case 5 parties
(5, 2, 'accuser', 1, '2024-12-21 09:00:00'),
(5, 4, 'accused', 1, '2024-12-21 10:00:00');

-- Insert Case Assignments
INSERT INTO case_assignments (case_id, investigator_id, assigned_by, assigned_at, deadline, is_lead_investigator, status) VALUES
(5, 9, 3, '2024-12-22 10:00:00', '2025-01-15 23:59:59', 1, 'active');

-- Insert Case Status History
INSERT INTO case_status_history (case_id, previous_status, new_status, changed_by, reason) VALUES
(3, 'draft', 'submitted', 4, 'Case ready for review'),
(4, 'draft', 'submitted', 4, 'Case ready for review'),
(4, 'submitted', 'approved', 2, 'Case approved for investigation'),
(5, 'draft', 'submitted', 6, 'Case ready for review'),
(5, 'submitted', 'approved', 3, 'Case approved for investigation'),
(5, 'approved', 'assigned', 3, 'Investigator assigned'),
(5, 'assigned', 'investigating', 9, 'Investigation started');

-- Insert Sample Custody Record
INSERT INTO custody_records (case_id, person_id, center_id, custody_status, custody_location, cell_number, custody_start, expected_release_date, arrest_warrant_number, legal_time_limit, health_status, created_by) VALUES
(5, 4, 2, 'in_custody', 'Port Police Station Detention Center', 'CELL-A-01', '2024-12-21 11:00:00', '2024-12-29 11:00:00', 'AW-2024-12-001', 192, 'good', 6);

-- Insert Custody Daily Logs
INSERT INTO custody_daily_logs (custody_record_id, log_date, log_time, custody_status, location, health_check_done, health_status, meal_provided, exercise_allowed, logged_by) VALUES
(1, '2024-12-21', '08:00:00', 'in_custody', 'Port Police Station Detention Center', 1, 'good', 1, 0, 6),
(1, '2024-12-21', '20:00:00', 'in_custody', 'Port Police Station Detention Center', 1, 'good', 1, 0, 6),
(1, '2024-12-22', '08:00:00', 'in_custody', 'Port Police Station Detention Center', 1, 'good', 1, 1, 6),
(1, '2024-12-22', '20:00:00', 'in_custody', 'Port Police Station Detention Center', 1, 'good', 1, 0, 6);

-- Insert Sample Evidence
INSERT INTO evidence (case_id, evidence_number, evidence_type, description, collection_date, collected_by, storage_location, chain_of_custody, status) VALUES
(5, 'EV/KSM-002/2024/0001-001', 'physical', 'Seized contraband goods - 15 boxes of undeclared electronics', '2024-12-21 14:00:00', 9, 'Evidence Room A, Port Station', 'Initial collection by INV-201', 'stored');

-- Insert Evidence Custody Log
INSERT INTO evidence_custody_log (evidence_id, action, performed_by, location, notes) VALUES
(1, 'collected', 9, 'Port Security Checkpoint', 'Evidence collected during inspection'),
(1, 'stored', 9, 'Evidence Room A, Port Station', 'Secured in evidence room');

-- Insert Sample Notifications
INSERT INTO notifications (user_id, notification_type, title, message, link_entity_type, link_entity_id, priority) VALUES
(2, 'approval_required', 'Case Pending Approval', 'Case CASE/KSM-001/2024/0003 has been submitted for approval', 'cases', 3, 'medium'),
(9, 'case_assigned', 'New Case Assigned', 'You have been assigned to Case CASE/KSM-002/2024/0001 as lead investigator', 'cases', 5, 'high'),
(6, 'custody_alert', 'Custody Time Limit Warning', 'Custody record for person Mohamed Hassan Farah approaching legal time limit', 'custody_records', 1, 'high');

-- Insert System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('system_name', 'Police Case Management System - Kismayo', 'string', 'System display name', 1),
('max_custody_hours', '192', 'integer', 'Maximum custody hours allowed by law', 0),
('evidence_retention_years', '10', 'integer', 'Evidence retention period in years', 0),
('enable_biometric', 'true', 'boolean', 'Enable biometric fingerprint features', 0),
('enable_notifications', 'true', 'boolean', 'Enable system notifications', 0);

-- Insert Sample Audit Logs
INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, description, ip_address, request_method) VALUES
(4, 'ob_officer1', 'CREATE', 'cases', 1, 'Created new case CASE/KSM-001/2024/0001', '192.168.1.100', 'POST'),
(4, 'ob_officer1', 'UPDATE', 'cases', 3, 'Submitted case CASE/KSM-001/2024/0003 for approval', '192.168.1.100', 'POST'),
(2, 'admin1', 'UPDATE', 'cases', 4, 'Approved case CASE/KSM-001/2024/0004', '192.168.1.101', 'POST'),
(9, 'investigator3', 'CREATE', 'evidence', 1, 'Added evidence to case CASE/KSM-002/2024/0001', '192.168.1.102', 'POST');

COMMIT;

-- ============================================
-- SEED DATA SUMMARY
-- ============================================
-- Police Centers: 3
-- Users: 11 (1 super admin, 2 admins, 3 OB officers, 3 investigators, 1 court user)
-- Persons: 8 (3 accusers, 3 accused, 2 witnesses)
-- Cases: 5 (various statuses)
-- Case Parties: 11
-- Case Assignments: 1
-- Custody Records: 1
-- Evidence: 1
-- Notifications: 3
-- 
-- Test Login Credentials (all passwords: password123):
-- - superadmin / password123
-- - admin1 / password123
-- - ob_officer1 / password123
-- - investigator1 / password123
-- - court_user1 / password123
-- ============================================
