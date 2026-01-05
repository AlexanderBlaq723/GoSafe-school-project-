-- GoSafe System Database Schema for MySQL
-- Based on ERD and system requirements

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS api_logs;
DROP TABLE IF EXISTS logs_audit;
DROP TABLE IF EXISTS bus_requests;
DROP TABLE IF EXISTS incident_responses;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS emergency_services;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS administrators;
DROP TABLE IF EXISTS towing_services;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS comments;

-- Passengers table
CREATE TABLE passengers (
  passenger_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drivers table with license validation
CREATE TABLE drivers (
  driver_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
  location VARCHAR(255),
  transport_company VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Administrators table (DVLA, MTTD, Urban Roads, District Assembly)
CREATE TABLE administrators (
  admin_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('dvla', 'mttd', 'urban_roads', 'district_assembly', 'super_admin') NOT NULL,
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Buses table
CREATE TABLE buses (
  bus_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  bus_number VARCHAR(50) UNIQUE NOT NULL,
  capacity INT NOT NULL,
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  driver_id CHAR(36),
  transport_company VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL
);

-- Emergency Services table
CREATE TABLE emergency_services (
  service_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  service_type ENUM('police', 'ambulance', 'fire', 'rescue') NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  location VARCHAR(255),
  availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Towing/Mechanic Services table
CREATE TABLE towing_services (
  service_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  company_name VARCHAR(255) NOT NULL,
  service_type ENUM('towing', 'mechanic', 'both') NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  location VARCHAR(255),
  availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Incidents table (main reporting table)
CREATE TABLE incidents (
  incident_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  incident_type ENUM(
    'reckless_driving',
    'overloading',
    'driver_misconduct',
    'overcharging',
    'vehicle_breakdown',
    'pothole',
    'damaged_road',
    'streetlight_needed',
    'accident',
    'emergency',
    'other'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  severity_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('pending', 'investigating', 'resolved', 'rejected') DEFAULT 'pending',
  passenger_id CHAR(36),
  driver_id CHAR(36),
  reported_driver_license VARCHAR(50),
  reported_vehicle_number VARCHAR(50),
  image_url TEXT,
  requires_towing BOOLEAN DEFAULT FALSE,
  requires_emergency BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL
);

-- Incident Responses table
CREATE TABLE incident_responses (
  response_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  incident_id CHAR(36) NOT NULL,
  service_id CHAR(36),
  responder_type ENUM('admin', 'emergency_service', 'towing_service') NOT NULL,
  response_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action_taken TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

-- Bus Requests table
CREATE TABLE bus_requests (
  request_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  passenger_id CHAR(36) NOT NULL,
  bus_id CHAR(36),
  request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  location VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  passenger_count INT DEFAULT 1,
  request_status ENUM('pending', 'assigned', 'completed', 'cancelled') DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE notifications (
  notification_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  recipient_type ENUM('passenger', 'driver', 'admin', 'all') NOT NULL,
  recipient_id CHAR(36),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('alert', 'update', 'system', 'assignment') NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  incident_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

-- Comments table for incident communication
CREATE TABLE comments (
  comment_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  incident_id CHAR(36) NOT NULL,
  commenter_type ENUM('passenger', 'driver', 'admin') NOT NULL,
  commenter_id CHAR(36) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

-- Logs and Audit table for monitoring
CREATE TABLE logs_audit (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  action VARCHAR(255) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Logs table for analytics
CREATE TABLE api_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time INT,
  status_code INT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_incidents_passenger ON incidents(passenger_id);
CREATE INDEX idx_incidents_driver ON incidents(driver_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_severity ON incidents(severity_level);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX idx_drivers_license ON drivers(license_number);
CREATE INDEX idx_drivers_status ON drivers(availability_status);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_bus_requests_status ON bus_requests(request_status);
CREATE INDEX idx_incident_responses_incident ON incident_responses(incident_id);
CREATE INDEX idx_logs_audit_user ON logs_audit(user_id);
CREATE INDEX idx_logs_audit_timestamp ON logs_audit(timestamp DESC);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp DESC);
