import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[0-9]{10,15}$/
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''))
}

function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return strongPasswordRegex.test(password)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, role, licenseNumber, vehicleNumber, transportCompany } = body

    // Input validation
    if (!email || !password || !fullName || !phone || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }
    
    if (!isStrongPassword(password)) {
      return NextResponse.json({ 
        error: "Password must be at least 8 characters with uppercase, lowercase, and number" 
      }, { status: 400 })
    }
    
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }
    
    if (fullName.trim().length < 2) {
      return NextResponse.json({ error: "Full name must be at least 2 characters" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12) // Increased salt rounds
    const userId = uuidv4()
    let user

    if (role === "passenger") {
      // Check if passenger already exists
      const existingPassenger = await query("SELECT passenger_id FROM passengers WHERE email = ?", [email])
      if (existingPassenger.length > 0) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 })
      }

      // Create passenger
      await query(
        `INSERT INTO passengers (passenger_id, full_name, phone_number, email, password_hash) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, fullName.trim(), phone, email.toLowerCase(), hashedPassword]
      )

      // Get created passenger
      const [createdUser] = await query(
        "SELECT passenger_id as id, email, full_name, phone_number as phone, 'passenger' as role FROM passengers WHERE passenger_id = ?",
        [userId]
      )
      user = createdUser

    } else if (role === "driver") {
      if (!licenseNumber || !vehicleNumber) {
        return NextResponse.json({ error: "License number and vehicle number are required for drivers" }, { status: 400 })
      }
      
      if (licenseNumber.trim().length < 5) {
        return NextResponse.json({ error: "Invalid license number format" }, { status: 400 })
      }

      // Check if driver already exists
      const existingDriver = await query("SELECT driver_id FROM drivers WHERE email = ? OR license_number = ?", [email, licenseNumber])
      if (existingDriver.length > 0) {
        return NextResponse.json({ error: "Driver already exists with this email or license number" }, { status: 400 })
      }

      // Create driver
      await query(
        `INSERT INTO drivers (driver_id, full_name, phone_number, email, password_hash, license_number, vehicle_number, transport_company) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName.trim(), phone, email.toLowerCase(), hashedPassword, licenseNumber.trim(), vehicleNumber.trim(), transportCompany?.trim() || null]
      )

      // Get created driver
      const [createdUser] = await query(
        "SELECT driver_id as id, email, full_name, phone_number as phone, 'driver' as role, license_number, vehicle_number FROM drivers WHERE driver_id = ?",
        [userId]
      )
      user = createdUser

    } else if (role === "admin") {
      // Check if admin already exists
      const existingAdmin = await query("SELECT admin_id FROM administrators WHERE email = ?", [email])
      if (existingAdmin.length > 0) {
        return NextResponse.json({ error: "Admin already exists" }, { status: 400 })
      }

      // Create admin
      await query(
        `INSERT INTO administrators (admin_id, full_name, email, password_hash, role) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, fullName.trim(), email.toLowerCase(), hashedPassword, 'super_admin']
      )

      // Get created admin
      const [createdUser] = await query(
        "SELECT admin_id as id, email, full_name, 'admin' as role FROM administrators WHERE admin_id = ?",
        [userId]
      )
      user = createdUser

    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
