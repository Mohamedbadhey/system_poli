-- ========================================
-- REPORTS SYSTEM DATABASE MIGRATION
-- Police Case Management System (PCMS)
-- Date: 2026-01-10
-- ========================================

-- ========================================
-- PART 1: ENHANCE INVESTIGATION_REPORTS TABLE
-- ========================================

-- Add new columns to investigation_reports table
ALTER TABLE `investigation_reports` 
ADD COLUMN `report_subtype` VARCHAR(50) NULL AFTER `report_type`,
ADD COLUMN `period_covered_from` DATE NULL AFTER `report_subtype`,
ADD COLUMN `period_covered_to` DATE NULL AFTER `period_covered_from`,
ADD COLUMN `court_reference_number` VARCHAR(100) NULL AFTER `period_covered_to`,
ADD COLUMN `charges_preferred` JSON NULL AFTER `court_reference_number`,
ADD COLUMN `case_strength` ENUM('weak', 'moderate', 'strong', 'conclusive') NULL AFTER `charges_preferred`,
ADD COLUMN `recommended_action` VARCHAR(100) NULL AFTER `case_strength`,
ADD COLUMN `approval_status` ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft' AFTER `recommended_action`,
ADD COLUMN `approved_by` INT(10) UNSIGNED NULL AFTER `approval_status`,
ADD COLUMN `approved_at` DATETIME NULL AFTER `approved_by`,
ADD COLUMN `court_order_reference` VARCHAR(100) NULL AFTER `approved_at`,
ADD COLUMN `metadata` JSON NULL COMMENT 'Additional structured data for specific report types' AFTER `court_order_reference`,
ADD COLUMN `updated_at` DATETIME NULL AFTER `metadata`;

-- Add foreign key for approved_by
ALTER TABLE `investigation_reports`
ADD CONSTRAINT `fk_reports_approved_by` 
FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- PART 2: CREATE REPORT_APPROVALS TABLE
-- ========================================

CREATE TABLE `report_approvals` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id` INT(10) UNSIGNED NOT NULL,
  `approver_id` INT(10) UNSIGNED NOT NULL,
  `approval_level` ENUM('investigator', 'supervisor', 'commander', 'prosecutor') DEFAULT 'supervisor',
  `status` ENUM('pending', 'approved', 'rejected', 'revision_requested') DEFAULT 'pending',
  `comments` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_report_id` (`report_id`),
  INDEX `idx_approver_id` (`approver_id`),
  INDEX `idx_status` (`status`),
  CONSTRAINT `fk_report_approvals_report` 
    FOREIGN KEY (`report_id`) REFERENCES `investigation_reports`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_report_approvals_approver` 
    FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PART 3: CREATE COURT_COMMUNICATIONS TABLE
-- ========================================

CREATE TABLE `court_communications` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `case_id` INT(10) UNSIGNED NOT NULL,
  `report_id` INT(10) UNSIGNED NULL,
  `communication_type` ENUM('submission', 'response', 'hearing_notice', 'directive', 'verdict', 'adjournment', 'order') DEFAULT 'submission',
  `court_reference` VARCHAR(100) NULL,
  `communication_date` DATE NOT NULL,
  `received_from` VARCHAR(100) NULL,
  `sent_to` VARCHAR(100) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `summary` TEXT NULL,
  `document_path` VARCHAR(255) NULL,
  `created_by` INT(10) UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_case_id` (`case_id`),
  INDEX `idx_report_id` (`report_id`),
  INDEX `idx_communication_date` (`communication_date`),
  INDEX `idx_communication_type` (`communication_type`),
  CONSTRAINT `fk_court_comm_case` 
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_court_comm_report` 
    FOREIGN KEY (`report_id`) REFERENCES `investigation_reports`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_court_comm_created_by` 
    FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PART 4: ENHANCE DOCUMENT_TEMPLATES TABLE
-- ========================================

-- Add new columns to document_templates table
ALTER TABLE `document_templates`
ADD COLUMN `report_category` VARCHAR(50) NULL AFTER `template_type`,
ADD COLUMN `required_sections` JSON NULL AFTER `variables`,
ADD COLUMN `optional_sections` JSON NULL AFTER `required_sections`;

-- ========================================
-- PART 5: INSERT REPORT TEMPLATES
-- ========================================

-- 1. Preliminary Investigation Report (PIR)
INSERT INTO `document_templates` 
(`template_name`, `template_type`, `report_category`, `template_content`, `variables`, `required_sections`, `optional_sections`, `is_active`, `created_at`) 
VALUES (
'Preliminary Investigation Report (PIR)',
'preliminary',
'investigation',
'PRELIMINARY INVESTIGATION REPORT (PIR)

CASE IDENTIFICATION
Case Number: {{case_number}}
OB Number: {{ob_number}}
Report Date: {{report_date}}

INVESTIGATING OFFICER
Name: {{investigator_name}}
Badge Number: {{investigator_badge}}
Contact: {{investigator_phone}}
Station: {{police_center_name}}

CASE OVERVIEW
Crime Type: {{crime_type}}
Crime Category: {{crime_category}}
Incident Date: {{incident_date}}
Incident Time: {{incident_time}}
Location: {{incident_location}}
Priority Level: {{priority}}
Sensitive Case: {{is_sensitive}}

INCIDENT DESCRIPTION
{{incident_description}}

INITIAL ASSESSMENT

Parties Involved:
- Accused: {{total_accused}}
{{accused_list}}

- Victims/Complainants: {{total_accusers}}
{{accuser_list}}

- Witnesses: {{total_witnesses}}
{{witness_list}}

Initial Evidence Collected:
Total Items: {{total_evidence}}
{{evidence_list}}

PRELIMINARY FINDINGS
[To be completed by investigator - Initial observations and assessment]

INVESTIGATIVE PLAN
[To be completed by investigator - Planned activities and timeline]

1. Planned Interviews:
2. Evidence to Collect:
3. Scene Examination:
4. Forensic Analysis Required:

RESOURCE REQUIREMENTS
[Equipment, personnel, budget needs]

RISK ASSESSMENT
Flight Risk: [Assessment]
Public Safety Risk: [Assessment]
Evidence Degradation Risk: [Assessment]

NEXT STEPS
[Immediate actions to be taken]

Timeline Estimate: [Days/Weeks]

___________________________
{{investigator_name}}
{{investigator_badge}}
Date: {{report_date}}

SUPERVISOR APPROVAL
___________________________
Name: 
Date:',
JSON_ARRAY('case_number', 'ob_number', 'crime_type', 'incident_date', 'incident_location', 'accused_names', 'accuser_names', 'witness_names', 'investigator_name', 'investigator_badge', 'police_center_name', 'report_date', 'total_evidence'),
JSON_ARRAY('case_overview', 'initial_assessment', 'investigative_plan'),
JSON_ARRAY('resource_requirements', 'risk_assessment'),
1,
NOW()
);

-- 2. Interim Progress Report
INSERT INTO `document_templates` 
(`template_name`, `template_type`, `report_category`, `template_content`, `variables`, `required_sections`, `optional_sections`, `is_active`, `created_at`) 
VALUES (
'Interim Progress Report',
'interim',
'investigation',
'INTERIM PROGRESS REPORT

CASE IDENTIFICATION
Case Number: {{case_number}}
OB Number: {{ob_number}}
Report Date: {{report_date}}
Reporting Period: [Start Date] to [End Date]

INVESTIGATING OFFICER
Name: {{investigator_name}}
Badge Number: {{investigator_badge}}
Station: {{police_center_name}}

INVESTIGATION PROGRESS SUMMARY
Current Status: {{case_status}}
Progress Percentage: [%]

ACTIVITIES COMPLETED DURING PERIOD

1. Interviews Conducted:
   [Details]

2. Evidence Collected:
   New Items: [Number]
   {{evidence_list}}

3. Scene Visits:
   [Details]

4. Forensic Analysis:
   [Details]

5. Follow-up Actions:
   [Details]

LEADS FOLLOWED AND OUTCOMES
[Details of investigative leads]

CHALLENGES ENCOUNTERED
[Any obstacles or difficulties]

WITNESS STATEMENTS STATUS
Total Witnesses: {{total_witnesses}}
Statements Obtained: [Number]
Pending: [Number]

CUSTODY STATUS (if applicable)
[Details of accused in custody]

NEXT INVESTIGATIVE STEPS
1.
2.
3.

TIMELINE UPDATE
Original Deadline: [Date]
Revised Estimate: [Date if changed]
Reason for Change: [If applicable]

BUDGET STATUS (if applicable)
Allocated: [Amount]
Spent: [Amount]
Remaining: [Amount]

___________________________
{{investigator_name}}
{{investigator_badge}}
Date: {{report_date}}',
JSON_ARRAY('case_number', 'ob_number', 'crime_type', 'incident_date', 'incident_location', 'accused_names', 'accuser_names', 'witness_names', 'investigator_name', 'investigator_badge', 'police_center_name', 'report_date', 'total_evidence'),
JSON_ARRAY('progress_summary', 'activities_completed', 'next_steps'),
JSON_ARRAY('challenges', 'budget_status'),
1,
NOW()
);

-- 3. Final Investigation Report (FIR)
INSERT INTO `document_templates` 
(`template_name`, `template_type`, `report_category`, `template_content`, `variables`, `required_sections`, `optional_sections`, `is_active`, `created_at`) 
VALUES (
'Final Investigation Report (FIR)',
'final',
'investigation',
'FINAL INVESTIGATION REPORT (FIR)

CASE IDENTIFICATION
Case Number: {{case_number}}
OB Number: {{ob_number}}
Report Date: {{report_date}}

INVESTIGATING OFFICER
Name: {{investigator_name}}
Badge Number: {{investigator_badge}}
Station: {{police_center_name}}
Contact: {{investigator_phone}}

EXECUTIVE SUMMARY
[Brief overview of the investigation and key findings]

CASE BACKGROUND
Crime: {{crime_type}} ({{crime_category}})
Incident Date: {{incident_date}}
Location: {{incident_location}}
Priority: {{priority}}
Sensitive: {{is_sensitive}}

INCIDENT DESCRIPTION
{{incident_description}}

PARTIES INVOLVED

THE ACCUSED:
{{accused_list}}

THE VICTIMS/COMPLAINANTS:
{{accuser_list}}

WITNESSES:
{{witness_list}}

INVESTIGATION ACTIVITIES CONDUCTED
[Chronological summary of investigation]

1. Initial Response:
2. Scene Examination:
3. Interviews:
4. Evidence Collection:
5. Forensic Analysis:

EVIDENCE SUMMARY
Total Evidence Items: {{total_evidence}}
Critical Evidence: {{critical_evidence_count}}

Detailed Evidence List:
{{evidence_list}}

Evidence Analysis:
[Analysis of key evidence and its significance]

WITNESS TESTIMONIES
[Summary of witness statements and credibility assessment]

SUSPECT ANALYSIS
[Detailed analysis of accused involvement]

Motive: [Analysis]
Means: [Analysis]
Opportunity: [Analysis]
Alibi Verification: [Results]

FINDINGS AND CONCLUSIONS

Key Findings:
1.
2.
3.

Evidence Links Suspect to Crime:
[Details]

Conclusion:
[Professional assessment of the case]

INVESTIGATOR OPINION
Case Strength: [Weak/Moderate/Strong/Conclusive]
Recommendation: [Prosecute/Dismiss/Further Investigation]

RECOMMENDATIONS

Recommended Charges:
1.
2.

Prosecution Strategy:
[Suggestions for prosecution]

Additional Actions Required:
[If any]

APPENDICES
A. Evidence List with Photos
B. Witness Statement Summaries
C. Forensic Reports
D. Scene Diagrams/Maps
E. Timeline of Events

Investigation Duration: [Days]
Total Evidence Collected: {{total_evidence}}
Total Witnesses: {{total_witnesses}}

CERTIFICATION
I hereby certify that this report is a true and accurate account of the investigation conducted.

___________________________
{{investigator_name}}
Investigating Officer
Badge: {{investigator_badge}}
Date: {{report_date}}

SIGNATURE: _________________

COMMANDER APPROVAL
___________________________
Name:
Rank:
Date:
Signature: _________________',
JSON_ARRAY('case_number', 'ob_number', 'crime_type', 'incident_date', 'incident_location', 'accused_names', 'accuser_names', 'witness_names', 'investigator_name', 'investigator_badge', 'police_center_name', 'report_date', 'total_evidence'),
JSON_ARRAY('executive_summary', 'findings', 'evidence_summary', 'conclusions', 'recommendations'),
JSON_ARRAY('timeline', 'costs'),
1,
NOW()
);

-- 4. Court Submission Docket
INSERT INTO `document_templates` 
(`template_name`, `template_type`, `report_category`, `template_content`, `variables`, `required_sections`, `optional_sections`, `is_active`, `created_at`) 
VALUES (
'Court Submission Docket',
'court_submission',
'court',
'COURT SUBMISSION DOCKET

TO: THE HONORABLE COURT
FROM: {{police_center_name}}
DATE: {{report_date}}

RE: CASE NUMBER {{case_number}} - {{crime_type}}

CASE IDENTIFICATION
Police Case Number: {{case_number}}
OB Number: {{ob_number}}
Court Reference: [To be assigned by court]

COMPLAINANT/VICTIM DETAILS
{{accuser_list}}

ACCUSED PERSON(S) DETAILS
{{accused_list}}

CHARGES PREFERRED
[List of specific criminal code sections violated]

1. Charge: [Criminal Code Section]
   Particulars: [Details]

2. Charge: [If multiple charges]
   Particulars: [Details]

BRIEF FACTS OF THE CASE
On {{incident_date}} at approximately {{incident_time}}, at {{incident_location}}, the following incident occurred:

{{incident_description}}

[Narrative of events leading to the charges]

DATE, TIME, AND PLACE OF OFFENSE
Date: {{incident_date}}
Time: {{incident_time}}
Place: {{incident_location}}

INVESTIGATING OFFICER DETAILS
Name: {{investigator_name}}
Badge Number: {{investigator_badge}}
Station: {{police_center_name}}
Contact: {{investigator_phone}}

EVIDENCE SUMMARY
Total Exhibits: {{total_evidence}}
Critical Evidence: {{critical_evidence_count}}

List of Exhibits to be Presented:
{{evidence_list}}

PROSECUTION WITNESSES
Total Witnesses: {{total_witnesses}}

List of Witnesses:
{{witness_list}}

ATTACHED DOCUMENTS
1. Final Investigation Report
2. Evidence List with Chain of Custody
3. Witness Statements
4. Forensic Reports (if any)
5. Medical Reports (if applicable)
6. Scene Photographs

PRAYER FOR COURT ACTION
We hereby submit this case file for your kind consideration and request that:
1. The accused be formally charged as per the charges preferred
2. The case be set for hearing
3. [Any other specific requests]

STATION COMMANDER APPROVAL
This submission is approved and forwarded to the Honorable Court.

___________________________
Commander Name:
Badge Number:
Signature:
Date:

Official Stamp:
{{police_center_name}}',
JSON_ARRAY('case_number', 'ob_number', 'crime_type', 'incident_date', 'incident_location', 'accused_names', 'accuser_names', 'witness_names', 'investigator_name', 'investigator_badge', 'police_center_name', 'report_date', 'total_evidence'),
JSON_ARRAY('case_identification', 'charges', 'accused_details', 'brief_facts', 'evidence_list', 'witness_list'),
JSON_ARRAY('prayer_for_relief'),
1,
NOW()
);

-- 5. Evidence Presentation Report (Exhibit List)
INSERT INTO `document_templates` 
(`template_name`, `template_type`, `report_category`, `template_content`, `variables`, `required_sections`, `optional_sections`, `is_active`, `created_at`) 
VALUES (
'Evidence Presentation Report (Exhibit List)',
'investigation_report',
'court',
'EVIDENCE PRESENTATION REPORT
EXHIBIT LIST FOR COURT

CASE IDENTIFICATION
Case Number: {{case_number}}
OB Number: {{ob_number}}
Court Reference: [Court assigned number]
Date: {{report_date}}

INVESTIGATING OFFICER
Name: {{investigator_name}}
Badge Number: {{investigator_badge}}
Station: {{police_center_name}}

EVIDENCE SUMMARY
Total Exhibits: {{total_evidence}}
Physical Evidence: {{evidence_physical_count}}
Digital Evidence: {{evidence_digital_count}}
Documentary Evidence: {{evidence_document_count}}
Critical Evidence Items: {{critical_evidence_count}}

COMPLETE EXHIBIT LIST

{{evidence_list}}

CHAIN OF CUSTODY CERTIFICATION
All evidence items have been handled according to standard procedures.
Chain of custody has been maintained throughout.

Evidence Storage Location: [Details]
Evidence Custodian: [Name and Badge]

EVIDENCE AUTHENTICATION
All digital evidence has been authenticated and verified.
All physical evidence has been properly tagged and secured.
All documents have been verified for authenticity.

FORENSIC ANALYSIS SUMMARY
[Summary of any forensic examinations performed]

EXPERT WITNESS RECOMMENDATIONS
The following expert witnesses may be required to authenticate evidence:
1. [Expert name and field - if applicable]
2. [Expert name and field - if applicable]

EVIDENCE HANDLING INSTRUCTIONS FOR COURT
[Special handling requirements for sensitive evidence]

CERTIFICATION
I certify that the evidence listed above has been collected, preserved, and documented according to proper procedures and is ready for presentation to the court.

___________________________
{{investigator_name}}
Evidence Officer
Badge: {{investigator_badge}}
Date: {{report_date}}

Signature: _________________',
JSON_ARRAY('case_number', 'ob_number', 'crime_type', 'incident_date', 'incident_location', 'accused_names', 'accuser_names', 'witness_names', 'investigator_name', 'investigator_badge', 'police_center_name', 'report_date', 'total_evidence'),
JSON_ARRAY('exhibit_list', 'chain_of_custody', 'authentication'),
JSON_ARRAY('expert_opinions'),
1,
NOW()
);

-- 6. Supplementary Investigation Report
INSERT INTO `document_templates` 
(`template_name`, `template_type`, `report_category`, `template_content`, `variables`, `required_sections`, `optional_sections`, `is_active`, `created_at`) 
VALUES (
'Supplementary Investigation Report',
'investigation_report',
'investigation',
'SUPPLEMENTARY INVESTIGATION REPORT

CASE IDENTIFICATION
Case Number: {{case_number}}
OB Number: {{ob_number}}
Court Reference: [Court number]
Report Date: {{report_date}}

COURT DIRECTIVE REFERENCE
Court Order Date: [Date]
Order Number: [If applicable]
Assigned Back Date: [Date]
Deadline: [Date]

INVESTIGATING OFFICER
Name: {{investigator_name}}
Badge Number: {{investigator_badge}}
Station: {{police_center_name}}

COURT''S SPECIFIC QUERIES/DIRECTIVES
[List of specific issues court raised or requested investigation on]

1.
2.
3.

ADDITIONAL INVESTIGATION CONDUCTED

Period: [Start Date] to [End Date]

Activities:
1. [Activity and date]
2. [Activity and date]

NEW EVIDENCE OBTAINED
[Details of new evidence collected]

{{evidence_list}}

NEW WITNESS STATEMENTS
[Details of additional witnesses interviewed]

ANALYSIS OF NEW FINDINGS
[How new information relates to court''s queries]

Response to Court Query #1:
[Detailed response]

Response to Court Query #2:
[Detailed response]

UPDATED CONCLUSIONS
[Any changes to original conclusions based on new information]

COMPLIANCE STATEMENT
All directives from the Honorable Court have been fully complied with.
All requested investigations have been completed.
All questions raised have been addressed.

ATTACHMENTS
1. New evidence items
2. Additional witness statements
3. Updated exhibits list
4. Any additional documentation

CHALLENGES ENCOUNTERED (if any)
[Any difficulties in completing court''s directives]

RECOMMENDATIONS
[Any new recommendations based on supplementary investigation]

___________________________
{{investigator_name}}
Investigating Officer
Badge: {{investigator_badge}}
Date: {{report_date}}

Signature: _________________

COMMANDER APPROVAL
___________________________
Name:
Date:
Signature: _________________',
JSON_ARRAY('case_number', 'ob_number', 'crime_type', 'incident_date', 'incident_location', 'accused_names', 'accuser_names', 'witness_names', 'investigator_name', 'investigator_badge', 'police_center_name', 'report_date', 'total_evidence'),
JSON_ARRAY('court_directive', 'additional_investigation', 'new_findings', 'compliance_statement'),
JSON_ARRAY('challenges_encountered'),
1,
NOW()
);

-- 7. Case Closure Report
INSERT INTO `document_templates` 
(`template_name`, `template_type`, `report_category`, `template_content`, `variables`, `required_sections`, `optional_sections`, `is_active`, `created_at`) 
VALUES (
'Case Closure Report',
'other',
'closure',
'CASE CLOSURE REPORT

CASE IDENTIFICATION
Case Number: {{case_number}}
OB Number: {{ob_number}}
Closure Date: {{report_date}}

INVESTIGATING OFFICER
Name: {{investigator_name}}
Badge Number: {{investigator_badge}}
Station: {{police_center_name}}

CASE SUMMARY
Crime: {{crime_type}} ({{crime_category}})
Incident Date: {{incident_date}}
Report Date: [Original date]
Closure Date: {{report_date}}

CASE OUTCOME
Outcome: [Convicted/Acquitted/Dismissed/Withdrawn/Settled]
Court Verdict Date: [Date]
Case Number: [Final court case number]

VERDICT DETAILS
[Summary of court verdict or closure reason]

Accused: {{accused_names}}
Verdict: [Details for each accused]
Sentence: [If conviction - details of sentence]

CASE TIMELINE
Investigation Duration: [Total days from report to closure]

Key Milestones:
- Case Reported: [Date]
- Investigation Started: [Date]
- Investigation Completed: [Date]
- Submitted to Court: [Date]
- Trial Commenced: [Date]
- Verdict: [Date]
- Case Closed: [Date]

INVESTIGATION STATISTICS
Total Evidence Items: {{total_evidence}}
Total Witnesses: {{total_witnesses}}
Number of Accused: {{total_accused}}
Investigation Duration: [Days]
Court Duration: [Days]

EVIDENCE DISPOSITION
Total Evidence Items: {{total_evidence}}

Evidence Status:
- Returned to Owner: [Number]
- Retained for Appeals: [Number]
- Destroyed: [Number]
- Archived: [Number]

Evidence Disposal Plan:
[Details of how evidence will be handled]

COSTS INCURRED (if tracked)
Investigation Costs: [Amount]
Court Costs: [Amount]
Total: [Amount]

APPEALS STATUS
Appeal Filed: [Yes/No]
Appeal Details: [If applicable]

LESSONS LEARNED
[Key takeaways from this case]

1.
2.
3.

INVESTIGATION QUALITY ASSESSMENT
Case Strength: [Assessment]
Evidence Quality: [Assessment]
Investigation Efficiency: [Assessment]

Areas of Excellence:
[What went well]

Areas for Improvement:
[What could be improved]

FOLLOW-UP ACTIONS REQUIRED
[Any pending actions]

1.
2.

CASE ARCHIVAL INFORMATION
Archive Location: [Physical/Digital location]
Retention Period: [Years - typically 7 years]
Archive Date: {{report_date}}
Destruction Date: [Date after retention period]

FINAL NOTES
[Any additional information for record]

CERTIFICATION
This case is hereby officially closed and archived.

___________________________
{{investigator_name}}
Investigating Officer
Badge: {{investigator_badge}}
Date: {{report_date}}

Signature: _________________

STATION COMMANDER APPROVAL
___________________________
Name:
Rank:
Date:
Signature: _________________

Official Stamp:
{{police_center_name}}',
JSON_ARRAY('case_number', 'ob_number', 'crime_type', 'incident_date', 'incident_location', 'accused_names', 'accuser_names', 'witness_names', 'investigator_name', 'investigator_badge', 'police_center_name', 'report_date', 'total_evidence'),
JSON_ARRAY('outcome', 'verdict_details', 'duration', 'lessons_learned', 'evidence_disposal'),
JSON_ARRAY('costs', 'appeals_status'),
1,
NOW()
);

-- ========================================
-- PART 6: CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Indexes on investigation_reports
CREATE INDEX `idx_reports_case_type` ON `investigation_reports`(`case_id`, `report_type`);
CREATE INDEX `idx_reports_approval_status` ON `investigation_reports`(`approval_status`);
CREATE INDEX `idx_reports_created_at` ON `investigation_reports`(`created_at`);

-- Indexes on report_approvals
CREATE INDEX `idx_approvals_created_at` ON `report_approvals`(`created_at`);

-- Indexes on court_communications
CREATE INDEX `idx_court_comm_case_date` ON `court_communications`(`case_id`, `communication_date`);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Verify the migration
SELECT 'Reports System Migration Completed Successfully!' AS Status;

-- Show table structures
SHOW COLUMNS FROM `investigation_reports`;
SHOW COLUMNS FROM `report_approvals`;
SHOW COLUMNS FROM `court_communications`;
SHOW COLUMNS FROM `document_templates`;

-- Show template count
SELECT COUNT(*) AS 'Template Count' FROM `document_templates` WHERE `report_category` IN ('investigation', 'court', 'closure');
