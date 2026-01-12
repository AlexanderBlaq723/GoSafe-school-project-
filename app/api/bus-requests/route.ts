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
      `INSERT INTO bus_requests (id, passenger_id, location, pickup_latitude, pickup_longitude, destination, passenger_count, is_peak_hour) 
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
    const passengerId = searchParams.get('passengerId')
    const getHotSpots = searchParams.get('hotSpots')
    const adminView = searchParams.get('adminView')

    if (getHotSpots === 'true') {
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

    if (passengerId) {
      console.log("Fetching requests for passenger ID:", passengerId)
      // Get passenger's requests
      const requests = await query(
        `SELECT * FROM bus_requests WHERE passenger_id = ? ORDER BY request_time DESC`,
        [passengerId]
      )
      
      // Get acceptances for each request
      for (const request of requests) {
        const acceptances = await query(
          `SELECT driver_name, driver_phone, bus_number, bus_capacity, accepted_at 
           FROM bus_acceptances WHERE request_id = ?`,
          [request.id]
        )
        request.acceptances = JSON.stringify(acceptances)
      }
      
      console.log("Found requests:", requests.length)
      return NextResponse.json({ requests })
    }

    if (adminView === 'true') {
      console.log("Admin view requested")
      // Get all requests
      const requests = await query(
        `SELECT * FROM bus_requests ORDER BY request_time DESC`
      )
      
      console.log("Found bus requests:", requests.length)
      
      // Get passenger and acceptances for each request
      for (const request of requests) {
        // Get passenger info
        const passenger = await query(
          `SELECT full_name FROM passengers WHERE passenger_id = ?`,
          [request.passenger_id]
        )
        request.passenger_name = passenger[0]?.full_name || 'Unknown'
        
        // Get acceptances
        const acceptances = await query(
          `SELECT driver_name, driver_phone, bus_number, bus_capacity, accepted_at 
           FROM bus_acceptances WHERE request_id = ?`,
          [request.id]
        )
        console.log(`Request ${request.id} has ${acceptances.length} acceptances`)
        request.acceptances = JSON.stringify(acceptances)
      }
      
      return NextResponse.json({ requests })
    }

    if (driverId) {
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
    console.log("Received body:", body)
    const { requestId, driverId, driverName, driverPhone, busNumber, busCapacity, action } = body

    if (!requestId || !action) {
      console.log("Missing requestId or action")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (action === 'accept') {
      if (!driverId || !driverName || !driverPhone || !busNumber || !busCapacity) {
        console.log("Missing fields:", { driverId, driverName, driverPhone, busNumber, busCapacity })
        return NextResponse.json({ error: "Bus details required" }, { status: 400 })
      }

      // Get current request details
      const requestData = await query(
        "SELECT passenger_count, total_capacity_accepted FROM bus_requests WHERE id = ?",
        [requestId]
      )

      if (!requestData[0]) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }

      const { passenger_count, total_capacity_accepted } = requestData[0]
      const newTotalCapacity = (total_capacity_accepted || 0) + parseInt(busCapacity)

      // Insert bus acceptance
      const acceptanceId = uuidv4()
      await query(
        `INSERT INTO bus_acceptances (id, request_id, driver_id, driver_name, driver_phone, bus_number, bus_capacity) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [acceptanceId, requestId, driverId, driverName, driverPhone, busNumber, busCapacity]
      )

      // Update request capacity
      const capacityFulfilled = newTotalCapacity >= passenger_count
      await query(
        `UPDATE bus_requests SET total_capacity_accepted = ?, capacity_fulfilled = ?, request_status = ? WHERE id = ?`,
        [newTotalCapacity, capacityFulfilled, capacityFulfilled ? 'accepted' : 'pending', requestId]
      )

      return NextResponse.json({ 
        message: capacityFulfilled ? "Request fully accepted" : "Partial acceptance recorded",
        capacityFulfilled,
        totalCapacity: newTotalCapacity,
        requiredCapacity: passenger_count
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Bus request update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}