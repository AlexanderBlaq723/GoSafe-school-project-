import { query } from '@/lib/db'

export async function columnExists(table: string, column: string): Promise<boolean> {
  const rows: any[] = await query(
    `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  )
  return rows && rows[0] && rows[0].cnt > 0
}

export async function ensureColumn(table: string, column: string, definition: string): Promise<void> {
  const exists = await columnExists(table, column)
  if (!exists) {
    // Use backtick-quoted column name; definition is internal/hardcoded so safe
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
  }
}

export async function ensureAdminApprovalColumns(): Promise<void> {
  await ensureColumn('administrators', 'is_approved', 'BOOLEAN DEFAULT FALSE')
  await ensureColumn('administrators', 'approval_status', "VARCHAR(50) DEFAULT 'pending'")
  await ensureColumn('administrators', 'approved_by', 'VARCHAR(36) DEFAULT NULL')
  await ensureColumn('administrators', 'approved_at', 'TIMESTAMP NULL')
}
