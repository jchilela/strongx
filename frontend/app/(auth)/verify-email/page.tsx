'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { maskEmail } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { useLang } from '@/lib/lang';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { t } = useLang();

  // Auto-verify when a token is present in the URL (user clicked the email link)
  useEffect(() => {
    if (!token) return;
    setVerifyState('loading');
    authApi.verifyEmail(token)
      .then(() => {
        setVerifyState('success');
        toast.success(t.auth.emailVerifiedSuccess);
        setTimeout(() => router.push('/login'), 3000);
      })
      .catch(() => {
        setVerifyState('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authApi.resendEmailVerification(email);
      toast.success(t.auth.emailVerifiedSuccess, { description: t.auth.emailVerifiedDesc });
      setResent(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error('Failed to resend', {
        description: axiosError.response?.data?.message || 'Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Token present — show verification result
  if (token) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.auth.backToLogin}
        </Link>

        {verifyState === 'loading' && (
          <div className="py-8">
            <Loader2 className="h-12 w-12 text-[#6366f1] animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">{t.auth.verifyingEmail}</p>
          </div>
        )}

        {verifyState === 'success' && (
          <div className="py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.auth.emailVerifiedSuccess}</h1>
            <p className="text-gray-500">{t.auth.emailVerifiedDesc}</p>
          </div>
        )}

        {verifyState === 'error' && (
          <div className="py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.auth.emailVerifiedFailed}</h1>
            <p className="text-gray-500 mb-6">The link may have expired. Request a new one below.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#6366f1] text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-[#5254cc] transition-colors"
            >
              {t.auth.backToLogin}
            </Link>
          </div>
        )}
      </div>
    );
  }

  // No token — show "check your inbox" screen
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 mx-auto mb-4">
          <Mail className="h-10 w-10 text-[#fb923c]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t.auth.checkEmail}</h1>
        <p className="text-sm text-gray-500 mt-2">{t.auth.sentVerificationTo}</p>
        <p className="text-base font-semibold text-gray-800 mt-1">
          {email ? maskEmail(email) : t.auth.yourEmailAddress}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
        <p className="text-sm text-gray-600 font-medium">{t.auth.whatNext}</p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-500">
          <li>{t.auth.emailStep1}</li>
          <li>{t.auth.emailStep2}</li>
          <li>{t.auth.emailStep3}</li>
          <li>{t.auth.emailStep4}</li>
        </ol>
      </div>

      {resent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          {t.auth.resendVerification}
        </div>
      )}

      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">{t.auth.didntReceiveEmail}</p>
        <Button variant="outline" onClick={handleResend} loading={isResending} className="w-full">
          {t.auth.resendVerification}
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">{t.auth.checkSpam}</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl p-8 text-center text-gray-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
