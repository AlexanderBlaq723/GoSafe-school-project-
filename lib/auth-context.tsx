"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type UserRole = "passenger" | "driver" | "admin" | "towing_service" | "emergency_service"

interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  licenseNumber?: string
  vehicleNumber?: string
  phoneNumber?: string
  transportCompany?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role?: UserRole, licenseNumber?: string) => Promise<void>
  signup: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phoneNumber: string,
    licenseNumber?: string,
    vehicleNumber?: string,
    transportCompany?: string,
  ) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("user")
    const sessionExpiry = localStorage.getItem("sessionExpiry")
    
    if (storedUser && sessionExpiry) {
      const now = new Date().getTime()
      if (now < parseInt(sessionExpiry)) {
        setUser(JSON.parse(storedUser))
      } else {
        // Session expired, clear storage
        localStorage.removeItem("user")
        localStorage.removeItem("sessionExpiry")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role?: UserRole, licenseNumber?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, licenseNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      const userWithFullName = {
        ...data.user,
        fullName: data.user.FullName || data.user.full_name,
        phoneNumber: data.user.phone,
        licenseNumber: data.user.LicenseNumber || data.user.license_number,
        vehicleNumber: data.user.VehicleNumber || data.user.vehicle_number,
      }

      setUser(userWithFullName)
      
      // Set session expiry (24 hours)
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000)
      localStorage.setItem("user", JSON.stringify(userWithFullName))
      localStorage.setItem("sessionExpiry", expiryTime.toString())
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phoneNumber: string,
    licenseNumber?: string,
    vehicleNumber?: string,
    transportCompany?: string,
  ) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phoneNumber,
          role,
          licenseNumber,
          vehicleNumber,
          transportCompany,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      const userWithFullName = {
        ...data.user,
        fullName: data.user.FullName || data.user.full_name,
        phoneNumber: data.user.phone,
        licenseNumber: data.user.LicenseNumber || data.user.license_number,
        vehicleNumber: data.user.VehicleNumber || data.user.vehicle_number,
      }

      setUser(userWithFullName)
      
      // Set session expiry (24 hours)
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000)
      localStorage.setItem("user", JSON.stringify(userWithFullName))
      localStorage.setItem("sessionExpiry", expiryTime.toString())
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("sessionExpiry")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
