import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    let sql = `SELECT * FROM reports ORDER BY created_at DESC`
    let params: any[] = []

    if (role !== "admin" && userId) {
      sql = `SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC`
      params = [userId]
    }

    const reports = await query(sql, params)
    return NextResponse.json({ reports }, { status: 200 })
  } catch (error) {
    console.error("Get reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      type,
      title,
      description,
      location,
      latitude,
      longitude,
      priority,
      vehicleNumber,
      requestTowing,
      requestEmergency,
      imageUrls,
      videoUrls
    } = body

    if (!userId || !type || !title || !description || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate report ID in format RPT-YYYY-0000000001 (sequential)
    const year = new Date().getFullYear()
    
    // Get the count of reports for this year to generate sequential number
    const countResult = await query<Array<{ count: number }>>(
      "SELECT COUNT(*) as count FROM reports WHERE id LIKE ?",
      [`RPT-${year}-%`]
    )
    const nextNumber = ((countResult[0]?.count ?? 0) + 1).toString().padStart(10, '0')
    const reportId = `RPT-${year}-${nextNumber}`
    await query(
      `INSERT INTO reports (
        id, user_id, incident_type, description, location, latitude, longitude, 
        severity, image_urls, video_urls, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        reportId,
        userId,
        type,
        description,
        location,
        latitude || null,
        longitude || null,
        priority || "medium",
        imageUrls ? JSON.stringify(imageUrls) : null,
        videoUrls ? JSON.stringify(videoUrls) : null
      ]
    )

    // Auto-assign emergency services for serious incidents
    const needsEmergencyServices = 
      type === 'accident' || 
      type === 'emergency' || 
      priority === 'critical' || 
      priority === 'high' ||
      requestEmergency ||
      requestTowing

    if (needsEmergencyServices && latitude && longitude) {
      const serviceTypes = []
      
      if (type === 'accident' || type === 'emergency' || requestEmergency) {
        serviceTypes.push('police', 'ambulance')
      }
      
      if (type === 'vehicle_breakdown' || requestTowing) {
        serviceTypes.push('towing')
      }
      
      if (type === 'emergency' && priority === 'critical') {
        serviceTypes.push('fire')
      }

      if (serviceTypes.length > 0) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emergency-services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportId,
              serviceTypes,
              latitude,
              longitude
            })
          })
        } catch (error) {
          console.error('Failed to auto-assign emergency services:', error)
        }
      }
    }

    // Update driver report count if vehicle number is provided
    if (vehicleNumber && ['reckless_driving', 'overloading', 'driver_misconduct', 'overcharging'].includes(type)) {
      try {
        await query(
          'UPDATE users SET reported_count = reported_count + 1, is_flagged = CASE WHEN reported_count >= 2 THEN true ELSE is_flagged END WHERE vehicle_number = ? AND role = "driver"',
          [vehicleNumber]
        )
      } catch (error) {
        console.error('Failed to update driver report count:', error)
      }
    }

    // Route report to nearest DVLA office admin if location provided
    if (latitude && longitude) {
      try {
        const offices = await query<Array<{ id: string; office_name: string; latitude: number; longitude: number; distance: number }>>(
          `SELECT id, office_name, latitude, longitude,
           (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
           FROM dvla_offices WHERE is_active = true
           ORDER BY distance LIMIT 1`,
          [latitude, longitude, latitude]
        )
        
        if (offices.length > 0) {
          await query(
            'UPDATE reports SET assigned_dvla_office = ? WHERE id = ?',
            [offices[0].id, reportId]
          )
        }
      } catch (error) {
        console.error('Failed to assign DVLA office:', error)
      }
    }

    const [report] = await query("SELECT * FROM reports WHERE id = ?", [reportId])
    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("Create report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
