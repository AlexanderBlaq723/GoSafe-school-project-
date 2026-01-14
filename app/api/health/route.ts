import { type NextRequest, NextResponse } from "next/server"
import { testConnection, queryDatabase } from "@/lib/db"

/**
 * Health check endpoint to test database connectivity
 * GET /api/health
 */
export async function GET(request: NextRequest) {
    try {
        // Test main database connection
        const connectionTest = await testConnection()

        if (!connectionTest.success) {
            return NextResponse.json({
                status: "error",
                message: "Database connection failed",
                error: connectionTest.error,
                config: connectionTest.config,
            }, { status: 503 })
        }

        // Test queries on all databases
        const databases = ['user_database', 'incident_emergency', 'logs_audit', 'ride_location']
        const databaseStatus: Record<string, any> = {}

        for (const db of databases) {
            try {
                const tables = await queryDatabase<{ TABLE_NAME: string }>(
                    db,
                    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
                    [db]
                )
                databaseStatus[db] = {
                    status: "ok",
                    tables: tables.map(t => t.TABLE_NAME),
                    tableCount: tables.length,
                }
            } catch (error) {
                databaseStatus[db] = {
                    status: "error",
                    error: error instanceof Error ? error.message : String(error),
                }
            }
        }

        return NextResponse.json({
            status: "ok",
            message: "Database connection successful",
            connectionConfig: connectionTest.config,
            databases: databaseStatus,
            timestamp: new Date().toISOString(),
        }, { status: 200 })

    } catch (error) {
        console.error("Health check error:", error)
        return NextResponse.json({
            status: "error",
            message: "Health check failed",
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 })
    }
}
