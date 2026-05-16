export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface Application {
  id: string;
  name: string;
  slug: string;
  description?: string;
  messageCount: number;
  isActive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationRequest {
  name: string;
  description?: string;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  applicationId?: string;
  applicationName?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  applicationId?: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  fullKey: string;
}

export interface NotificationPreferences {
  emailOnDelivery: boolean;
  emailOnFailure: boolean;
  smsOnLowBalance: boolean;
  lowBalanceThreshold: number;
  weeklyReport: boolean;
}
