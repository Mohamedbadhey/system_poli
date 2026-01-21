-- Add witness affiliation fields to case_parties table
-- This allows tracking whether a witness supports a specific accuser, accused, or is neutral

ALTER TABLE case_parties 
ADD COLUMN witness_affiliation ENUM('accuser', 'accused', 'neutral') DEFAULT 'neutral' 
AFTER is_primary;

-- Add foreign key to link witness to specific person they support
ALTER TABLE case_parties 
ADD COLUMN affiliated_person_id INT(11) UNSIGNED NULL 
AFTER witness_affiliation;

-- Add foreign key constraint
ALTER TABLE case_parties 
ADD CONSTRAINT fk_affiliated_person 
FOREIGN KEY (affiliated_person_id) REFERENCES persons(id) 
ON DELETE SET NULL;

-- Add indexes
ALTER TABLE case_parties 
ADD INDEX idx_witness_affiliation (witness_affiliation);

ALTER TABLE case_parties 
ADD INDEX idx_affiliated_person (affiliated_person_id);

-- Update existing witnesses to be neutral by default
UPDATE case_parties 
SET witness_affiliation = 'neutral' 
WHERE party_role = 'witness' AND witness_affiliation IS NULL;
