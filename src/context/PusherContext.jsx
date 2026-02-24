import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';

const PusherContext = createContext(null);

export function PusherProvider({ children }) {
  const { token } = useAuth();
  const [pusher, setPusher] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef(null);

  useEffect(() => {
    // Clean up any existing connection first
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
      setPusher(null);
      setIsConnected(false);
    }

    // Don't create Pusher until we have a valid token
    if (!token) return;

    const appKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';
    const wsHost = import.meta.env.VITE_PUSHER_WS_HOST;
    const wsPort = import.meta.env.VITE_PUSHER_WS_PORT;
    const forceTLS = import.meta.env.VITE_PUSHER_FORCE_TLS !== 'false';

    if (!appKey) {
      console.warn('[Pusher] App key not configured. Real-time updates disabled.');
      return;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3339';
    const authEndpoint = `${apiBaseUrl}/api/v1/pusher/auth`;

    // pusher-js v8: use channelAuthorization.customHandler (replaces deprecated `authorizer`)
    // `token` is captured directly from closure — no race condition
    const pusherConfig = {
      cluster,
      forceTLS,
      enabledTransports: forceTLS ? ['ws'] : ['ws', 'wss'],
      channelAuthorization: {
        customHandler: ({ socketId, channelName }, callback) => {
          fetch(authEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channelName,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const errorText = await response.text();
                console.error('[Pusher] Auth failed:', response.status, errorText);
                throw new Error(`Auth failed: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              // Backend may wrap response in {success, data} format
              const authData = data.data || data;
              if (!authData.auth) {
                throw new Error('Invalid auth response: missing "auth" field');
              }
              callback(null, authData);
            })
            .catch((error) => {
              console.error('[Pusher] Auth error:', error);
              callback(error, null);
            });
        },
      },
    };

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

    pusherInstance.connection.bind('connected', () => {
      console.warn('[Pusher] Connected, socketId:', pusherInstance.connection.socket_id);
      setIsConnected(true);
    });

    pusherInstance.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    pusherInstance.connection.bind('error', (err) => {
      console.error('[Pusher] Connection error:', err);
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [token]);

  const value = useMemo(() => ({ pusher, isConnected }), [pusher, isConnected]);

  return (
    <PusherContext.Provider value={value}>
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
