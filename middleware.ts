import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.amazonaws.com https://*.s3.amazonaws.com; media-src 'self' blob: https://*.amazonaws.com; connect-src 'self' https://*.amazonaws.com;"
}

// Rate limiting store (in-memory, resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  entry.count += 1
  if (entry.count > limit) return false
  return true
}

export function middleware(request: NextRequest) {
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Apply rate limiting
  if (!rateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // Create response with security headers
  const response = NextResponse.next()
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}