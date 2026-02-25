import { useEffect, useRef } from 'react';
import { usePusher } from '../context/PusherContext';

/**
 * Hook to subscribe to invoice events via Pusher
 * @param {string} invoiceId - Invoice ID to subscribe to
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onPaymentReceived - Called when payment is received
 * @param {Function} callbacks.onStatusChanged - Called when invoice status changes
 * @param {Function} callbacks.onUpdated - Called when invoice is updated
 * @param {Function} callbacks.onPaymentCompleted - Called when payment is completed
 * @param {Function} callbacks.onWithdrawalCompleted - Called when withdrawal is completed
 */
export function useInvoiceEvents(invoiceId, callbacks = {}) {
  const { pusher, isConnected } = usePusher();
  const channelRef = useRef(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref up to date (intentionally no deps — runs every render)
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!pusher || !isConnected || !invoiceId) return;

    const channelName = `private-invoice.${invoiceId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('payment.received', (data) => {
      callbacksRef.current.onPaymentReceived?.(data);
    });

    channel.bind('invoice.status.changed', (data) => {
      callbacksRef.current.onStatusChanged?.(data);
    });

    channel.bind('invoice.updated', (data) => {
      callbacksRef.current.onUpdated?.(data);
    });

    channel.bind('payment_completed', (data) => {
      callbacksRef.current.onPaymentCompleted?.(data);
    });

    channel.bind('withdrawal_completed', (data) => {
      callbacksRef.current.onWithdrawalCompleted?.(data);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [pusher, isConnected, invoiceId]);

  return { isConnected };
}

/**
 * Hook to subscribe to all notification events for a user
 * @param {string} userId - User ID to subscribe to
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onInvoiceCreated - Called when new invoice is created
 * @param {Function} callbacks.onInvoiceUpdated - Called when any invoice is updated
 * @param {Function} callbacks.onPaymentReceived - Called when payment is received on any invoice
 * @param {Function} callbacks.onPaymentCompleted - Called when payment is completed
 * @param {Function} callbacks.onWithdrawalCompleted - Called when withdrawal is completed
 * @param {Function} callbacks.onInvoiceExpired - Called when invoice expires
 * @param {Function} callbacks.onWithdrawalApproved - Called when withdrawal is approved
 * @param {Function} callbacks.onWithdrawalRejected - Called when withdrawal is rejected
 * @param {Function} callbacks.onMerchantApproved - Called when merchant account is approved
 * @param {Function} callbacks.onWithdrawalAddressApproved - Called when withdrawal address is approved
 */
export function useUserInvoiceEvents(userId, callbacks = {}) {
  const { pusher, isConnected } = usePusher();
  const channelRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  const userIdRef = useRef(userId);
  const isSubscribingRef = useRef(false);

  // Keep callbacks ref up to date (intentionally no deps — runs every render)
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!pusher || !isConnected || !userId) return;

    // Prevent double subscription
    if (isSubscribingRef.current) return;

    // Only re-subscribe if userId actually changed
    if (userIdRef.current === userId && channelRef.current) return;

    isSubscribingRef.current = true;

    // Unsubscribe from old channel if userId changed
    if (channelRef.current && userIdRef.current !== userId) {
      const oldChannelName = `private-user.${userIdRef.current}.notifications`;
      channelRef.current.unbind_all();
      pusher.unsubscribe(oldChannelName);
    }

    userIdRef.current = userId;

    const channelName = `private-user.${userId}.notifications`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('invoice.created', (data) => {
      callbacksRef.current.onInvoiceCreated?.(data);
    });

    channel.bind('invoice.updated', (data) => {
      callbacksRef.current.onInvoiceUpdated?.(data);
    });

    channel.bind('invoice.status.changed', (data) => {
      callbacksRef.current.onStatusChanged?.(data);
    });

    channel.bind('payment.received', (data) => {
      callbacksRef.current.onPaymentReceived?.(data);
    });

    channel.bind('payment_completed', (data) => {
      callbacksRef.current.onPaymentCompleted?.(data);
    });

    channel.bind('withdrawal_completed', (data) => {
      callbacksRef.current.onWithdrawalCompleted?.(data);
    });

    channel.bind('invoice_expired', (data) => {
      callbacksRef.current.onInvoiceExpired?.(data);
    });

    channel.bind('withdrawal_approved', (data) => {
      callbacksRef.current.onWithdrawalApproved?.(data);
    });

    channel.bind('withdrawal_rejected', (data) => {
      callbacksRef.current.onWithdrawalRejected?.(data);
    });

    channel.bind('merchant_approved', (data) => {
      callbacksRef.current.onMerchantApproved?.(data);
    });

    channel.bind('withdrawal_address_approved', (data) => {
      callbacksRef.current.onWithdrawalAddressApproved?.(data);
    });

    isSubscribingRef.current = false;

    return () => {
      if (channelRef.current) {
        const chName = `private-user.${userIdRef.current}.notifications`;
        channelRef.current.unbind_all();
        if (pusher) pusher.unsubscribe(chName);
        channelRef.current = null;
      }
    };
  }, [userId, isConnected, pusher]);

  return { isConnected };
}

/**
 * Hook to subscribe to system-wide notification events (admin only)
 * Channel: private-system.notifications
 * @param {boolean} isAdmin - Whether the current user is an admin
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onSweepCompleted - Called when sweep is completed
 */
export function useSystemNotifications(isAdmin, callbacks = {}) {
  const { pusher, isConnected } = usePusher();
  const channelRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  const isSubscribingRef = useRef(false);

  // Keep callbacks ref up to date (intentionally no deps — runs every render)
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!pusher || !isConnected || !isAdmin) return;
    if (isSubscribingRef.current || channelRef.current) return;

    isSubscribingRef.current = true;

    const channelName = 'private-system.notifications';
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('sweep_completed', (data) => {
      callbacksRef.current.onSweepCompleted?.(data);
    });

    isSubscribingRef.current = false;

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [isAdmin, isConnected, pusher]);

  return { isConnected };
}
