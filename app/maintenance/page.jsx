'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemStatus } from '@/lib/api/system';
import { usePusher } from '@/app/providers';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Spinner } from '../../components/ui'

const CHANNEL = 'system-maintenance';
const EVENT = 'maintenance-status-changed';
const POLL_INTERVAL = 30; // seconds

/**
 * Maintenance Mode Page
 *
 * Displayed when the API returns 503 SERVICE_MAINTENANCE.
 * Primary: Pusher real-time via `system-maintenance` channel (instant recovery).
 * Fallback: polls /api/v1/system/status every 30s.
 * Redirects back to the dashboard when system is back online.
 */

/* ── Inline styles (hoisted to avoid recreating on every render) ── */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  /* floating blurred circles for depth */
  blob1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    top: '-10%',
    left: '-8%',
    filter: 'blur(60px)',
    pointerEvents: 'none'
  },
  blob2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    bottom: '-5%',
    right: '-6%',
    filter: 'blur(50px)',
    pointerEvents: 'none'
  },
  card: {
    maxWidth: 480,
    width: '100%',
    borderRadius: 20,
    border: 'none',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(12px)',
    background: 'rgba(255,255,255,0.97)',
    position: 'relative',
    zIndex: 1
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 32px rgba(102,126,234,0.35)'
  },
  iconSvg: {
    width: 44,
    height: 44,
    color: '#fff'
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 8,
    letterSpacing: '-0.02em'
  },
  message: {
    fontSize: '1rem',
    color: '#718096',
    lineHeight: 1.6,
    marginBottom: 24,
    maxWidth: 380,
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  estimatedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecfb 100%)',
    border: '1px solid rgba(102,126,234,0.15)',
    borderRadius: 12,
    padding: '10px 18px',
    marginBottom: 28,
    fontSize: '0.875rem',
    color: '#4a5568'
  },
  /* circular countdown ring */
  countdownWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    margin: '0 auto 12px'
  },
  countdownText: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#667eea'
  },
  checkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 28px',
    borderRadius: 12,
    border: '2px solid #667eea',
    background: 'transparent',
    color: '#667eea',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  checkButtonHover: {
    background: '#667eea',
    color: '#fff'
  },
  footer: {
    marginTop: 32,
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.7)',
    zIndex: 1,
    position: 'relative'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32
  },
  brandIcon: {
    fontSize: 28,
    color: '#667eea'
  },
  brandText: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '-0.02em'
  }
};

/* Keyframes injected once via <style> tag */
const KEYFRAMES = `
@keyframes maintenance-pulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(102,126,234,0.35); }
  50% { box-shadow: 0 8px 48px rgba(102,126,234,0.55); }
}
@keyframes maintenance-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes maintenance-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

/* SVG circular progress ring */
function CountdownRing({ seconds, total }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / total * circumference;

  return (
    <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
      {/* background ring */}
      <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      {/* progress ring */}
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="url(#countdown-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        style={{ transition: 'stroke-dashoffset 1s linear' }} />
      
      <defs>
        <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>
    </svg>);

}

export default function MaintenancePage() {
  const { t } = useTranslation('common');
  const { fmtDateTime } = useDateFormat();
  const { subscribe, unsubscribe, isConnected } = usePusher() || {};
  const channelRef = useRef(null);
  const [info, setInfo] = useState({
    message: null,
    estimatedEnd: null
  });
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(POLL_INTERVAL);
  const [btnHover, setBtnHover] = useState(false);

  // Inject keyframes once
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'maintenance-keyframes';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  // Load maintenance info from sessionStorage on mount, then fetch fresh data from API
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('maintenance_info');
      if (stored) {
        setInfo(JSON.parse(stored));
      }
    } catch {

      // sessionStorage may not be available
    }
    // Immediately fetch fresh status (including estimatedEnd) from API
    getSystemStatus().
    then((status) => {
      if (!status.maintenance) {
        sessionStorage.removeItem('maintenance_info');
        window.location.href = '/';
        return;
      }
      setInfo({
        message: status.message,
        estimatedEnd: status.estimatedEnd
      });
    }).
    catch(() => {

      // API still down, keep sessionStorage data
    });}, []);

  // Check if maintenance has ended
  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const status = await getSystemStatus();
      if (!status.maintenance) {
        // Maintenance ended — redirect back
        sessionStorage.removeItem('maintenance_info');
        window.location.href = '/';
        return;
      }
      // Update info from fresh data
      setInfo({
        message: status.message,
        estimatedEnd: status.estimatedEnd
      });
    } catch {

      // API still down, stay on maintenance page
    } finally {setChecking(false);
      setCountdown(POLL_INTERVAL); // reset countdown
    }
  }, []);

  // Auto-poll every 30 seconds (primary for unauthenticated, fallback for Pusher)
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
    }, POLL_INTERVAL * 1000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  // Pusher real-time subscription (instant recovery when token available)
  useEffect(() => {
    if (!subscribe || !isConnected) return;

    const channel = subscribe(CHANNEL);
    channelRef.current = channel;

    if (channel) {
      channel.bind(EVENT, (data) => {
        if (!data.maintenance) {
          // Maintenance ended — redirect back immediately
          sessionStorage.removeItem('maintenance_info');
          window.location.href = '/';
          return;
        }
        // Pusher payload matches HTTP /system/status shape
        setInfo({
          message: data.message,
          estimatedEnd: data.estimatedEnd
        });
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        unsubscribe(CHANNEL);
        channelRef.current = null;
      }
    };
  }, [subscribe, unsubscribe, isConnected]);

  // Countdown timer (visual only)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const displayMessage = info.message;

  const formattedEstimatedEnd = info.estimatedEnd ?
  fmtDateTime(info.estimatedEnd) :
  null;

  return (
    <div style={styles.page}>
      {/* Decorative background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        <div className="text-center" style={{ padding: '48px 36px 40px' }}>
          {/* BullPay Brand */}
          <div style={styles.brand}>
            <i className="bx bxs-wallet-alt" style={styles.brandIcon}></i>
            <span style={styles.brandText}>
              <span className="text-surface-700">BULL</span>
              <span className="text-[#667eea]">PAY</span>
            </span>
          </div>

          {/* Animated Icon */}
          <div
            style={{
              ...styles.iconWrap,
              animation: 'maintenance-pulse 2.5s ease-in-out infinite, maintenance-float 3s ease-in-out infinite'
            }}>
            
            {/* Gear SVG icon */}
            <svg style={styles.iconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </div>

          {/* Title */}
          <h2 style={styles.title}>
            {t('maintenance.title', { defaultValue: 'System Maintenance' })}
          </h2>

          {/* Decorative divider */}
          <div className="w-12 h-[3px] rounded-sm" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', margin: '12px auto 20px' }} />

          {/* Message */}
          <p style={styles.message}>
            {displayMessage || t('maintenance.defaultMessage', { defaultValue: 'We are performing scheduled maintenance. Please check back shortly.' })}
          </p>

          {/* Estimated End */}
          {formattedEstimatedEnd &&
          <div style={styles.estimatedBadge}>
              <i className="bx bx-time-five text-[#667eea] text-[18px]"></i>
              <span>
                {t('maintenance.estimatedEnd', { defaultValue: 'Estimated recovery' })}:{' '}
                <strong className="text-surface-700">{formattedEstimatedEnd}</strong>
              </span>
            </div>
          }

          {/* Circular countdown + check button */}
          <div style={styles.countdownWrap}>
            <CountdownRing seconds={countdown} total={POLL_INTERVAL} />
            <div style={styles.countdownText}>{countdown}</div>
          </div>

          <p className="text-[0.8rem] text-surface-400 mb-5">
            {t('maintenance.autoCheck', { defaultValue: 'Auto-checking in {seconds}s' }).replace('{seconds}', String(countdown))}
          </p>

          <button
            style={{
              ...styles.checkButton,
              ...(btnHover ? styles.checkButtonHover : {}),
              ...(checking ? { opacity: 0.7, pointerEvents: 'none' } : {})
            }}
            onClick={checkStatus}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            disabled={checking}>
            
            {checking ?
            <>
                <Spinner

                role="status"
                aria-hidden="true" className="w-4 h-4" />
              
                {t('maintenance.checking', { defaultValue: 'Checking...' })}
              </> :

            <>
                <i className="bx bx-refresh text-[18px]"></i>
                {t('maintenance.checkNow', { defaultValue: 'Check Now' })}
              </>
            }
          </button>
        </div>
      </div>

      {/* Footer */}
      <p style={styles.footer}>
        &copy; {new Date().getFullYear()} BullPay
      </p>
    </div>);

}