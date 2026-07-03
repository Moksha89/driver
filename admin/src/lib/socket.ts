import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from './env';
import { getStoredToken } from './storage';

let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = getStoredToken();
  if (!token) {
    return null;
  }

  if (!socket || socket.disconnected) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: { token },
    });
  }

  socket.auth = { token };
  return socket;
}

export function closeSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}
