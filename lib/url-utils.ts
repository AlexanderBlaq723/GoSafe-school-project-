export function safeParseUrls(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}
