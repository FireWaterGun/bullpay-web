export function extractToken(input: unknown): string | undefined {
  if (!input) return undefined
  if (typeof input === 'string') return input
  if (typeof input === 'object') {
    const obj: any = input
    // Direct string fields
    if (typeof obj.access_token === 'string') return obj.access_token
    if (typeof obj.accessToken === 'string') return obj.accessToken
    if (typeof obj.token === 'string') return obj.token
    if (typeof obj.jwt === 'string') return obj.jwt

    // Token object with value/type
    if (obj.token && typeof obj.token === 'object') {
      if (typeof obj.token.value === 'string') return obj.token.value
      if (typeof obj.token.access_token === 'string') return obj.token.access_token
    }

    // Nested under data
    if (obj.data) {
      const d = obj.data
      if (typeof d.access_token === 'string') return d.access_token
      if (typeof d.accessToken === 'string') return d.accessToken
      if (typeof d.token === 'string') return d.token
      if (typeof d.jwt === 'string') return d.jwt
      if (d.token && typeof d.token === 'object') {
        if (typeof d.token.value === 'string') return d.token.value
        if (typeof d.token.access_token === 'string') return d.token.access_token
      }
    }
  }
  return undefined
}
