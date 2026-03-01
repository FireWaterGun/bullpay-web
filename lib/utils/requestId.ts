export function requestId(): string {
  try {
    const anyCrypto: any = (globalThis as any).crypto
    if (anyCrypto && typeof anyCrypto.randomUUID === 'function') {
      return anyCrypto.randomUUID()
    }
  } catch {}
  return `req-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
