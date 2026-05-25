import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .transform((val) => {
        const digits = val.replace(/[\s\-().+]/g, '');
        if (digits.startsWith('244') && digits.length === 12) return `+${digits}`;
        if (!digits.startsWith('244') && digits.length === 9) return `+244${digits}`;
        return val.startsWith('+') ? val : `+${val}`;
      })
      .refine((val) => /^\+244[0-9]{9}$/.test(val), 'Número deve estar no formato +244XXXXXXXXX'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const sendSmsSchema = z.object({
  applicationId: z.string().min(1, 'Please select an application'),
  to: z
    .string()
    .min(1, 'Phone number is required')
    .transform((val) => {
      const digits = val.replace(/[\s\-().+]/g, '');
      if (digits.startsWith('244') && digits.length === 12) return `+${digits}`;
      if (!digits.startsWith('244') && digits.length === 9) return `+244${digits}`;
      return val.startsWith('+') ? val : `+${val}`;
    })
    .refine((val) => /^\+244[0-9]{9}$/.test(val), 'Número deve estar no formato +244XXXXXXXXX'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1600, 'Message cannot exceed 1600 characters (10 SMS segments)'),
});

export const sendEmailSchema = z.object({
  applicationId: z.string().min(1, 'Please select an application'),
  to: z
    .string()
    .min(1, 'Recipient email is required')
    .email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  htmlBody: z.string().min(1, 'Email body is required'),
  textBody: z.string().optional(),
});

export const sendBulkEmailSchema = z.object({
  applicationId: z.string().min(1, 'Please select an application'),
  recipients: z
    .string()
    .min(1, 'Recipients are required')
    .refine((val) => {
      const emails = val.split('\n').map((e) => e.trim()).filter(Boolean);
      return emails.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    }, 'All recipients must be valid email addresses (one per line)'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  htmlBody: z.string().min(1, 'Email body is required'),
  textBody: z.string().optional(),
});

export const sendWhatsAppSchema = z.object({
  applicationId: z.string().min(1, 'Please select an application'),
  to: z
    .string()
    .min(1, 'Phone number is required')
    .transform((val) => {
      const digits = val.replace(/[\s\-().+]/g, '');
      if (digits.startsWith('244') && digits.length === 12) return `+${digits}`;
      if (!digits.startsWith('244') && digits.length === 9) return `+244${digits}`;
      return val.startsWith('+') ? val : `+${val}`;
    })
    .refine((val) => /^\+244[0-9]{9}$/.test(val), 'Número deve estar no formato +244XXXXXXXXX'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(4096, 'Message cannot exceed 4096 characters'),
});

export const createApplicationSchema = z.object({
  name: z
    .string()
    .min(1, 'Application name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens and underscores'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
});

export const topUpSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(150, 'Minimum top-up amount is AOA 150'),
  paymentMethod: z.enum(['gpo', 'reference'], {
    required_error: 'Please select a payment method',
  }),
  phone: z.string().optional().transform((val) => {
    if (!val) return val;
    const digits = val.replace(/[\s\-().+]/g, '');
    if (digits.startsWith('244') && digits.length === 12) return `+${digits}`;
    if (!digits.startsWith('244') && digits.length === 9) return `+244${digits}`;
    return val.startsWith('+') ? val : `+${val}`;
  }),
}).refine(
  (data) => {
    if (data.paymentMethod === 'gpo') {
      return data.phone && /^\+244[0-9]{9}$/.test(data.phone);
    }
    return true;
  },
  {
    message: 'Número obrigatório para pagamento GPO (formato: +244XXXXXXXXX)',
    path: ['phone'],
  }
);

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Key name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  applicationId: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type SendSmsSchema = z.infer<typeof sendSmsSchema>;
export type SendEmailSchema = z.infer<typeof sendEmailSchema>;
export type SendBulkEmailSchema = z.infer<typeof sendBulkEmailSchema>;
export type SendWhatsAppSchema = z.infer<typeof sendWhatsAppSchema>;
export type CreateApplicationSchema = z.infer<typeof createApplicationSchema>;
export type TopUpSchema = z.infer<typeof topUpSchema>;
export type CreateApiKeySchema = z.infer<typeof createApiKeySchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
