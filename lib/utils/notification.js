import { logger } from '@/lib/utils/logger'
// Global audio context (reuse to avoid creating multiple contexts)
let audioContext = null
let audioContextInitialized = false

// Fallback: pre-generated WAV blob URLs for when AudioContext is suspended
const fallbackUrls = {}
let fallbackReady = false

// ---------------------------------------------------------------------------
// WAV generator — produces a tiny in-memory WAV for fallback playback
// ---------------------------------------------------------------------------
function generateWav(tones, duration, volume) {
  const sampleRate = 44100
  const numSamples = Math.floor(sampleRate * duration)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const writeStr = (off, s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    // Find which tone segment we're in
    const segDur = duration / tones.length
    const segIdx = Math.min(tones.length - 1, Math.floor(t / segDur))
    const freq = tones[segIdx]
    // Envelope: quick attack, exponential decay
    const attack = Math.min(1, t / 0.01)
    const decay = Math.exp((-3 * t) / duration)
    const sample = Math.sin(2 * Math.PI * freq * t) * volume * attack * decay
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true)
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

function ensureFallbackUrls() {
  if (fallbackReady) return
  fallbackUrls.success = generateWav([1046, 1318, 1568], 0.5, 0.4)
  fallbackUrls.info = generateWav([330], 0.3, 0.2)
  fallbackUrls.warning = generateWav([220, 247], 0.3, 0.2)
  fallbackUrls.error = generateWav([262, 196], 0.3, 0.2)
  fallbackReady = true
}

/**
 * Initialize audio context on first user interaction
 * Call this on any user click/touch event
 */
export async function initAudioContext() {
  if (audioContextInitialized) {
    return
  }

  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    audioContextInitialized = true
  } catch (err) {
    logger.warn('[Notification] Failed to initialize audio context:', err)
  }

  // Pre-generate fallback WAV blobs & unlock HTMLAudioElement
  ensureFallbackUrls()
  try {
    const a = new Audio(fallbackUrls.success)
    a.volume = 0
    await a.play()
    a.pause()
  } catch {
    /* ignore — unlock best-effort */
  }
}

// ---------------------------------------------------------------------------
// Play via Web Audio API (oscillator)
// ---------------------------------------------------------------------------
function playWithWebAudio(type) {
  const ctx = audioContext
  if (!ctx || ctx.state !== 'running') return false

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    filter.type = 'lowpass'
    filter.frequency.value = 2000
    filter.Q.value = 1

    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    const cleanup = () => {
      try {
        oscillator.disconnect()
      } catch {}
      try {
        gainNode.disconnect()
      } catch {}
      try {
        filter.disconnect()
      } catch {}
    }
    oscillator.onended = cleanup

    switch (type) {
      case 'success':
        oscillator.type = 'triangle'
        oscillator.frequency.setValueAtTime(1046.5, ctx.currentTime)
        oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.05)
        oscillator.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.08)
        gainNode.gain.setValueAtTime(0, ctx.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        filter.frequency.value = 3000
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
        return true

      case 'info':
        oscillator.frequency.setValueAtTime(329.63, ctx.currentTime)
        oscillator.type = 'sine'
        break
      case 'warning':
        oscillator.frequency.setValueAtTime(220, ctx.currentTime)
        oscillator.frequency.setValueAtTime(246.94, ctx.currentTime + 0.15)
        oscillator.type = 'sine'
        break
      case 'error':
        oscillator.frequency.setValueAtTime(261.63, ctx.currentTime)
        oscillator.frequency.setValueAtTime(196, ctx.currentTime + 0.15)
        oscillator.type = 'sine'
        break
      default:
        oscillator.frequency.setValueAtTime(220, ctx.currentTime)
        oscillator.type = 'sine'
    }

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Play via HTMLAudioElement fallback (works when AudioContext is suspended)
// ---------------------------------------------------------------------------
async function playWithAudioElement(type) {
  ensureFallbackUrls()
  const url = fallbackUrls[type] || fallbackUrls.info
  if (!url) return false

  try {
    const audio = new Audio(url)
    audio.volume = type === 'success' ? 0.4 : 0.2
    await audio.play()
    return true
  } catch {
    return false
  }
}

/**
 * Play notification sound
 * @param {string} type - Type of notification: 'success', 'info', 'warning', 'error'
 */
export async function playNotificationSound(type = 'success') {
  // Try to resume AudioContext first
  if (audioContext && audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
    } catch {
      /* ignore */
    }
  }

  // Strategy 1: Web Audio API (best quality)
  if (playWithWebAudio(type)) return

  // Strategy 2: HTMLAudioElement fallback (works in background tabs)
  const played = await playWithAudioElement(type)
  if (!played) {
    logger.warn('[Notification] All audio methods failed for type:', type)
  }
}

/**
 * Show browser notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export async function showBrowserNotification(title, options = {}) {
  if (!('Notification' in window)) {
    logger.warn('Browser does not support notifications')
    return
  }

  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000)

    return notification
  }
}

/**
 * Combined notification: sound + browser notification
 */
export async function notifyPaymentReceived(invoiceData) {
  playNotificationSound('success')

  await showBrowserNotification('Payment Received! 🎉', {
    body: `Invoice ${invoiceData.invoiceNumber || invoiceData.id} has been paid`,
    tag: `invoice-${invoiceData.id}`,
  })
}

export async function notifyInvoiceUpdated(invoiceData) {
  playNotificationSound('info')

  await showBrowserNotification('Invoice Updated', {
    body: `Invoice ${invoiceData.invoiceNumber || invoiceData.id} has been updated`,
    tag: `invoice-${invoiceData.id}`,
  })
}
