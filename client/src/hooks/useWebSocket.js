import { useEffect, useRef, useCallback, useState } from 'react';

const MAX_RETRY_DELAY_MS = 10000;

export function useWebSocket(onMessage, onOpen) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  onMessageRef.current = onMessage;
  onOpenRef.current = onOpen;

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryDelay = 1000;
    let retryTimer = null;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        retryDelay = 1000;
        setConnected(true);
        onOpenRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          onMessageRef.current(msg);
        } catch {
          console.error('Failed to parse WS message', event.data);
        }
      };

      ws.onerror = (err) => console.error('WebSocket error', err);

      // Reconnect on any drop (network blip, server restart) rather than
      // giving up — a page reload isn't the only way a connection dies.
      ws.onclose = () => {
        setConnected(false);
        if (cancelled) return;
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
  }, []);

  const send = useCallback((type, payload = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not open, dropping message:', type);
    }
  }, []);

  return { send, connected };
}
