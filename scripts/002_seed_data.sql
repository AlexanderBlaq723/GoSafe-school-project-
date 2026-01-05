-- GoSafe System Seed Data for MySQL
-- Sample data for testing and demonstration

-- Insert sample passengers
INSERT INTO passengers (passenger_id, full_name, phone_number, email, password_hash, location) VALUES
(UUID(), 'Jane Mensah', '0241234567', 'jane.mensah@example.com', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'Accra'),
(UUID(), 'Kwame Osei', '0242345678', 'kwame.osei@example.com', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'Kumasi'),
(UUID(), 'Ama Asante', '0243456789', 'ama.asante@example.com', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'Tema');

-- Insert sample drivers with license validation
INSERT INTO drivers (driver_id, full_name, phone_number, email, password_hash, license_number, vehicle_number, availability_status, location, transport_company) VALUES
(UUID(), 'John Boateng', '0551234567', 'john.boateng@example.com', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'DL-2023-001234', 'GT-1234-20', 'available', 'Accra', 'Metro Mass Transit'),
(UUID(), 'Emmanuel Nkrumah', '0552345678', 'emmanuel.nkrumah@example.com', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'DL-2023-005678', 'GT-5678-21', 'busy', 'Kumasi', 'VIP Transport'),
(UUID(), 'Samuel Agyeman', '0553456789', 'samuel.agyeman@example.com', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'DL-2022-009876', 'GT-9876-19', 'available', 'Takoradi', 'ABC Transport');

-- Insert sample administrators
INSERT INTO administrators (admin_id, full_name, email, password_hash, role, department) VALUES
(UUID(), 'Dr. Isaac Owusu', 'isaac.owusu@dvla.gov.gh', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'dvla', 'Vehicle Registration'),
(UUID(), 'Sergeant Akua Addae', 'akua.addae@mttd.gov.gh', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'mttd', 'Traffic Enforcement'),
(UUID(), 'Eng. Yaw Frimpong', 'yaw.frimpong@urbanroads.gov.gh', '$2a$10$rKZvVXnfwCE7mYKpL8p7Ee8tZvvMYWz0FzKvVXnfwCE7mYKpL8p7E', 'urban_roads', 'Road Maintenance');

-- Insert sample buses
INSERT INTO buses (bus_id, bus_number, capacity, status, driver_id, transport_company)
SELECT UUID(), 'MMT-101', 45, 'active', driver_id, 'Metro Mass Transit'
FROM drivers WHERE license_number = 'DL-2023-001234' LIMIT 1;

INSERT INTO buses (bus_id, bus_number, capacity, status, driver_id, transport_company)
SELECT UUID(), 'VIP-202', 50, 'active', driver_id, 'VIP Transport'
FROM drivers WHERE license_number = 'DL-2023-005678' LIMIT 1;

-- Insert sample emergency services
INSERT INTO emergency_services (service_id, service_type, contact_number, email, location, availability_status) VALUES
(UUID(), 'police', '191', 'mttd.central@police.gov.gh', 'Accra Central', 'available'),
(UUID(), 'ambulance', '193', 'emergency@ambulance.gov.gh', 'Korle-Bu Hospital', 'available'),
(UUID(), 'fire', '192', 'fireservice@ghana.gov.gh', 'Ring Road Central', 'available');

-- Insert sample towing services
INSERT INTO towing_services (service_id, company_name, service_type, contact_number, email, location, availability_status) VALUES
(UUID(), 'QuickTow Ghana', 'towing', '0501234567', 'info@quicktow.com', 'Accra', 'available'),
(UUID(), 'Mechanic Pro Services', 'mechanic', '0502345678', 'contact@mechanicpro.com', 'Kumasi', 'available'),
(UUID(), 'Road Rescue Ghana', 'both', '0503456789', 'support@roadrescue.com', 'Tema', 'available');

-- Insert sample incidents
INSERT INTO incidents (incident_id, incident_type, title, description, location, latitude, longitude, severity_level, status, passenger_id, reported_driver_license, reported_vehicle_number, requires_emergency)
SELECT 
  UUID(),
  'reckless_driving',
  'Reckless driving on Spintex Road',
  'Driver was speeding and overtaking dangerously near the Baatsona traffic light.',
  'Spintex Road, Baatsona',
  5.6037,
  -0.1870,
  'high',
  'investigating',
  passenger_id,
  'DL-2023-005678',
  'GT-5678-21',
  FALSE
FROM passengers WHERE email = 'jane.mensah@example.com' LIMIT 1;

INSERT INTO incidents (incident_id, incident_type, title, description, location, latitude, longitude, severity_level, status, driver_id, requires_towing)
SELECT 
  UUID(),
  'vehicle_breakdown',
  'Bus breakdown on Accra-Kumasi Highway',
  'Engine overheating, passengers stranded. Need towing service.',
  'Accra-Kumasi Highway, Near Nsawam',
  5.8081,
  -0.3514,
  'high',
  'pending',
  driver_id,
  TRUE
FROM drivers WHERE license_number = 'DL-2023-001234' LIMIT 1;

INSERT INTO incidents (incident_id, incident_type, title, description, location, latitude, longitude, severity_level, status, passenger_id)
SELECT 
  UUID(),
  'pothole',
  'Dangerous pothole at Kwame Nkrumah Circle',
  'Very large pothole causing accidents. Multiple vehicles have been damaged.',
  'Kwame Nkrumah Circle, Accra',
  5.5600,
  -0.2057,
  'critical',
  'pending',
  passenger_id,
  FALSE
FROM passengers WHERE email = 'kwame.osei@example.com' LIMIT 1;

INSERT INTO incidents (incident_id, incident_type, title, description, location, latitude, longitude, severity_level, status, passenger_id)
SELECT 
  UUID(),
  'streetlight_needed',
  'Dark stretch needs streetlights',
  'The entire Dansoman High Street has no functioning lights. Very unsafe at night.',
  'Dansoman High Street, Accra',
  5.5467,
  -0.2702,
  'medium',
  'reviewed',
  passenger_id,
  FALSE
FROM passengers WHERE email = 'ama.asante@example.com' LIMIT 1;

INSERT INTO incidents (incident_id, incident_type, title, description, location, latitude, longitude, severity_level, status, passenger_id, requires_emergency)
SELECT 
  UUID(),
  'accident',
  'Multi-vehicle accident on Tema Motorway',
  'Serious accident involving 3 vehicles. Injuries reported.',
  'Tema Motorway, Near Community 4',
  5.6398,
  -0.0515,
  'critical',
  'resolved',
  passenger_id,
  TRUE
FROM passengers WHERE email = 'jane.mensah@example.com' LIMIT 1;

-- Insert sample notifications
INSERT INTO notifications (notification_id, recipient_type, recipient_id, title, message, notification_type, is_read)
SELECT 
  UUID(),
  'passenger',
  passenger_id,
  'Report Received',
  'Your pothole report at Kwame Nkrumah Circle has been received and is under review.',
  'update',
  FALSE
FROM passengers WHERE email = 'kwame.osei@example.com' LIMIT 1;

INSERT INTO notifications (notification_id, recipient_type, recipient_id, title, message, notification_type, is_read)
SELECT 
  UUID(),
  'driver',
  driver_id,
  'You have been reported',
  'A passenger has filed a complaint about reckless driving. Please contact MTTD for details.',
  'alert',
  FALSE
FROM drivers WHERE license_number = 'DL-2023-005678' LIMIT 1;

INSERT INTO notifications (notification_id, recipient_type, recipient_id, title, message, notification_type, is_read)
SELECT 
  UUID(),
  'admin',
  admin_id,
  'Critical Incident Alert',
  'Multi-vehicle accident reported on Tema Motorway. Emergency services dispatched.',
  'alert',
  TRUE
FROM administrators WHERE role = 'mttd' LIMIT 1;

-- Insert sample incident responses
INSERT INTO incident_responses (response_id, incident_id, responder_type, action_taken, notes)
SELECT 
  UUID(),
  incident_id,
  'admin',
  'Emergency services dispatched. Police and ambulance arrived at scene.',
  'Accident cleared. 2 people transported to hospital with minor injuries.'
FROM incidents WHERE incident_type = 'accident' LIMIT 1;

-- Insert sample bus request
INSERT INTO bus_requests (request_id, passenger_id, request_time, location, destination, passenger_count, request_status, reason)
SELECT 
  UUID(),
  passenger_id,
  NOW(),
  'Nsawam Junction',
  'Accra',
  15,
  'pending',
  'Current bus broke down, passengers need alternative transport'
FROM passengers WHERE email = 'jane.mensah@example.com' LIMIT 1;

-- Insert sample comments
INSERT INTO comments (comment_id, incident_id, commenter_type, commenter_id, comment)
SELECT 
  UUID(),
  i.incident_id,
  'admin',
  a.admin_id,
  'Road maintenance team has been notified. Expected repair date: Next week Monday.'
FROM incidents i
CROSS JOIN administrators a
WHERE i.incident_type = 'pothole' AND a.role = 'urban_roads'
LIMIT 1;
