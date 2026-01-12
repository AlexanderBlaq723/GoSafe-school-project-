CREATE DATABASE IF NOT EXISTS ride_location_database;
USE ride_location_database;

CREATE TABLE IF NOT EXISTS bus_requests (
    id VARCHAR(36) PRIMARY KEY,
    passenger_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36),
    location VARCHAR(255) NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    destination VARCHAR(255),
    destination_latitude DECIMAL(10, 8),
    destination_longitude DECIMAL(11, 8),
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_peak_hour BOOLEAN DEFAULT FALSE,
    request_status ENUM('pending', 'accepted', 'completed', 'cancelled') DEFAULT 'pending',
    passenger_count INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hot_spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    request_count INT NOT NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vehicle_change_requests (
    id VARCHAR(36) PRIMARY KEY,
    driver_id VARCHAR(36) NOT NULL,
    old_vehicle_number VARCHAR(50),
    new_vehicle_number VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    proof_document_url VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by VARCHAR(36)
);

CREATE INDEX idx_bus_requests_passenger_id ON bus_requests(passenger_id);
CREATE INDEX idx_bus_requests_driver_id ON bus_requests(driver_id);
CREATE INDEX idx_bus_requests_status ON bus_requests(request_status);
CREATE INDEX idx_hot_spots_location ON hot_spots(latitude, longitude);
CREATE INDEX idx_vehicle_change_requests_driver ON vehicle_change_requests(driver_id);
