/**
 * Creates a demo admin account for testing.
 * 
 * Usage:
 *   DB credentials can be passed as env vars or edited in the config below.
 * 
 *   DATABASE_URL=mysql://user:pass@host:3306/user_database node scripts/create_demo_admin.js
 *   OR
 *   DB_HOST=... DB_USER=... DB_PASSWORD=... DB_PORT=3306 node scripts/create_demo_admin.js
 */

const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

// ── Demo admin credentials ────────────────────────────────────────────────────
const DEMO_EMAIL    = 'admin@demo.com'
const DEMO_PASSWORD = 'Demo@123'
const DEMO_NAME     = 'Demo Admin'
const DEMO_PHONE    = '0243333333'
const ADMIN_ID      = 'DVLA000001'
const SPECIAL_ID    = 'GSAFE-ADM-001'
// ─────────────────────────────────────────────────────────────────────────────

function getConfig() {
  const url = process.env.DATABASE_URL
  if (url) {
    const u = new URL(url)
    return {
      host:     u.hostname,
      port:     parseInt(u.port || '3306'),
      user:     u.username,
      password: u.password,
      database: u.pathname.slice(1) || 'user_database',
    }
  }
  return {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'user_database',
  }
}

async function run() {
  const config = getConfig()
  console.log(`Connecting to ${config.host}:${config.port}/${config.database} as ${config.user} ...`)

  const conn = await mysql.createConnection({
    ...config,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  })

  // Ensure approval columns exist (mirrors ensureAdminApprovalColumns in db-helpers)
  const alterStatements = [
    `ALTER TABLE administrators ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE administrators ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'`,
    `ALTER TABLE administrators ADD COLUMN IF NOT EXISTS approved_by VARCHAR(36) DEFAULT NULL`,
    `ALTER TABLE administrators ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL`,
  ]
  for (const sql of alterStatements) {
    try { await conn.execute(sql) } catch (_) { /* column may already exist */ }
  }

  // Check if demo admin already exists
  const [existing] = await conn.execute(
    'SELECT admin_id FROM administrators WHERE email = ?',
    [DEMO_EMAIL]
  )
  if (existing.length > 0) {
    console.log(`Admin ${DEMO_EMAIL} already exists — updating password and setting is_approved = true.`)
    const hashed = await bcrypt.hash(DEMO_PASSWORD, 12)
    await conn.execute(
      `UPDATE administrators SET password_hash = ?, is_approved = true, approval_status = 'approved' WHERE email = ?`,
      [hashed, DEMO_EMAIL]
    )
    console.log('Done. Use the credentials below to log in.')
  } else {
    // Get or create a DVLA office row to satisfy the FK (if any)
    let officeId = 'DVLA-ACC-001'
    const [offices] = await conn.execute(
      `SELECT id FROM dvla_offices LIMIT 1`
    ).catch(() => [[]])
    if (offices.length > 0) {
      officeId = offices[0].id
    }

    const hashed = await bcrypt.hash(DEMO_PASSWORD, 12)
    await conn.execute(
      `INSERT INTO administrators
         (admin_id, full_name, email, password_hash, role, dvla_office_id,
          special_id, office_number, branch_location, region,
          is_approved, approval_status, approved_by, approved_at)
       VALUES (?, ?, ?, ?, 'admin', ?, ?, 'DVLA-ACC-001', 'Accra Central', 'Greater Accra',
               true, 'approved', NULL, NULL)`,
      [ADMIN_ID, DEMO_NAME, DEMO_EMAIL, hashed, officeId, SPECIAL_ID]
    )
    console.log('Demo admin created successfully.')
  }

  await conn.end()

  console.log('\n========================================')
  console.log('  DEMO ADMIN LOGIN CREDENTIALS')
  console.log('========================================')
  console.log(`  Email    : ${DEMO_EMAIL}`)
  console.log(`  Password : ${DEMO_PASSWORD}`)
  console.log(`  Role     : admin (Government Official)`)
  console.log(`  GoSafe ID: ${SPECIAL_ID}`)
  console.log('========================================\n')
}

run().catch((err) => {
  console.error('Script failed:', err.message)
  process.exit(1)
})
