// Global audio context (reuse to avoid creating multiple contexts)
let audioContext = null;
let audioContextInitialized = false;

/**
 * Initialize audio context on first user interaction
 * Call this on any user click/touch event
 */
export function initAudioContext() {
  if (audioContextInitialized) return;
  
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        audioContextInitialized = true;
        console.log('Audio context initialized and ready');
      });
    } else {
      audioContextInitialized = true;
    }
  } catch (err) {
    console.warn('Failed to initialize audio context:', err);
  }
}

/**
 * Get audio context (creates if needed)
 */
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  // Try to resume if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(err => {
      console.warn('Failed to resume audio context:', err);
    });
  }
  
  return audioContext;
}

/**
 * Play notification sound
 * @param {string} type - Type of notification: 'success', 'info', 'warning', 'error'
 */
export function playNotificationSound(type = 'success') {
  try {
    const ctx = getAudioContext();
    
    // Skip if audio context is suspended (no user interaction yet)
    if (ctx.state === 'suspended') {
      console.log('Audio context suspended, skipping sound');
      return;
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Add low-pass filter for more natural sound
    filter.type = 'lowpass';
    filter.frequency.value = 2000; // Cut high frequencies
    filter.Q.value = 1;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure sound based on type
    switch (type) {
      case 'success':
        // Cash Register "Cha-ching!" sound
        // Use triangle wave for metallic bell-like quality
        oscillator.type = 'triangle';
        
        // "Cha" part - quick high note
        oscillator.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
        oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.05); // E6
        
        // "Ching!" part - ringing sustain
        oscillator.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.08); // G6
        
        // Sharp attack, ringing sustain (like a bell)
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01); // Quick attack
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); // Ring out
        
        // Adjust filter for metallic sound
        filter.frequency.value = 3000; // Allow more high frequencies for "ching"
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        return; // Early return to skip default envelope
        
      case 'info':
        // Lower, softer tone
        oscillator.frequency.setValueAtTime(329.63, ctx.currentTime); // E4 (lower)
        oscillator.type = 'sine';
        break;
      case 'warning':
        // Lower two tones
        oscillator.frequency.setValueAtTime(220, ctx.currentTime); // A3
        oscillator.frequency.setValueAtTime(246.94, ctx.currentTime + 0.15); // B3
        oscillator.type = 'sine';
        break;
      case 'error':
        // Lower descending tone
        oscillator.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
        oscillator.frequency.setValueAtTime(196, ctx.currentTime + 0.15); // G3
        oscillator.type = 'sine';
        break;
      default:
        oscillator.frequency.setValueAtTime(220, ctx.currentTime); // A3
        oscillator.type = 'sine';
    }
    
    // Default envelope (for non-success sounds) - softer
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);

    // Cleanup (don't close the global context)
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
      filter.disconnect();
    };
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Show browser notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export async function showBrowserNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return;
  }

  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
}

/**
 * Combined notification: sound + browser notification
 */
export async function notifyPaymentReceived(invoiceData) {
  playNotificationSound('success');
  
  await showBrowserNotification('Payment Received! 🎉', {
    body: `Invoice ${invoiceData.invoiceNumber || invoiceData.id} has been paid`,
    tag: `invoice-${invoiceData.id}`,
  });
}

export async function notifyInvoiceUpdated(invoiceData) {
  playNotificationSound('info');
  
  await showBrowserNotification('Invoice Updated', {
    body: `Invoice ${invoiceData.invoiceNumber || invoiceData.id} has been updated`,
    tag: `invoice-${invoiceData.id}`,
  });
}
