'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/auth/OtpInput';
import { authApi } from '@/lib/api';
import { maskPhone } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { AxiosError } from 'axios';

function VerifyPhoneContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get('phone') || '';
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      await authApi.verifyPhone({ phone, otp });
      toast.success('Phone verified!', {
        description: 'Now please verify your email address.',
      });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Invalid or expired code. Please try again.';
      setOtpError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authApi.resendPhoneOtp(phone);
      toast.success('Code sent!', { description: 'A new OTP has been sent to your phone.' });
      setCountdown(60);
      setCanResend(false);
      setOtp('');
      setOtpError('');
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
        href="/register"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to register
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mx-auto mb-4">
          <Phone className="h-8 w-8 text-[#6366f1]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verify your phone</h1>
        <p className="text-sm text-gray-500 mt-2">
          We&apos;ve sent a 6-digit code to
        </p>
        <p className="text-sm font-semibold text-gray-700 mt-1">
          {phone ? maskPhone(phone) : 'your phone number'}
        </p>
      </div>

      {/* OTP Input */}
      <div className="mb-6">
        <OtpInput
          value={otp}
          onChange={(val) => {
            setOtp(val);
            setOtpError('');
          }}
          disabled={isLoading}
          error={otpError}
        />
      </div>

      {/* Verify button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleVerify}
        loading={isLoading}
        disabled={otp.length !== 6}
      >
        Verify Phone Number
      </Button>

      {/* Resend */}
      <div className="text-center mt-6">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-[#6366f1] hover:underline font-medium disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend code in{' '}
            <span className="font-semibold text-gray-700">{countdown}s</span>
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Check your SMS inbox. The code expires in 10 minutes.
      </p>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl p-8 text-center text-gray-400">Loading...</div>}>
      <VerifyPhoneContent />
    </Suspense>
  );
}
