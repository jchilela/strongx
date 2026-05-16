'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api';
import type {
  SendSmsRequest,
  SendEmailRequest,
  SendBulkEmailRequest,
  SendWhatsAppRequest,
} from '@/types/message';
import { toast } from 'sonner';

export function useSmsMessages(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['sms-messages', page, limit],
    queryFn: async () => {
      const response = await messagesApi.getSmsMessages({ page, limit });
      return response.data.data;
    },
    staleTime: 15000,
  });
}

export function useSendSms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendSmsRequest) => {
      const response = await messagesApi.sendSms(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] });
      queryClient.invalidateQueries({ queryKey: ['recent-messages'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('SMS Sent', { description: 'Your SMS has been queued for delivery.' });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send SMS. Please try again.';
      toast.error('Send Failed', { description: message });
    },
  });
}

export function useEmailMessages(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['email-messages', page, limit],
    queryFn: async () => {
      const response = await messagesApi.getEmailMessages({ page, limit });
      return response.data.data;
    },
    staleTime: 15000,
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendEmailRequest) => {
      const response = await messagesApi.sendEmail(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      queryClient.invalidateQueries({ queryKey: ['recent-messages'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Email Sent', { description: 'Your email has been queued for delivery.' });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send email. Please try again.';
      toast.error('Send Failed', { description: message });
    },
  });
}

export function useSendBulkEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendBulkEmailRequest) => {
      const response = await messagesApi.sendBulkEmail(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Bulk Email Queued', {
        description: `${data.sent} emails queued${data.failed > 0 ? `, ${data.failed} failed` : ''}.`,
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send bulk email. Please try again.';
      toast.error('Send Failed', { description: message });
    },
  });
}

export function useWhatsAppMessages(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['whatsapp-messages', page, limit],
    queryFn: async () => {
      const response = await messagesApi.getWhatsAppMessages({ page, limit });
      return response.data.data;
    },
    staleTime: 15000,
  });
}

export function useSendWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendWhatsAppRequest) => {
      const response = await messagesApi.sendWhatsApp(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      queryClient.invalidateQueries({ queryKey: ['recent-messages'] });
      queryClient.invalidateQueries({ queryKey: ['today-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('WhatsApp Message Sent', {
        description: 'Your message has been queued for delivery.',
      });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send WhatsApp message. Please try again.';
      toast.error('Send Failed', { description: message });
    },
  });
}

export function useRecentMessages(limit = 10) {
  return useQuery({
    queryKey: ['recent-messages', limit],
    queryFn: async () => {
      const response = await messagesApi.getRecentMessages(limit);
      return response.data.data;
    },
    staleTime: 15000,
  });
}

export function useDailyStats(days = 7) {
  return useQuery({
    queryKey: ['daily-stats', days],
    queryFn: async () => {
      const response = await messagesApi.getDailyStats(days);
      return response.data.data;
    },
    staleTime: 60000,
  });
}

export function useTodayStats() {
  return useQuery({
    queryKey: ['today-stats'],
    queryFn: async () => {
      const response = await messagesApi.getTodayStats();
      return response.data.data;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
}
