-- ============================================================
--  GoSafe Demo Admin Account
--  Compatible with all MySQL versions
--  Password: Demo@123
-- ============================================================

USE user_database;

-- Add approval columns safely using stored procedure workaround
DROP PROCEDURE IF EXISTS gosafe_add_columns;

DELIMITER $$
CREATE PROCEDURE gosafe_add_columns()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'administrators' AND COLUMN_NAME = 'is_approved') THEN
    ALTER TABLE administrators ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'administrators' AND COLUMN_NAME = 'approval_status') THEN
    ALTER TABLE administrators ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'administrators' AND COLUMN_NAME = 'approved_by') THEN
    ALTER TABLE administrators ADD COLUMN approved_by VARCHAR(36) DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'administrators' AND COLUMN_NAME = 'approved_at') THEN
    ALTER TABLE administrators ADD COLUMN approved_at TIMESTAMP NULL;
  END IF;
END$$
DELIMITER ;

CALL gosafe_add_columns();
DROP PROCEDURE IF EXISTS gosafe_add_columns;

-- Remove existing demo admin if present (safe to re-run)
DELETE FROM administrators WHERE email = 'admin@demo.com';

-- Insert demo admin (is_approved = true so login works immediately)
INSERT INTO administrators (
  admin_id,
  full_name,
  email,
  password_hash,
  role,
  dvla_office_id,
  special_id,
  office_number,
  branch_location,
  region,
  is_approved,
  approval_status,
  approved_by,
  approved_at
)
VALUES (
  'DVLA000001',
  'Demo Admin',
  'admin@demo.com',
  '$2b$12$AXruC4acTHZyZNvqOPlcKeeO4Y5lXIyZC6fTjDMOypA9QRalUCFAe',
  'admin',
  (SELECT id FROM dvla_offices LIMIT 1),
  'GSAFE-ADM-001',
  'DVLA-ACC-001',
  'Accra Central',
  'Greater Accra',
  TRUE,
  'approved',
  NULL,
  NULL
);

-- Confirm it was created
SELECT admin_id, full_name, email, is_approved, approval_status, special_id
FROM administrators
WHERE email = 'admin@demo.com';
