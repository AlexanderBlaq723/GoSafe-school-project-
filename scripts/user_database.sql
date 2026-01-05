-- User Database Schema

-- Passengers table
CREATE TABLE passengers (
  PassengerID CHAR(36) PRIMARY KEY,
  FullName VARCHAR(255) NOT NULL,
  PhoneNumber VARCHAR(20) NOT NULL,
  Email VARCHAR(255) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  Location VARCHAR(255),
  DateRegistered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
  DriverID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  FullName VARCHAR(255) NOT NULL,
  PhoneNumber VARCHAR(20) NOT NULL,
  Email VARCHAR(255) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  LicenseNumber VARCHAR(50) UNIQUE NOT NULL,
  VehicleNumber VARCHAR(50) NOT NULL,
  AvailabilityStatus ENUM('available', 'busy', 'offline') DEFAULT 'available',
  Location VARCHAR(255),
  transport_company VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Administrators table
CREATE TABLE administrators (
  AdminID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  FullName VARCHAR(255) NOT NULL,
  Email VARCHAR(255) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  Role ENUM('dvla', 'mttd', 'urban_roads', 'district_assembly', 'super_admin') NOT NULL,
  department VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Emergency Services table
CREATE TABLE emergency_services (
  ServiceID CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ServiceType ENUM('police', 'ambulance', 'fire', 'rescue') NOT NULL,
  ContactNumber VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  Location VARCHAR(255),
  availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_license ON drivers(LicenseNumber);
CREATE INDEX idx_drivers_status ON drivers(AvailabilityStatus);