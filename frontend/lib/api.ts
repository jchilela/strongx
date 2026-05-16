import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, storeTokens, clearAuth } from './auth';
import type { AuthTokens } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.strongx.it.ao';

const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<ApiResponse<AuthTokens>>(
          `${API_URL}/v1/auth/refresh`,
          { refreshToken }
        );
        const tokens = response.data.data;
        storeTokens(tokens);
        processQueue(null, tokens.accessToken);
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: import('@/types/auth').User; tokens: AuthTokens }>>('/auth/login', data),
  register: (data: import('@/types/auth').RegisterRequest) =>
    api.post<ApiResponse<{ user: import('@/types/auth').User }>>('/auth/register', data),
  verifyPhone: (data: { phone: string; otp: string }) =>
    api.post<ApiResponse<null>>('/auth/verify-phone', data),
  resendPhoneOtp: (phone: string) =>
    api.post<ApiResponse<null>>('/auth/resend-phone-otp', { phone }),
  verifyEmail: (token: string) =>
    api.post<ApiResponse<null>>('/auth/verify-email', { token }),
  resendEmailVerification: (email: string) =>
    api.post<ApiResponse<null>>('/auth/resend-email-verification', { email }),
  forgotPassword: (email: string) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post<ApiResponse<null>>('/auth/reset-password', data),
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
  me: () => api.get<ApiResponse<import('@/types/auth').User>>('/auth/me'),
};

// Messages endpoints
export const messagesApi = {
  sendSms: (data: import('@/types/message').SendSmsRequest) =>
    api.post<ApiResponse<import('@/types/message').Message>>('/sms/send', data),
  getSmsMessages: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<import('@/types/message').MessagesResponse>>('/sms/messages', { params }),
  sendEmail: (data: import('@/types/message').SendEmailRequest) =>
    api.post<ApiResponse<import('@/types/message').Message>>('/email/send', data),
  sendBulkEmail: (data: import('@/types/message').SendBulkEmailRequest) =>
    api.post<ApiResponse<{ sent: number; failed: number }>>('/email/send-bulk', data),
  getEmailMessages: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<import('@/types/message').MessagesResponse>>('/email/messages', { params }),
  sendWhatsApp: (data: import('@/types/message').SendWhatsAppRequest) =>
    api.post<ApiResponse<import('@/types/message').Message>>('/whatsapp/send', data),
  getWhatsAppMessages: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<import('@/types/message').MessagesResponse>>('/whatsapp/messages', { params }),
  getRecentMessages: (limit?: number) =>
    api.get<ApiResponse<import('@/types/message').Message[]>>('/messages/recent', { params: { limit } }),
  getDailyStats: (days?: number) =>
    api.get<ApiResponse<import('@/types/message').DailyStats[]>>('/messages/stats/daily', { params: { days } }),
  getTodayStats: () =>
    api.get<ApiResponse<import('@/types/message').TodayStats>>('/messages/stats/today'),
};

// Wallet endpoints
export const walletApi = {
  getBalance: () =>
    api.get<ApiResponse<import('@/types/wallet').WalletBalance>>('/wallet/balance'),
  getTransactions: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<import('@/types/wallet').TransactionsResponse>>('/wallet/transactions', { params }),
  topUp: (data: import('@/types/wallet').TopUpRequest) =>
    api.post<ApiResponse<import('@/types/wallet').TopUpResponse>>('/wallet/top-up', data),
  syncPayments: () =>
    api.post<ApiResponse<{ synced: number }>>('/wallet/payments/sync'),
};

// Applications endpoints
export const applicationsApi = {
  getApplications: () =>
    api.get<ApiResponse<import('@/types/api').Application[]>>('/applications'),
  createApplication: (data: import('@/types/api').CreateApplicationRequest) =>
    api.post<ApiResponse<import('@/types/api').Application>>('/applications', data),
  updateApplication: (id: string, data: import('@/types/api').UpdateApplicationRequest) =>
    api.put<ApiResponse<import('@/types/api').Application>>(`/applications/${id}`, data),
  deleteApplication: (id: string) =>
    api.delete<ApiResponse<null>>(`/applications/${id}`),
};

// API Keys endpoints
export const apiKeysApi = {
  getApiKeys: () =>
    api.get<ApiResponse<import('@/types/api').ApiKey[]>>('/api-keys'),
  createApiKey: (data: import('@/types/api').CreateApiKeyRequest) =>
    api.post<ApiResponse<import('@/types/api').CreateApiKeyResponse>>('/api-keys', data),
  revokeApiKey: (id: string) =>
    api.delete<ApiResponse<null>>(`/api-keys/${id}`),
};

// Settings endpoints
export const settingsApi = {
  updateProfile: (data: { name: string }) =>
    api.put<ApiResponse<import('@/types/auth').User>>('/settings/profile', data),
  changePassword: (data: import('@/types/auth').ChangePasswordRequest) =>
    api.put<ApiResponse<null>>('/settings/password', data),
  getNotificationPreferences: () =>
    api.get<ApiResponse<import('@/types/api').NotificationPreferences>>('/settings/notifications'),
  updateNotificationPreferences: (data: import('@/types/api').NotificationPreferences) =>
    api.put<ApiResponse<import('@/types/api').NotificationPreferences>>('/settings/notifications', data),
};

// Admin endpoints
export const adminApi = {
  getUsers: () =>
    api.get<ApiResponse<import('@/types/admin').AdminUser[]>>('/admin/users'),
  updateUser: (id: string, data: import('@/types/admin').UpdateUserRequest) =>
    api.put<ApiResponse<import('@/types/admin').AdminUser>>(`/admin/users/${id}`, data),
  getUserApiKeys: (userId: string) =>
    api.get<ApiResponse<import('@/types/api').ApiKey[]>>(`/admin/users/${userId}/api-keys`),
  toggleApiKey: (keyId: string, isActive: boolean) =>
    api.put<ApiResponse<import('@/types/api').ApiKey>>(`/admin/api-keys/${keyId}`, { isActive }),
  getApplications: (status?: string) =>
    api.get<ApiResponse<import('@/types/admin').AdminApplication[]>>('/admin/applications', { params: status ? { status } : undefined }),
  approveApplication: (appId: string) =>
    api.post<ApiResponse<import('@/types/admin').AdminApplication>>(`/admin/applications/${appId}/approve`),
  rejectApplication: (appId: string, reason: string) =>
    api.post<ApiResponse<import('@/types/admin').AdminApplication>>(`/admin/applications/${appId}/reject`, { reason }),
  addWalletFunds: (userId: string, amount: number, description?: string) =>
    api.post<ApiResponse<{ balance: number; added: number }>>(`/admin/users/${userId}/wallet/add`, { amount, description }),
  getEarningsStats: () =>
    api.get<ApiResponse<import('@/types/admin').EarningsStats>>('/admin/stats/earnings'),
};
