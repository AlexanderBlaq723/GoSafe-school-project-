-- Ride & Location Database Schema

-- Buses table
CREATE TABLE buses (
  BusID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  BusNumber VARCHAR(50) UNIQUE NOT NULL,
  Capacity INT NOT NULL,
  Status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  DriverID CHAR(36),
  transport_company VARCHAR(255),
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bus Requests table
CREATE TABLE bus_requests (
  RequestID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  PassengerID CHAR(36) NOT NULL,
  BusID CHAR(36),
  DriverID CHAR(36),
  RequestTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  PassengerCount INT DEFAULT 1,
  RequestStatus ENUM('pending', 'assigned', 'completed', 'cancelled') DEFAULT 'pending',
  destination VARCHAR(255),
  destination_latitude DECIMAL(10, 8),
  destination_longitude DECIMAL(11, 8),
  is_peak_hour BOOLEAN DEFAULT FALSE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (BusID) REFERENCES buses(BusID) ON DELETE SET NULL
);

-- Hot Spots table for tracking high-demand locations
CREATE TABLE hot_spots (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  request_count INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location History table
CREATE TABLE location_history (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  entity_type ENUM('bus', 'driver', 'passenger') NOT NULL,
  entity_id CHAR(36) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bus_requests_status ON bus_requests(RequestStatus);
CREATE INDEX idx_location_history_entity ON location_history(entity_type, entity_id);