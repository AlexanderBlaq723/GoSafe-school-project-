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
    const { email, password, fullName, phone, role, licenseNumber, vehicleNumber, transportCompany, companyName, dvlaOfficeId, serviceType, branchNumber, registrationNumber, address, latitude, longitude } = body

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
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Generate ID based on user type
    let userId: string
    if (role === "passenger") {
      const count = await query("SELECT COUNT(*) as cnt FROM passengers", [])
      userId = `PA${String(count[0].cnt + 1).padStart(6, '0')}`
    } else if (role === "driver") {
      const count = await query("SELECT COUNT(*) as cnt FROM drivers", [])
      userId = `DR${String(count[0].cnt + 1).padStart(6, '0')}`
    } else if (role === "admin") {
      const count = await query("SELECT COUNT(*) as cnt FROM administrators", [])
      userId = `DVLA${String(count[0].cnt + 1).padStart(6, '0')}`
    } else if (role === "emergency_service") {
      const count = await query("SELECT COUNT(*) as cnt FROM emergency_services", [])
      const prefix = serviceType === 'police' ? 'PO' : serviceType === 'ambulance' ? 'AM' : serviceType === 'fire' ? 'FI' : 'ES'
      const branchNum = branchNumber ? String(branchNumber).padStart(3, '0') : '001'
      userId = `${prefix}-${String(count[0].cnt + 1).padStart(6, '0')}-${branchNum}`
    } else if (role === "towing_service") {
      const count = await query("SELECT COUNT(*) as cnt FROM towing_services", [])
      const branchNum = branchNumber ? String(branchNumber).padStart(3, '0') : '001'
      userId = `TO-${String(count[0].cnt + 1).padStart(6, '0')}-${branchNum}`
    } else {
      userId = uuidv4()
    }
    
    // Generate a short special ID for the user (used for profile and password recovery)
    const randomPart1 = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const randomPart2 = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const specialId = `GSAFE-${randomPart1}-${randomPart2}`
    let user

    if (role === "passenger") {
      const existingPassenger = await query("SELECT passenger_id FROM passengers WHERE email = ?", [email])
      if (existingPassenger.length > 0) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 })
      }

      await query(
        `INSERT INTO passengers (passenger_id, full_name, phone_number, email, password_hash, special_id) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, fullName.trim(), phone, email.toLowerCase(), hashedPassword, specialId]
      )

      const [createdUser] = await query(
        "SELECT passenger_id as id, email, full_name, phone_number as phone, special_id, 'passenger' as role FROM passengers WHERE passenger_id = ?",
        [userId]
      )
      user = createdUser

    } else if (role === "driver") {
      if (!licenseNumber || !vehicleNumber) {
        return NextResponse.json({ error: "License number and vehicle number are required for drivers" }, { status: 400 })
      }
      
      const existingDriver = await query("SELECT driver_id FROM drivers WHERE email = ? OR license_number = ?", [email, licenseNumber])
      if (existingDriver.length > 0) {
        return NextResponse.json({ error: "Driver already exists with this email or license number" }, { status: 400 })
      }

      await query(
        `INSERT INTO drivers (driver_id, full_name, phone_number, email, password_hash, license_number, vehicle_number, transport_company, special_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName.trim(), phone, email.toLowerCase(), hashedPassword, licenseNumber.trim(), vehicleNumber.trim(), transportCompany?.trim() || null, specialId]
      )

      const [createdUser] = await query(
        "SELECT driver_id as id, email, full_name, phone_number as phone, special_id, 'driver' as role, license_number, vehicle_number FROM drivers WHERE driver_id = ?",
        [userId]
      )
      user = createdUser

    } else if (role === "admin") {
      // Admins must provide the dvla office id and matching office_number and branch_location to prevent unauthorized signups
      const { officeNumber, branchLocation } = body
      if (!dvlaOfficeId || !officeNumber || !branchLocation) {
        return NextResponse.json({ error: "DVLA office id, office number and branch location are required for admin registration" }, { status: 400 })
      }

      // Verify DVLA office exists and matches provided officeNumber and branchLocation
      // Accept either the canonical `id` or the public `office_number` in `dvlaOfficeId` payload
      const [office] = await query(
        "SELECT id, office_number, branch_location, region FROM dvla_offices WHERE (id = ? OR office_number = ?) AND is_active = true LIMIT 1",
        [dvlaOfficeId, dvlaOfficeId]
      )
      if (!office) {
        return NextResponse.json({ error: "Invalid DVLA office selected" }, { status: 400 })
      }

      // If client provided an officeNumber, ensure it matches the canonical office_number
      if (officeNumber && office.office_number !== officeNumber) {
        return NextResponse.json({ error: "Provided office number does not match the selected DVLA office" }, { status: 400 })
      }

      // If client provided a branchLocation, ensure it matches (case-insensitive)
      if (branchLocation && office.branch_location.toLowerCase() !== branchLocation.toLowerCase()) {
        return NextResponse.json({ error: "Provided branch location does not match the selected DVLA office" }, { status: 400 })
      }

      // Canonicalize fields to ensure DB stores the authoritative values
      const canonicalOfficeId = office.id
      const canonicalOfficeNumber = office.office_number
      const canonicalBranchLocation = office.branch_location
      const canonicalRegion = office.region || null

      const existingAdmin = await query("SELECT admin_id FROM administrators WHERE email = ?", [email])
      console.log('Existing admin check:', existingAdmin)
      if (existingAdmin.length > 0) {
        return NextResponse.json({ error: "Admin already exists" }, { status: 400 })
      }

      await query(
        `INSERT INTO administrators (admin_id, full_name, email, password_hash, role, dvla_office_id, special_id, office_number, branch_location, region) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName.trim(), email.toLowerCase(), hashedPassword, 'admin', canonicalOfficeId, specialId, canonicalOfficeNumber, canonicalBranchLocation, canonicalRegion]
      )

      const [createdUser] = await query(
        "SELECT admin_id as id, email, full_name, special_id, 'admin' as role, dvla_office_id FROM administrators WHERE admin_id = ?",
        [userId]
      )
      user = createdUser

    } else if (role === "emergency_service") {
      // Accept emergency service registration from UI; address/coords may be provided later or by admin
      const allowedServiceTypes = ['ambulance', 'fire', 'police']
      if (!serviceType || !registrationNumber) {
        return NextResponse.json({ error: "Service type and registration number are required" }, { status: 400 })
      }
      if (!allowedServiceTypes.includes(serviceType.toLowerCase())) {
        return NextResponse.json({ error: "Invalid service type. Must be ambulance, fire, or police" }, { status: 400 })
      }

      const existingService = await query("SELECT service_id FROM emergency_services WHERE email = ? OR registration_number = ?", [email, registrationNumber])
      if (existingService.length > 0) {
        return NextResponse.json({ error: "Emergency service already exists" }, { status: 400 })
      }

      const svcLat = latitude || 0
      const svcLon = longitude || 0
      const svcAddress = address || 'Pending Address Verification'

      await query(
        `INSERT INTO emergency_services (service_id, service_name, service_type, contact_person, phone, email, address, latitude, longitude, branch_number, registration_number, is_approved, is_available, special_id, password_hash) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fullName.trim(), serviceType.toLowerCase(), fullName.trim(), phone, email.toLowerCase(), svcAddress, svcLat, svcLon, branchNumber || null, registrationNumber, false, true, specialId, hashedPassword]
      )

      return NextResponse.json({ 
        message: "Emergency service registration submitted. Awaiting admin approval.",
        requiresApproval: true,
        specialId
      }, { status: 201 })

    } else if (role === 'towing_service') {
      // Towing/mechanic services require company name, registration and admin approval; location optional
      const towReg = registrationNumber
      const towAddress = address || null
      const towLat = latitude || null
      const towLon = longitude || null

      if (!towReg) {
        return NextResponse.json({ error: 'Registration number is required for towing services' }, { status: 400 })
      }

      const existingTow = await query('SELECT service_id FROM towing_services WHERE registration_number = ? OR company_name = ?', [towReg, companyName])
      if (existingTow.length > 0) {
        return NextResponse.json({ error: 'Towing service already registered' }, { status: 400 })
      }

      await query(
        `INSERT INTO towing_services (service_id, company_name, service_type, contact_number, email, location, availability_status, branch_number, registration_number, is_approved, special_id, password_hash) 
         VALUES (?, ?, 'towing', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, companyName || fullName.trim(), phone, email.toLowerCase(), towAddress, 'available', branchNumber || null, towReg, false, specialId, hashedPassword]
      )

      return NextResponse.json({ message: 'Towing service registration submitted. Awaiting admin approval.', requiresApproval: true, specialId }, { status: 201 })

    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
