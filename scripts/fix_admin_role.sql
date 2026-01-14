-- Fix administrators table role issue
USE user_database;

-- Update the demo admin to have a valid role
UPDATE administrators 
SET role = 'dvla' 
WHERE admin_id = 'demo-admin-001' AND role = '';

-- Verify the fix
SELECT admin_id, full_name, email, role FROM administrators;
