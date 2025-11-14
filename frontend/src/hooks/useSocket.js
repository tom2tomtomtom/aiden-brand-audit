import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketIo = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketIo.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socketIo.on('connected', (data) => {
      console.log('Server message:', data.message);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return { socket, connected };
};
