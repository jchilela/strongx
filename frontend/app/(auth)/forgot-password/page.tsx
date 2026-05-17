'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/lib/validations';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useLang, LangToggle } from '@/lib/lang';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { t } = useLang();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.status === 404) {
        setSubmittedEmail(data.email);
        setSubmitted(true);
      } else {
        toast.error('Something went wrong', {
          description: axiosError.response?.data?.message || 'Please try again later.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.auth.resetLinkSent}</h1>
          <p className="text-sm text-gray-500 mb-1">{t.auth.ifAccountExists}</p>
          <p className="text-sm font-semibold text-gray-700 mb-4">{submittedEmail}</p>
          <p className="text-sm text-gray-500 mb-6">{t.auth.resetLinkExpiry}</p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.auth.backToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.auth.backToLogin}
      </Link>

      <div className="text-center mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mx-auto mb-4">
          <KeyRound className="h-8 w-8 text-[#6366f1]" />
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <LangToggle />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t.auth.forgotPasswordTitle}</h1>
        <p className="text-sm text-gray-500 mt-2">{t.auth.forgotPasswordDesc}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.auth.emailAddress}</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          {t.auth.sendResetLink}
        </Button>
      </form>
    </div>
  );
}
