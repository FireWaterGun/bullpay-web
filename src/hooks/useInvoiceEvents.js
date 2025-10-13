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

  // Update callbacks ref without triggering re-subscription
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!pusher || !isConnected || !userId) {
      return;
    }

    // Only re-subscribe if userId actually changed
    if (userIdRef.current === userId && channelRef.current) {
      return;
    }

    // Unsubscribe from old channel if exists
    if (channelRef.current && userIdRef.current !== userId) {
      const oldChannelName = `user.${userIdRef.current}.invoices`;
      channelRef.current.unbind_all();
      pusher.unsubscribe(oldChannelName);
      console.log(`Unsubscribed from ${oldChannelName}`);
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

    return () => {
      if (channelRef.current) {
        const channelName = `user.${userIdRef.current}.invoices`;
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
        console.log(`❌ Unsubscribed from ${channelName} (component unmount)`);
      }
    };
  }, [pusher, isConnected, userId]);

  return { isConnected };
}
