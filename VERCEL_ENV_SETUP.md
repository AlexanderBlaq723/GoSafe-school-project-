# Vercel Environment Variables Setup

This guide explains how to configure environment variables for your GoSafe application on Vercel.

## Required Environment Variables

Your application needs these database environment variables to connect to your MySQL database:

### Option 1: Individual Environment Variables (Recommended)

```env
DB_HOST=your-database-host.com
DB_PORT=3306
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=user_database
```

### Option 2: DATABASE_URL (Alternative)

You can use a single DATABASE_URL instead of individual variables:

```env
DATABASE_URL=mysql://username:password@host:port/database
```

**Example:**
```env
DATABASE_URL=mysql://avnadmin:mypassword@mysql-gosafe-project.aivencloud.com:12345/user_database
```

## SSL Configuration (Cloud Databases)

Most cloud database providers (Aiven, PlanetScale, AWS RDS, etc.) require SSL connections:

```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

**Notes:**
- Set `DB_SSL=false` only if your database explicitly does NOT use SSL (local databases)
- `DB_SSL_REJECT_UNAUTHORIZED=false` allows self-signed certificates (common in cloud databases)

## Optional Environment Variables

### Connection Pooling
```env
DB_CONNECTION_LIMIT=5
DB_TIMEZONE=Z
```

### Email/SMS (Optional Features)
```env
# Twilio for SMS
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM=+1234567890

# SendGrid for Email
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM=no-reply@gosafe.com

# Base URL for callbacks
NEXT_PUBLIC_BASE_URL=https://go-safe-school-project-lces.vercel.app
```

## How to Set Environment Variables on Vercel

### Method 1: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project: **go-safe-school-project-lces**
3. Click **Settings** tab
4. Click **Environment Variables** in the sidebar
5. For each variable:
   - Enter the **Name** (e.g., `DB_HOST`)
   - Enter the **Value** (e.g., `your-database-host.com`)
   - Select environment: **Production**, **Preview**, and **Development** (check all three)
   - Click **Save**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add DB_HOST
vercel env add DB_PORT
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add DB_SSL
vercel env add DB_SSL_REJECT_UNAUTHORIZED
```

## Testing Your Configuration

After setting environment variables, you need to **redeploy** for changes to take effect:

### 1. Trigger a Redeploy

**Option A: Via Dashboard**
- Go to Vercel Dashboard → Deployments
- Click the three dots on the latest deployment
- Click "Redeploy"

**Option B: Push to Git**
```bash
git commit --allow-empty -m "Trigger redeploy with new env vars"
git push
```

### 2. Test Database Connection

Once redeployed, visit:
```
https://go-safe-school-project-lces.vercel.app/api/health
```

You should see a JSON response like:
```json
{
  "status": "ok",
  "message": "Database connection successful",
  "connectionConfig": {
    "host": "your-host.com",
    "port": 3306,
    "user": "your-user",
    "database": "user_database"
  },
  "databases": {
    "user_database": {
      "status": "ok",
      "tableCount": 7,
      "tables": ["passengers", "drivers", "administrators", ...]
    },
    "incident_emergency": { ... },
    "logs_audit": { ... },
    "ride_location": { ... }
  }
}
```

### 3. Test Signup

Try signing up at:
```
https://go-safe-school-project-lces.vercel.app/signup
```

Fill in the form and submit. You should get a success response (not a 500 error).

## Troubleshooting

### Still Getting 500 Errors?

1. **Check Vercel Logs:**
   - Vercel Dashboard → Deployments → Latest → Functions tab
   - Click on `/api/auth/signup`
   - Look for detailed error messages

2. **Common Issues:**

   **"Access denied for user"**
   - Your `DB_USER` or `DB_PASSWORD` is incorrect
   - Update the credentials on Vercel

   **"Unknown database"**
   - The database `user_database` doesn't exist on your server
   - Check your database names or create the missing database

   **"Connection timeout" / "ECONNREFUSED"**
   - Your `DB_HOST` or `DB_PORT` is incorrect
   - Your database firewall may be blocking Vercel's IP addresses
   - Check your database provider's connection settings

   **"SSL connection error"**
   - Try setting `DB_SSL_REJECT_UNAUTHORIZED=false`
   - Some providers require downloading SSL certificates

3. **Database Firewall:**
   - Most cloud database providers have IP whitelisting
   - Vercel uses dynamic IPs, so you may need to allow all IPs (0.0.0.0/0)
   - Check your database provider's firewall/security settings

### Need Help?

Run the health check endpoint and share the output:
```
https://go-safe-school-project-lces.vercel.app/api/health
```

This will show exactly what's wrong with the database connection.

## Example Configuration for Common Providers

### Aiven MySQL

```env
DB_HOST=mysql-gosafe-xxxxx.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=your-password-here
DB_NAME=user_database
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### PlanetScale

```env
DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/database-name?ssl={"rejectUnauthorized":true}
```

### Railway

```env
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=your-password-here
DB_NAME=railway
DB_SSL=false
```

### AWS RDS

```env
DB_HOST=gosafe-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your-password-here
DB_NAME=user_database
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```
