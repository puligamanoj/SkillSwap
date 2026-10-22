import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://skillswap-1-ziz3.onrender.com/api';
// Extract root server URL (e.g., http://localhost:5000)
const SOCKET_SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket = null;

export const initSocket = (token) => {
  if (!token) return null;

  // If already connected with same token, reuse
  if (socket && socket.connected) {
    return socket;
  }

  // Close previous socket if exists
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_SERVER_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
