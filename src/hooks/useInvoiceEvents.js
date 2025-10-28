import { useEffect, useRef } from 'react';
import { usePusher } from '../context/PusherContext';

/**
 * Hook to subscribe to invoice events via Pusher
 * @param {string} invoiceId - Invoice ID to subscribe to
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onPaymentReceived - Called when payment is received
 * @param {Function} callbacks.onStatusChanged - Called when invoice status changes
 * @param {Function} callbacks.onUpdated - Called when invoice is updated
 */
export function useInvoiceEvents(invoiceId, callbacks = {}) {
  const { pusher, isConnected } = usePusher();
  const channelRef = useRef(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref up to date
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!pusher || !isConnected || !invoiceId) {
      return;
    }

    // Subscribe to invoice-specific channel
    const channelName = `invoice.${invoiceId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    console.log(`Subscribed to ${channelName}`);

    // Bind event handlers
    channel.bind('payment.received', (data) => {
      console.log('Payment received event:', data);
      if (callbacksRef.current.onPaymentReceived) {
        callbacksRef.current.onPaymentReceived(data);
      }
    });

    channel.bind('invoice.status.changed', (data) => {
      console.log('Invoice status changed event:', data);
      if (callbacksRef.current.onStatusChanged) {
        callbacksRef.current.onStatusChanged(data);
      }
    });

    channel.bind('invoice.updated', (data) => {
      console.log('Invoice updated event:', data);
      if (callbacksRef.current.onUpdated) {
        callbacksRef.current.onUpdated(data);
      }
    });

    // Cleanup on unmount or when invoiceId changes
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
        console.log(`Unsubscribed from ${channelName}`);
      }
    };
  }, [pusher, isConnected, invoiceId]);

  return { isConnected };
}

/**
 * Hook to subscribe to all invoice events for a user
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onInvoiceCreated - Called when new invoice is created
 * @param {Function} callbacks.onInvoiceUpdated - Called when any invoice is updated
 * @param {Function} callbacks.onPaymentReceived - Called when payment is received on any invoice
 */
export function useUserInvoiceEvents(userId, callbacks = {}) {
  const { pusher, isConnected } = usePusher();
  const channelRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  const userIdRef = useRef(userId);
  const pusherRef = useRef(pusher);
  const isConnectedRef = useRef(isConnected);
  const isSubscribingRef = useRef(false);
  const isUnmountingRef = useRef(false);

  console.log('[useUserInvoiceEvents] 📊 State:', {
    userId,
    hasPusher: !!pusher,
    isConnected,
    hasChannel: !!channelRef.current,
    hasCallbacks: !!callbacks
  });

  // Keep refs up to date without triggering re-subscription
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    pusherRef.current = pusher;
    isConnectedRef.current = isConnected;
    if (isConnected) {
      console.log('[useUserInvoiceEvents] ✅ Pusher connection ready');
    }
  }, [pusher, isConnected]);

  useEffect(() => {
    console.log('[useUserInvoiceEvents] 🔄 useEffect triggered with userId:', userId);
    
    if (!pusher || !isConnected || !userId) {
      console.log(`[useUserInvoiceEvents] ⏸️ Waiting for Pusher connection... (pusher=${!!pusher}, connected=${isConnected}, userId=${userId})`);
      return;
    }

    console.log('[useUserInvoiceEvents] ✅ All conditions met, proceeding...');
    console.log('[useUserInvoiceEvents] 📌 Refs:', {
      userIdRef: userIdRef.current,
      hasChannel: !!channelRef.current,
      isSubscribing: isSubscribingRef.current
    });

    // Prevent double subscription
    if (isSubscribingRef.current) {
      console.log(`[useUserInvoiceEvents] 🔄 Already subscribing, skipping...`);
      return;
    }

    // Only re-subscribe if userId actually changed
    if (userIdRef.current === userId && channelRef.current) {
      console.log(`[useUserInvoiceEvents] ✅ Already subscribed to user.${userId}.invoices, skipping re-subscription`);
      return;
    }

    console.log('[useUserInvoiceEvents] 🚀 Starting subscription process...');

    isSubscribingRef.current = true;

    // Unsubscribe from old channel if exists
    if (channelRef.current && userIdRef.current !== userId) {
      const oldChannelName = `user.${userIdRef.current}.invoices`;
      channelRef.current.unbind_all();
      pusher.unsubscribe(oldChannelName);
      console.log(`🔄 Unsubscribed from ${oldChannelName} (userId changed)`);
    }

    userIdRef.current = userId;

    // Subscribe to user-specific invoice channel
    const channelName = `user.${userId}.invoices`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    console.log(`✅ Subscribed to ${channelName}`);

    channel.bind('invoice.created', (data) => {
      console.log('📝 Invoice created event:', data);
      if (callbacksRef.current.onInvoiceCreated) {
        callbacksRef.current.onInvoiceCreated(data);
      }
    });

    channel.bind('invoice.updated', (data) => {
      console.log('📝 Invoice updated event:', data);
      if (callbacksRef.current.onInvoiceUpdated) {
        callbacksRef.current.onInvoiceUpdated(data);
      }
    });

    channel.bind('invoice.status.changed', (data) => {
      console.log('🔄 Invoice status changed event:', data);
      if (callbacksRef.current.onStatusChanged) {
        callbacksRef.current.onStatusChanged(data);
      }
    });

    channel.bind('payment.received', (data) => {
      console.log('💰 Payment received event:', data);
      if (callbacksRef.current.onPaymentReceived) {
        callbacksRef.current.onPaymentReceived(data);
      }
    });

    isSubscribingRef.current = false;

    return () => {
      // Mark that cleanup is running
      isUnmountingRef.current = true;
      
      // Only unsubscribe if userId is changing or component is truly unmounting
      // Don't unsubscribe when isConnected changes from false to true
      const isUserIdChanging = userIdRef.current !== userId;
      const shouldCleanup = isUserIdChanging || !pusher || !isConnected;
      
      console.log('[useUserInvoiceEvents] 🧹 Cleanup running:', {
        hasChannel: !!channelRef.current,
        isUserIdChanging,
        shouldCleanup,
        currentUserId: userIdRef.current,
        newUserId: userId
      });
      
      if (channelRef.current && (isUserIdChanging || !pusher)) {
        const channelName = `user.${userIdRef.current}.invoices`;
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
        console.log(`❌ Unsubscribed from ${channelName} (cleanup)`);
      }
      
      // Reset flag after cleanup
      setTimeout(() => {
        isUnmountingRef.current = false;
      }, 0);
    };
  }, [userId, isConnected, pusher]); // Re-run when connection is ready

  return { isConnected };
}
