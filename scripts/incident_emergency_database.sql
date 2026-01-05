-- Incident & Emergency Database Schema

-- Incidents table
CREATE TABLE incidents (
  IncidentID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  IncidentType ENUM(
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
  Location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  DateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  SeverityLevel ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  Status ENUM('pending', 'investigating', 'resolved', 'rejected') DEFAULT 'pending',
  PassengerID CHAR(36),
  DriverID CHAR(36),
  reported_driver_license VARCHAR(50),
  reported_vehicle_number VARCHAR(50),
  image_urls JSON,
  video_urls JSON,
  requires_towing BOOLEAN DEFAULT FALSE,
  requires_emergency BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Incident Responses table
CREATE TABLE incident_responses (
  ResponseID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  IncidentID CHAR(36) NOT NULL,
  ServiceID CHAR(36),
  ResponseTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ActionTaken TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (IncidentID) REFERENCES incidents(IncidentID) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE comments (
  comment_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  IncidentID CHAR(36) NOT NULL,
  commenter_type ENUM('passenger', 'driver', 'admin') NOT NULL,
  commenter_id CHAR(36) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (IncidentID) REFERENCES incidents(IncidentID) ON DELETE CASCADE
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
  IncidentID CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (IncidentID) REFERENCES incidents(IncidentID) ON DELETE CASCADE
);

CREATE INDEX idx_incidents_status ON incidents(Status);
CREATE INDEX idx_incidents_type ON incidents(IncidentType);
CREATE INDEX idx_incidents_severity ON incidents(SeverityLevel);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX idx_incident_responses_incident ON incident_responses(IncidentID);