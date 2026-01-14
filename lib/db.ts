import mysql from "mysql2/promise"

let pool: mysql.Pool | null = null

export function getPool(database?: string) {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: database || process.env.DB_NAME || "user_database",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: false,
      // Aiven and many cloud DBs require SSL
      ssl: process.env.DB_SSL === "false" ? undefined : {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true"
      },
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.execute(sql, params)
    return rows as T[]
  } finally {
    connection.release()
  }
}

// Query specific database
export async function queryDatabase<T = any>(database: string, sql: string, params?: any[]): Promise<T[]> {
  const connection = await getPool().getConnection()
  try {
    await connection.query(`USE ${database}`)
    const [rows] = await connection.execute(sql, params)
    return rows as T[]
  } finally {
    connection.release()
  }
}
