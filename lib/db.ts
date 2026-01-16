import mysql from "mysql2/promise"

// Serverless-friendly connection pool management
let pool: mysql.Pool | null = null
let lastPoolConfig: string | null = null

/**
 * Parse DATABASE_URL format: mysql://user:password@host:port/database
 * Falls back to individual environment variables if DATABASE_URL is not set
 */
function getConnectionConfig(database?: string) {
  const databaseUrl = process.env.DATABASE_URL

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl)
      return {
        host: url.hostname,
        port: Number.parseInt(url.port || "3306"),
        user: url.username,
        password: url.password,
        database: database || url.pathname.slice(1) || "user_database",
      }
    } catch (error) {
      console.error("Failed to parse DATABASE_URL:", error)
      // Fall through to individual env vars
    }
  }

  // Use individual environment variables
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: database || process.env.DB_NAME || "user_database",
  }
}

/**
 * Get or create a connection pool optimized for serverless environments
 * In Vercel, each function invocation may get a fresh Node.js context
 */
export function getPool(database?: string): mysql.Pool {
  const config = getConnectionConfig(database)
  const configHash = JSON.stringify(config)

  // Recreate pool if configuration changed (e.g., different database requested)
  if (!pool || configHash !== lastPoolConfig) {
    // Close existing pool if it exists
    if (pool) {
      pool.end().catch(err => console.error("Error closing old pool:", err))
    }

    // Determine SSL configuration
    let sslConfig: any
    if (process.env.DB_SSL === "false") {
      sslConfig = false
    } else {
      // Enable SSL for cloud databases like Aiven
      sslConfig = {
        rejectUnauthorized: false
      }
    }

    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: process.env.DB_CONNECTION_LIMIT
        ? Number.parseInt(process.env.DB_CONNECTION_LIMIT)
        : 5, // Lower limit for serverless (was 10)
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      multipleStatements: false,
      ssl: sslConfig,
      // Add connection timeout settings
      connectTimeout: 10000, // 10 seconds
      // Timezone handling
      timezone: process.env.DB_TIMEZONE || "Z",
    })

    lastPoolConfig = configHash

    // Log connection configuration (safely, without passwords)
    if (process.env.NODE_ENV !== "production") {
      console.log("Database pool created:", {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
        ssl: sslConfig ? "enabled" : "disabled",
      })
    }
  }

  return pool
}

/**
 * Execute a query on the default database with error handling
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  let connection: mysql.PoolConnection | null = null

  try {
    connection = await getPool().getConnection()
    const [rows] = await connection.execute(sql, params)
    return rows as T[]
  } catch (error) {
    console.error("Database query error:", {
      error: error instanceof Error ? error.message : String(error),
      sql: sql.substring(0, 100), // Log first 100 chars of SQL for debugging
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      sqlState: (error as any)?.sqlState,
    })
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/**
 * Execute a query on a specific database
 */
export async function queryDatabase<T = any>(
  database: string,
  sql: string,
  params?: any[]
): Promise<T[]> {
  let connection: mysql.PoolConnection | null = null

  try {
    connection = await getPool().getConnection()
    await connection.query(`USE \`${database}\``)
    const [rows] = await connection.execute(sql, params)
    return rows as T[]
  } catch (error) {
    console.error("Database query error:", {
      database,
      error: error instanceof Error ? error.message : String(error),
      sql: sql.substring(0, 100),
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      sqlState: (error as any)?.sqlState,
    })
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

/**
 * Test database connectivity - useful for health checks
 */
export async function testConnection(): Promise<{
  success: boolean
  error?: string
  config: {
    host: string
    port: number
    user: string
    database: string
  }
}> {
  try {
    const config = getConnectionConfig()
    const connection = await getPool().getConnection()

    try {
      await connection.ping()
      return {
        success: true,
        config: {
          host: config.host,
          port: config.port,
          user: config.user,
          database: config.database,
        }
      }
    } finally {
      connection.release()
    }
  } catch (error) {
    const config = getConnectionConfig()
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      config: {
        host: config.host,
        port: config.port,
        user: config.user,
        database: config.database,
      }
    }
  }
}

/**
 * Close the connection pool (useful for cleanup in tests)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    lastPoolConfig = null
  }
}
