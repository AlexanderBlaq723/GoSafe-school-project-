import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const offices = await query<any[]>(
      'SELECT id, office_name, office_number, branch_location, region FROM dvla_offices WHERE is_active = true ORDER BY region, office_name'
    )
    
    return NextResponse.json({ offices })
  } catch (error) {
    console.error('DVLA offices fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch DVLA offices' }, { status: 500 })
  }
}