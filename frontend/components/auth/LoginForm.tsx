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
import { loginSchema, type LoginSchema } from '@/lib/validations';
import { authApi } from '@/lib/api';
import { storeTokens, storeUser } from '@/lib/auth';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useLang, LangToggle } from '@/lib/lang';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLang();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      const { user, tokens } = response.data.data;
      storeTokens(tokens);
      storeUser(user);
      toast.success(t.auth.welcomeBack, { description: `${user.name}` });
      router.push('/dashboard');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message ||
        'Invalid email or password. Please try again.';
      toast.error('Login Failed', { description: message });
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
        <h1 className="text-2xl font-bold text-gray-900">{t.auth.welcomeBack}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.auth.signInToAccount}</p>
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Link href="/forgot-password" className="text-xs text-[#6366f1] hover:underline">
              {t.auth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t.auth.enterPassword}
              autoComplete="current-password"
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
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          {t.auth.signIn}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        {t.auth.noAccount}{' '}
        <Link href="/register" className="text-[#6366f1] font-medium hover:underline">
          {t.auth.createAccount}
        </Link>
      </p>
    </div>
  );
}
