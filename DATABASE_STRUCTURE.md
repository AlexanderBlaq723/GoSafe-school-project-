# GoSafe Database Structure - Quick Reference

## Database: user_database
**Purpose:** All user accounts and authentication

### Tables:
- `passengers` - Passenger user accounts
- `drivers` - Driver user accounts  
- `administrators` - Admin user accounts (DVLA, MTTD, etc.)
- `dvla_offices` - DVLA office locations and details
- `emergency_services` - Emergency service providers (police, ambulance, fire, rescue)
- `towing_services` - Towing and mechanic service providers
- `password_resets` - Password reset tokens

### Key Fields:
- All user tables have `special_id` for profile/recovery
- Administrators linked to `dvla_offices` via `dvla_office_id`
- Emergency/towing services have `is_approved` flag

---

## Database: incident_emergency
**Purpose:** Incident reporting and emergency response

### Tables:
- `incidents` - All reported incidents (accidents, road issues, driver misconduct)
- `incident_responses` - Actions taken by admins/emergency services
- `comments` - Comments on incidents
- `notifications` - System notifications to users

### Key Fields:
- `incidents.incident_type` - Type of incident (reckless_driving, pothole, accident, etc.)
- `incidents.status` - pending, investigating, resolved, rejected
- `incidents.severity_level` - low, medium, high, critical
- `incidents.requires_towing` - Boolean flag
- `incidents.requires_emergency` - Boolean flag
- `incidents.image_urls` - JSON array of image URLs
- `incidents.video_urls` - JSON array of video URLs

---

## Database: logs_audit
**Purpose:** System logging and audit trails

### Tables:
- `user_activity_logs` - User actions and activities
- `api_logs` - API endpoint access logs
- `system_logs` - System-level logs (errors, warnings)
- `security_logs` - Authentication and security events
- `performance_metrics` - System performance data

### Key Fields:
- All tables have `timestamp` for chronological tracking
- `user_activity_logs.details` - JSON field for action details
- `system_logs.log_level` - info, warning, error, critical
- `security_logs.event_type` - login_attempt, login_success, etc.

---

## Database: ride_location
**Purpose:** Bus tracking and ride requests

### Tables:
- `buses` - Bus fleet information
- `bus_requests` - Passenger bus requests
- `hot_spots` - High-demand locations
- `location_history` - Historical location data

### Key Fields:
- `buses.status` - active, maintenance, inactive
- `buses.current_latitude` / `current_longitude` - Real-time location
- `bus_requests.request_status` - pending, assigned, completed, cancelled
- `bus_requests.is_peak_hour` - Boolean flag
- `hot_spots.request_count` - Number of requests at location

---

## API Route Database Usage

### User Authentication & Management
```typescript
// Use default user_database
import { query } from '@/lib/db'
const users = await query('SELECT * FROM passengers')
const admins = await query('SELECT * FROM administrators')
const offices = await query('SELECT * FROM dvla_offices')
```

### Incidents & Notifications
```typescript
// Query incident_emergency database
import { queryDatabase } from '@/lib/db'
const incidents = await queryDatabase('incident_emergency', 'SELECT * FROM incidents')
const notifications = await queryDatabase('incident_emergency', 'SELECT * FROM notifications')
```

### Logging & Audit
```typescript
// Query logs_audit database
import { queryDatabase } from '@/lib/db'
await queryDatabase('logs_audit', 'INSERT INTO user_activity_logs ...')
await queryDatabase('logs_audit', 'INSERT INTO security_logs ...')
```

### Bus & Location Tracking
```typescript
// Query ride_location database
import { queryDatabase } from '@/lib/db'
const buses = await queryDatabase('ride_location', 'SELECT * FROM buses')
const requests = await queryDatabase('ride_location', 'SELECT * FROM bus_requests')
```

---

## Cross-Database Queries

When you need to join data across databases, use full table names:

```sql
-- Join passengers with their incidents
SELECT 
  p.full_name, 
  i.title, 
  i.status
FROM user_database.passengers p
JOIN incident_emergency.incidents i ON p.passenger_id = i.passenger_id
WHERE i.status = 'pending';
```

```sql
-- Get driver with their bus and recent requests
SELECT 
  d.full_name,
  b.bus_number,
  COUNT(br.request_id) as total_requests
FROM user_database.drivers d
JOIN ride_location.buses b ON d.driver_id = b.driver_id
LEFT JOIN ride_location.bus_requests br ON b.bus_id = br.bus_id
GROUP BY d.driver_id, b.bus_id;
```

---

## Environment Configuration

Your `.env.local` should have:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=user_database
```

The `DB_NAME` is the default database. Other databases are accessed explicitly using `queryDatabase()` or full table names.
