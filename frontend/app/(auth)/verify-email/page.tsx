'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { maskEmail } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { AxiosError } from 'axios';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authApi.resendEmailVerification(email);
      toast.success('Verification email sent!', {
        description: 'Please check your inbox.',
      });
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

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 mx-auto mb-4">
          <Mail className="h-10 w-10 text-[#fb923c]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500 mt-2">
          We&apos;ve sent a verification link to
        </p>
        <p className="text-base font-semibold text-gray-800 mt-1">
          {email ? maskEmail(email) : 'your email address'}
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
        <p className="text-sm text-gray-600 font-medium">What to do next:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-500">
          <li>Open your email inbox</li>
          <li>Find the email from StrongX</li>
          <li>Click the &quot;Verify Email&quot; button in the email</li>
          <li>You&apos;ll be redirected to login</li>
        </ol>
      </div>

      {/* Success message after resend */}
      {resent && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          A new verification email has been sent. Please check your inbox and spam folder.
        </div>
      )}

      {/* Resend */}
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">Didn&apos;t receive the email?</p>
        <Button
          variant="outline"
          onClick={handleResend}
          loading={isResending}
          className="w-full"
        >
          Resend verification email
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Check your spam folder if you don&apos;t see it. The link expires in 24 hours.
      </p>
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
