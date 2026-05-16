import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'https://api.strongx.it.ao', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocketInstance(): Socket | null {
  return socket;
}

export type SocketEvents = {
  'message.status.updated': {
    messageId: string;
    status: string;
    updatedAt: string;
  };
  'wallet.balance.updated': {
    balance: number;
    currency: string;
  };
  notification: {
    id: string;
    title: string;
    body: string;
    type: 'info' | 'success' | 'warning' | 'error';
    createdAt: string;
  };
};
