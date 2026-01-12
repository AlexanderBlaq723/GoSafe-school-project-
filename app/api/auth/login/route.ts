import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

// Simple rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function checkRateLimit(ip: string): boolean {
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // `identifier` can be email, phone, or special ID; keep `email` for backward compat
    const { identifier, email, password, role, licenseNumber } = body

    // Input validation
    if ((!identifier && !email) || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // helper to check if a column exists in the current database
    const columnExists = async (table: string, column: string) => {
      const rows: any[] = await query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      )
      return rows && rows[0] && rows[0].cnt > 0
    }

    let user

    if (role === "passenger") {
      const ident = identifier || email
      const hasSpecial = await columnExists('passengers', 'special_id')
      const selectCols = hasSpecial
        ? "passenger_id as id, email, password_hash, full_name, phone_number as phone, special_id, 'passenger' as role"
        : "passenger_id as id, email, password_hash, full_name, phone_number as phone, 'passenger' as role"

      const users = await query(
        `SELECT ${selectCols} FROM passengers WHERE email = ? OR phone_number = ?${hasSpecial ? ' OR special_id = ?' : ''}`,
        hasSpecial ? [ident, ident, ident] : [ident, ident]
      )

      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
      user = users[0]

    } else if (role === "driver") {
      if (!licenseNumber) {
        return NextResponse.json({ error: "License number is required for drivers" }, { status: 400 })
      }

      const ident = identifier || email
      const hasSpecial = await columnExists('drivers', 'special_id')
      const selectCols = hasSpecial
        ? "driver_id as id, email, password_hash, full_name, phone_number as phone, special_id, 'driver' as role, license_number, vehicle_number"
        : "driver_id as id, email, password_hash, full_name, phone_number as phone, 'driver' as role, license_number, vehicle_number"

      const users = await query(
        `SELECT ${selectCols} FROM drivers WHERE (email = ? OR phone_number = ?${hasSpecial ? ' OR special_id = ?' : ''}) AND license_number = ?`,
        hasSpecial ? [ident, ident, ident, licenseNumber] : [ident, ident, licenseNumber]
      )

      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid credentials or license number" }, { status: 401 })
      }
      user = users[0]

    } else if (role === "admin") {
      const ident = identifier || email
      const hasSpecial = await columnExists('administrators', 'special_id')
      const selectCols = hasSpecial
        ? "admin_id as id, email, password_hash, full_name, special_id, 'admin' as role"
        : "admin_id as id, email, password_hash, full_name, 'admin' as role"

      console.log('Admin login attempt:', { ident, hasSpecial })
      const users = await query(
        `SELECT ${selectCols} FROM administrators WHERE email = ?${hasSpecial ? ' OR special_id = ?' : ''}`,
        hasSpecial ? [ident, ident] : [ident]
      )
      console.log('Admin users found:', users.length)

      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
      user = users[0]
      console.log('Admin user:', { email: user.email, hasPassword: !!user.password_hash })

    } else if (role === "towing_service" || role === "emergency_service") {
      const ident = identifier || email
      const tableName = role === "towing_service" ? "towing_services" : "emergency_services"
      
      // Check which columns exist
      const hasSpecial = await columnExists(tableName, 'special_id')
      const hasApproval = await columnExists(tableName, 'approval_status')
      const hasPasswordHash = await columnExists(tableName, 'password_hash')
      
      if (!hasPasswordHash) {
        return NextResponse.json({ error: "Service authentication not configured. Please contact admin." }, { status: 500 })
      }
      
      // Determine column names based on table
      const idCol = role === "towing_service" ? "service_id" : "service_id"
      const nameCol = role === "towing_service" ? "company_name" : "service_name"
      const phoneCol = role === "towing_service" ? "contact_number" : "phone"
      
      const selectCols = hasSpecial
        ? `${idCol} as id, email, password_hash, ${nameCol} as full_name, ${phoneCol} as phone, special_id, '${role}' as role, service_type, branch_number`
        : `${idCol} as id, email, password_hash, ${nameCol} as full_name, ${phoneCol} as phone, '${role}' as role, service_type, branch_number`

      const whereClause = `WHERE (email = ? OR ${phoneCol} = ?${hasSpecial ? ' OR special_id = ?' : ''}) AND is_approved = TRUE`

      const users = await query(
        `SELECT ${selectCols} FROM ${tableName} ${whereClause}`,
        hasSpecial ? [ident, ident, ident] : [ident, ident]
      )

      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid credentials or account not approved" }, { status: 401 })
      }
      user = users[0]

    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Verify password
    console.log('Verifying password for user:', user.email)
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('Password valid:', isValidPassword)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
