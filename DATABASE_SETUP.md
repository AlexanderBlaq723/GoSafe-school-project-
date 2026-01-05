# MySQL Database Setup with XAMPP

## Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** modules

## Step 2: Create Database
1. Open your browser and go to `http://localhost/phpmyadmin`
2. Click "New" in the left sidebar
3. Enter database name: `incident_reports`
4. Click "Create"

## Step 3: Run SQL Scripts
1. Select your `incident_reports` database
2. Click on "SQL" tab at the top
3. Copy and paste the content from `scripts/001_create_tables.sql`
4. Click "Go" to execute
5. Repeat for `scripts/002_seed_data.sql` to add sample data

## Step 4: Configure Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Update the values if needed (default XAMPP settings should work):
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=incident_reports
   ```

## Step 5: Install MySQL Package
Run this command in your project directory:
```bash
npm install mysql2
```

## Test Credentials
After running the seed script, you can login with:
- **Admin**: admin@example.com / admin123
- **Driver**: driver@example.com / admin123
- **Passenger**: passenger@example.com / admin123

Note: Passwords are hashed with bcrypt. The actual password is `admin123` for all test accounts.
