export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  smsCost: number | null;
  emailCost: number | null;
  whatsappCost: number | null;
  walletBalance: number;
  createdAt: string;
}

export interface AdminApplication {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectedReason?: string;
  telcosmsApiKey?: string;
  isActive: boolean;
  ownerName?: string;
  ownerEmail?: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  isActive?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  smsCost?: number | null;
  emailCost?: number | null;
  whatsappCost?: number | null;
}

export interface EarningsDayPoint {
  date: string;
  total: number;
}

export interface EarningsMonthPoint {
  month: string;
  total: number;
}

export interface EarningsYearPoint {
  year: string;
  total: number;
}

export interface TopUser {
  userId: string;
  name: string;
  email: string;
  total: number;
}

export interface EarningsStats {
  daily: EarningsDayPoint[];
  monthly: EarningsMonthPoint[];
  yearly: EarningsYearPoint[];
  topUsers: TopUser[];
  totalAllTime: number;
}
