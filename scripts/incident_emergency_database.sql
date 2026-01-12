CREATE DATABASE IF NOT EXISTS incident_emergency_database;
USE incident_emergency_database;

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
    admin_response TEXT,
    image_urls JSON,
    video_urls JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_services (
    id VARCHAR(36) PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    service_type ENUM('police', 'ambulance', 'fire', 'towing') NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255),
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_assignments (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    service_id VARCHAR(36) NOT NULL,
    assigned_by VARCHAR(36),
    assignment_type ENUM('automatic', 'manual') DEFAULT 'automatic',
    status ENUM('assigned', 'acknowledged', 'in_progress', 'completed', 'cancelled') DEFAULT 'assigned',
    notes TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    feedback TEXT,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES emergency_services(id) ON DELETE CASCADE
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_emergency_services_type ON emergency_services(service_type);
CREATE INDEX idx_service_assignments_report ON service_assignments(report_id);
CREATE INDEX idx_service_assignments_service ON service_assignments(service_id);
