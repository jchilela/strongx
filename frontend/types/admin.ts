export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  smsCost: number | null;
  emailCost: number | null;
  whatsappCost: number | null;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  isActive?: boolean;
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
