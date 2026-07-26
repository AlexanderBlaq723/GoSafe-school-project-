export function safeLog(message: string, data?: unknown): void {
  const sanitize = (val: unknown): string => {
    if (val === undefined || val === null) return ''
    const str = typeof val === 'string' ? val : JSON.stringify(val)
    return str.replace(/[\r\n]/g, ' ')
  }
  console.log(message, data !== undefined ? sanitize(data) : '')
}

export function safeLogError(message: string, error: unknown): void {
  const sanitize = (val: unknown): string => {
    const str = val instanceof Error ? val.message : String(val)
    return str.replace(/[\r\n]/g, ' ')
  }
  console.error(message, sanitize(error))
}
