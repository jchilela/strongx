'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/lib/api';
import type { TopUpRequest } from '@/types/wallet';
import { toast } from 'sonner';

export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await walletApi.getBalance();
      return response.data.data;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
  });
}

export function useTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['transactions', page, limit],
    queryFn: async () => {
      const response = await walletApi.getTransactions({ page, limit });
      return response.data.data;
    },
    staleTime: 30000,
  });
}

export function useSyncPayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await walletApi.syncPayments();
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      if (data.synced > 0) {
        toast.success(`${data.synced} payment${data.synced > 1 ? 's' : ''} updated`);
      } else {
        toast.info('No pending payments to update');
      }
    },
    onError: () => {
      toast.error('Failed to sync payments. Please try again.');
    },
  });
}

export function useTopUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TopUpRequest) => {
      const response = await walletApi.topUp(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to initiate top-up. Please try again.';
      toast.error('Top-up Failed', { description: message });
    },
  });
}
