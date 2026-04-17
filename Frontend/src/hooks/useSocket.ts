import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

//added email to query params for teacher role to identify them in socket server
export const useSocket = (sessionCode: string, role: string, userName: string, email?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionCode) return;

    const newSocket = io('http://localhost:5000', {
      query: {
        sessionCode,
        role,
        userName,
        email
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionCode, role, userName, email]);

  return { socket, connected };
};