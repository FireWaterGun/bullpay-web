import { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuth } from './AuthContext';

const PusherContext = createContext(null);

export function PusherProvider({ children }) {
  const { token } = useAuth();
  const [pusher, setPusher] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef(null);
  const tokenRef = useRef(token);

  // Update token ref when token changes
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    const appKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';
    const wsHost = import.meta.env.VITE_PUSHER_WS_HOST;
    const wsPort = import.meta.env.VITE_PUSHER_WS_PORT;
    const forceTLS = import.meta.env.VITE_PUSHER_FORCE_TLS !== 'false';

    if (!appKey) {
      console.warn('[PusherContext] App key not configured. Real-time updates disabled.');
      return;
    }

    // Custom authorizer to send JSON instead of form data
    const authorizer = (channel) => ({
      authorize: (socketId, callback) => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3339';
        const authEndpoint = `${apiBaseUrl}/api/v1/pusher/auth`;
        const currentToken = tokenRef.current;

        fetch(authEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken || ''}`
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name
          })
        })
          .then(async response => {
            if (!response.ok) {
              const errorText = await response.text();
              console.error('[PusherContext] Auth failed:', response.status, errorText);
              throw new Error(`Auth failed: ${response.status} ${response.statusText}`);
            }
            return response.json();
          })
          .then(data => {
            // Backend wraps response in {success, data} format
            const authData = data.data || data;
            if (!authData.auth) {
              throw new Error('Invalid auth response from server');
            }
            callback(null, authData);
          })
          .catch(error => {
            console.error('[PusherContext] Auth error:', error);
            callback(error, null);
          });
      }
    });

    const pusherConfig = {
      cluster,
      forceTLS,
      enabledTransports: forceTLS ? ['wss'] : ['ws', 'wss'],
      authorizer,
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
      setIsConnected(true);
    });

    pusherInstance.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    pusherInstance.connection.bind('error', (err) => {
      console.error('[PusherContext] Connection error:', err);
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

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
