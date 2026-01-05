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
  const now = Date.now()
  const attempts = loginAttempts.get(ip)
  
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset if more than 15 minutes passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return true
  }
  
  // Allow max 5 attempts per 15 minutes
  if (attempts.count >= 5) {
    return false
  }
  
  attempts.count++
  attempts.lastAttempt = now
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
    }
    
    const body = await request.json()
    const { email, password, role, licenseNumber } = body

    // Input validation
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    let user

    if (role === "passenger") {
      const users = await query(
        "SELECT passenger_id as id, email, password_hash, full_name, phone_number as phone, 'passenger' as role FROM passengers WHERE email = ?",
        [email]
      )
      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
      user = users[0]

    } else if (role === "driver") {
      if (!licenseNumber) {
        return NextResponse.json({ error: "License number is required for drivers" }, { status: 400 })
      }

      const users = await query(
        "SELECT driver_id as id, email, password_hash, full_name, phone_number as phone, 'driver' as role, license_number, vehicle_number FROM drivers WHERE email = ? AND license_number = ?",
        [email, licenseNumber]
      )
      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid credentials or license number" }, { status: 401 })
      }
      user = users[0]

    } else if (role === "admin") {
      const users = await query(
        "SELECT admin_id as id, email, password_hash, full_name, 'admin' as role FROM administrators WHERE email = ?",
        [email]
      )
      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
      user = users[0]

    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Reset rate limit on successful login
    loginAttempts.delete(ip)

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
