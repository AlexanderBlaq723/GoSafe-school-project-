import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    let sql = `
      SELECT r.*, u.full_name as reporter_name, u.email as reporter_email
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `
    let params: any[] = []

    // Filter by user for non-admin roles
    if (role !== "admin" && userId) {
      sql = `
        SELECT r.*, u.full_name as reporter_name, u.email as reporter_email
        FROM reports r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
      `
      params = [userId]
    }

    const reports = await query(sql, params)
    return NextResponse.json({ reports }, { status: 200 })
  } catch (error) {
    console.error("[v0] Get reports error:", error)
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
      driverLicenseNumber,
      vehicleNumber,
      busNumber,
      requestTowing,
      requestEmergency,
      imageUrl,
    } = body

    if (!userId || !type || !title || !description || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const reportId = uuidv4()
    await query(
      `INSERT INTO reports (
        id, user_id, type, title, description, location, latitude, longitude, 
        priority, driver_license_number, vehicle_number, bus_number, 
        request_towing, request_emergency, image_url, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', NOW())`,
      [
        reportId,
        userId,
        type,
        title,
        description,
        location,
        latitude || null,
        longitude || null,
        priority || "medium",
        driverLicenseNumber || null,
        vehicleNumber || null,
        busNumber || null,
        requestTowing || false,
        requestEmergency || false,
        imageUrl || null,
      ],
    )

    const [report] = await query("SELECT * FROM reports WHERE id = ?", [reportId])
    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
