'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerSchema, type RegisterSchema } from '@/lib/validations';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useLang, LangToggle } from '@/lib/lang';

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLang();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: '+244' },
  });

  const password = watch('password', '');

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  const onSubmit = async (data: RegisterSchema) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      toast.success(t.auth.accountCreated, {
        description: t.auth.accountCreatedDesc,
      });
      router.push(`/verify-phone?phone=${encodeURIComponent(data.phone)}&email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string; errors?: Record<string, string[]> }>;
      const serverErrors = axiosError.response?.data?.errors;
      if (serverErrors) {
        const firstError = Object.values(serverErrors)[0]?.[0];
        toast.error(t.auth.registrationFailed, { description: firstError });
      } else {
        const message = axiosError.response?.data?.message;
        toast.error(t.auth.registrationFailed, { description: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <a href="https://strongx.it.ao">
            <Image src="/logo.png" alt="StrongX" width={160} height={92} className="object-contain" priority />
          </a>
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <LangToggle />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t.auth.createYourAccount}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.auth.startSending}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t.auth.fullName}</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="phone">
            {t.auth.phone}
            <span className="text-gray-400 font-normal ml-1 text-xs">{t.auth.phoneFormat}</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+244923456789"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t.auth.password}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              autoComplete="new-password"
              error={errors.password?.message}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {t.auth.passwordStrength}: <span className="font-medium">{t.auth.strengthLabels[passwordStrength]}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          {t.auth.createAccountBtn}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          {t.auth.agreeTerms}{' '}
          <Link href="/terms" target="_blank" className="underline hover:text-gray-600">{t.auth.termsLink}</Link>
          {' '}{t.auth.and}{' '}
          <Link href="/terms#privacidade" target="_blank" className="underline hover:text-gray-600">{t.auth.privacyLink}</Link>.
        </p>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t.auth.alreadyAccount}{' '}
        <Link href="/login" className="text-[#6366f1] font-medium hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
