import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Check if current time is peak hour (7-9 AM, 5-7 PM)
function isPeakHour(): boolean {
  const now = new Date()
  const hour = now.getHours()
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { passengerId, location, latitude, longitude, destination, passengerCount } = body

    if (!passengerId || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const requestId = uuidv4()
    const isPeak = isPeakHour()

    // Create bus request
    await query(
      `INSERT INTO bus_requests (request_id, passenger_id, location, pickup_latitude, pickup_longitude, destination, passenger_count, is_peak_hour) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [requestId, passengerId, location, latitude, longitude, destination, passengerCount || 1, isPeak]
    )

    // Check for hot spots (5+ requests in same area during peak hours)
    if (isPeak && latitude && longitude) {
      const nearbyRequests = await query(
        `SELECT COUNT(*) as count FROM bus_requests 
         WHERE ABS(pickup_latitude - ?) < 0.01 AND ABS(pickup_longitude - ?) < 0.01 
         AND request_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
         AND request_status = 'pending'`,
        [latitude, longitude]
      )

      const isHotSpot = nearbyRequests[0]?.count >= 5

      return NextResponse.json({ 
        requestId, 
        isHotSpot,
        message: isHotSpot ? "High demand area - drivers will be notified" : "Bus request submitted"
      })
    }

    return NextResponse.json({ requestId, message: "Bus request submitted" })
  } catch (error) {
    console.error("Bus request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')
    const getHotSpots = searchParams.get('hotSpots')

    if (getHotSpots === 'true') {
      // Return hot spots for map
      const hotSpots = await query(
        `SELECT location, pickup_latitude as latitude, pickup_longitude as longitude, COUNT(*) as request_count
         FROM bus_requests 
         WHERE request_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR) 
         AND request_status = 'pending'
         AND is_peak_hour = true
         GROUP BY location, pickup_latitude, pickup_longitude
         HAVING COUNT(*) >= 5`
      )
      return NextResponse.json({ hotSpots })
    }

    if (driverId) {
      // Return pending requests for driver
      const requests = await query(
        "SELECT * FROM bus_requests WHERE request_status = 'pending' ORDER BY is_peak_hour DESC, request_time ASC"
      )
      return NextResponse.json({ requests })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Bus request fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, driverId, busId, action } = body

    if (!requestId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (action === 'accept' && driverId && busId) {
      await query(
        "UPDATE bus_requests SET request_status = 'assigned', driver_id = ?, bus_id = ? WHERE request_id = ?",
        [driverId, busId, requestId]
      )
      return NextResponse.json({ message: "Request accepted" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Bus request update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}