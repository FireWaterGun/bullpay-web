import { createContext, useContext, useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';

const PusherContext = createContext(null);

export function PusherProvider({ children }) {
  const [pusher, setPusher] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef(null);

  useEffect(() => {
    // Get Pusher config from environment variables
    const appKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';
    const wsHost = import.meta.env.VITE_PUSHER_WS_HOST;
    const wsPort = import.meta.env.VITE_PUSHER_WS_PORT;
    const forceTLS = import.meta.env.VITE_PUSHER_FORCE_TLS !== 'false';

    console.log('[PusherContext] 🔧 Pusher Config:', {
      appKey: appKey ? `${appKey.substring(0, 8)}...` : 'NOT SET',
      cluster,
      wsHost,
      wsPort,
      forceTLS
    });

    if (!appKey) {
      console.warn('⚠️ Pusher app key not configured. Real-time updates disabled.');
      return;
    }

    console.log('[PusherContext] 🚀 Initializing Pusher...');

    // Initialize Pusher
    const pusherConfig = {
      cluster,
      forceTLS,
      enabledTransports: ['ws', 'wss'],
    };

    // Support custom host for self-hosted Pusher/Soketi
    if (wsHost) {
      pusherConfig.wsHost = wsHost;
      pusherConfig.httpHost = wsHost;
    }
    if (wsPort) {
      pusherConfig.wsPort = parseInt(wsPort, 10);
      pusherConfig.httpPort = parseInt(wsPort, 10);
    }

    const pusherInstance = new Pusher(appKey, pusherConfig);
    pusherRef.current = pusherInstance;
    setPusher(pusherInstance);

    console.log('[PusherContext] ✅ Pusher instance created');
    console.log('[PusherContext] 🔌 Connection state:', pusherInstance.connection.state);

    // Connection state handlers
    pusherInstance.connection.bind('state_change', (states) => {
      console.log('[PusherContext] 🔄 State changed:', states.previous, '->', states.current);
    });

    pusherInstance.connection.bind('connecting', () => {
      console.log('[PusherContext] 🔄 Connecting to Pusher...');
    });

    pusherInstance.connection.bind('connected', () => {
      console.log('[PusherContext] ✅ Pusher connected successfully!');
      console.log('[PusherContext] 📡 Connection ID:', pusherInstance.connection.socket_id);
      setIsConnected(true);
    });

    pusherInstance.connection.bind('unavailable', () => {
      console.error('[PusherContext] ❌ Pusher connection unavailable');
    });

    pusherInstance.connection.bind('failed', () => {
      console.error('[PusherContext] ❌ Pusher connection failed');
    });

    pusherInstance.connection.bind('disconnected', () => {
      console.log('[PusherContext] ⚠️ Pusher disconnected');
      setIsConnected(false);
    });

    pusherInstance.connection.bind('error', (err) => {
      console.error('[PusherContext] ❌ Pusher connection error:', err);
    });

    // Cleanup on unmount
    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  return (
    <PusherContext.Provider value={{ pusher, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  const context = useContext(PusherContext);
  if (context === undefined) {
    throw new Error('usePusher must be used within a PusherProvider');
  }
  return context;
}
