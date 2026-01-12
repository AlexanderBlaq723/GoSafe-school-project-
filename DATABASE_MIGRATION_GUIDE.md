# Database Migration and Cleanup Guide

## Overview
This guide will help you consolidate your GoSafe databases into 4 clean databases and remove all others.

## The 4 Final Databases
1. **user_database** - All user-related tables (passengers, drivers, admins, emergency services, DVLA offices)
2. **incident_emergency** - All incident and notification tables
3. **logs_audit** - All logging and audit tables
4. **ride_location** - All bus, ride request, and location tracking tables

## Step-by-Step Migration Process

### Step 1: Backup Your Current Databases
```bash
# In phpMyAdmin, export all your current databases before proceeding
# Or use mysqldump if you have command line access
```

### Step 2: Run the Consolidated Schema
1. Open phpMyAdmin
2. Click on "SQL" tab
3. Open the file: `my-app/scripts/FINAL_CONSOLIDATED_SCHEMA.sql`
4. Copy all contents and paste into the SQL tab
5. Click "Go" to execute

This will:
- Create all 4 databases if they don't exist
- Create all required tables with proper fields and keys
- Add DVLA offices seed data
- Set up all indexes and foreign keys

### Step 3: Verify the Schema
Check that all 4 databases exist with the correct tables:

**user_database:**
- passengers
- drivers
- administrators
- dvla_offices
- emergency_services
- towing_services
- password_resets

**incident_emergency:**
- incidents
- incident_responses
- comments
- notifications

**logs_audit:**
- user_activity_logs
- api_logs
- system_logs
- security_logs
- performance_metrics

**ride_location:**
- buses
- bus_requests
- hot_spots
- location_history

### Step 4: Migrate Existing Data (if needed)
If you have data in other databases that you want to keep, run these queries:

```sql
-- Example: Copy passengers from old database to user_database
INSERT INTO user_database.passengers 
SELECT * FROM old_database.passengers
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Repeat for other tables as needed
```

### Step 5: Update Application Configuration
The app is already configured to use `user_database` in `.env.local`:
```
DB_NAME=user_database
```

For other databases, the app will need to connect using the full database name:
- `incident_emergency.incidents`
- `logs_audit.user_activity_logs`
- `ride_location.buses`

### Step 6: Delete Old Databases
Once you've verified everything works, delete the old databases:

1. In phpMyAdmin, select each old database
2. Click "Operations" tab
3. Scroll down and click "Drop the database (DROP)"
4. Confirm deletion

**Databases to keep:** user_database, incident_emergency, logs_audit, ride_location
**Delete all others**

### Step 7: Test the Application
1. Restart your Next.js server
2. Try creating a new admin with the correct DVLA office details
3. Test login functionality
4. Verify all features work correctly

## Important Notes

### Missing special_id Column Fix
The error you encountered was because the `administrators` table was missing the `special_id` column. The consolidated schema includes this column.

### DVLA Office Integration
- All DVLA offices are now properly seeded
- Admins must select a valid DVLA office during registration
- The office_number, branch_location, and region are automatically populated

### Cross-Database Queries
Since data is split across 4 databases, you may need to update some queries to use the full database.table syntax:
```sql
SELECT * FROM user_database.passengers;
SELECT * FROM incident_emergency.incidents;
```

## Troubleshooting

### If you get "Table already exists" errors:
The schema uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### If you get foreign key errors:
Make sure you run the entire script in order, as foreign keys depend on parent tables existing first.

### If admin signup still fails:
1. Verify the `special_id` column exists: `DESCRIBE user_database.administrators;`
2. Check DVLA offices exist: `SELECT * FROM user_database.dvla_offices;`
3. Restart your Next.js dev server

## Next Steps After Migration
1. Update any API routes that query multiple databases
2. Consider creating database views for common cross-database queries
3. Set up regular backups for all 4 databases
4. Document which tables belong to which database for your team
