'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { getAccessToken } from '@/lib/auth';
import type { Socket } from 'socket.io-client';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMessageStatusUpdate = (data: {
      messageId: string;
      status: string;
      updatedAt: string;
    }) => {
      // Update the message in react-query caches
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['recent-messages'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
    };

    const handleWalletUpdate = (data: { balance: number; currency: string }) => {
      queryClient.setQueryData(['wallet-balance'], (old: unknown) => {
        if (old && typeof old === 'object' && 'balance' in old) {
          return { ...old, balance: data.balance, currency: data.currency };
        }
        return data;
      });
    };

    const handleNotification = (data: {
      id: string;
      title: string;
      body: string;
      type: 'info' | 'success' | 'warning' | 'error';
    }) => {
      switch (data.type) {
        case 'success':
          toast.success(data.title, { description: data.body });
          break;
        case 'warning':
          toast.warning(data.title, { description: data.body });
          break;
        case 'error':
          toast.error(data.title, { description: data.body });
          break;
        default:
          toast.info(data.title, { description: data.body });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('message.status.updated', handleMessageStatusUpdate);
    socket.on('wallet.balance.updated', handleWalletUpdate);
    socket.on('notification', handleNotification);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('message.status.updated', handleMessageStatusUpdate);
      socket.off('wallet.balance.updated', handleWalletUpdate);
      socket.off('notification', handleNotification);
    };
  }, [queryClient]);

  return { isConnected, socket: socketRef.current };
}
