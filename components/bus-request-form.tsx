"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export default function BusRequestForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    location: "",
    destination: "",
    passengerCount: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Get user's current location
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords

        const response = await fetch("/api/bus-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passengerId: user.id,
            location: formData.location,
            latitude,
            longitude,
            destination: formData.destination,
            passengerCount: formData.passengerCount
          })
        })

        const data = await response.json()
        
        if (response.ok) {
          alert(data.message)
          setFormData({ location: "", destination: "", passengerCount: 1 })
        } else {
          alert(data.error)
        }
      }, (error) => {
        alert("Please enable location access to request a bus")
      })
    } catch (error) {
      alert("Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Request Bus</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="location">Pickup Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Enter pickup location"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="destination">Destination (Optional)</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
              placeholder="Enter destination"
            />
          </div>
          
          <div>
            <Label htmlFor="passengerCount">Number of Passengers</Label>
            <Input
              id="passengerCount"
              type="number"
              min="1"
              value={formData.passengerCount}
              onChange={(e) => setFormData({...formData, passengerCount: parseInt(e.target.value) || 1})}
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Request Bus"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}