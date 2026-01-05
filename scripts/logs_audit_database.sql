-- Logs & Audit Database Schema

-- User Activity Logs
CREATE TABLE user_activity_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  user_type ENUM('passenger', 'driver', 'admin') NOT NULL,
  action VARCHAR(255) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Access Logs
CREATE TABLE api_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time INT,
  status_code INT,
  ip_address VARCHAR(45),
  user_id CHAR(36),
  request_body TEXT,
  response_body TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Logs
CREATE TABLE system_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  log_level ENUM('info', 'warning', 'error', 'critical') NOT NULL,
  service VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security Logs
CREATE TABLE security_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  event_type ENUM('login_attempt', 'login_success', 'login_failure', 'logout', 'password_change', 'account_locked') NOT NULL,
  user_id CHAR(36),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN,
  failure_reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Metrics
CREATE TABLE performance_metrics (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10, 4) NOT NULL,
  unit VARCHAR(20),
  tags JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_timestamp ON user_activity_logs(timestamp DESC);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX idx_security_logs_event ON security_logs(event_type);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp DESC);
CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);