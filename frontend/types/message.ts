export type MessageChannel = 'sms' | 'email' | 'whatsapp';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'read';

export interface Message {
  id: string;
  channel: MessageChannel;
  to: string;
  subject?: string;
  body: string;
  status: MessageStatus;
  cost: number;
  applicationId: string;
  applicationName: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface SendSmsRequest {
  applicationId: string;
  to: string;
  message: string;
}

export interface SendEmailRequest {
  applicationId: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SendBulkEmailRequest {
  applicationId: string;
  recipients: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SendWhatsAppRequest {
  applicationId: string;
  to: string;
  message: string;
}

export interface MessageStatusUpdate {
  messageId: string;
  status: MessageStatus;
  updatedAt: string;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DailyStats {
  date: string;
  sms: number;
  email: number;
  whatsapp: number;
}

export interface TodayStats {
  smsSentToday: number;
  emailsSentToday: number;
  whatsappSentToday: number;
  walletBalance: number;
}
