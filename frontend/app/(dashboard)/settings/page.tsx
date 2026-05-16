'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileSchema,
  type ChangePasswordSchema,
} from '@/lib/validations';
import { settingsApi, authApi } from '@/lib/api';
import { getStoredUser, storeUser } from '@/lib/auth';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { User, Shield, Bell, Eye, EyeOff, Save } from 'lucide-react';
import type { NotificationPreferences } from '@/types/api';

function ProfileTab() {
  const queryClient = useQueryClient();
  const storedUser = getStoredUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: storedUser?.name || '',
    },
  });

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: UpdateProfileSchema) => {
      const response = await settingsApi.updateProfile(data);
      return response.data.data;
    },
    onSuccess: (user) => {
      storeUser(user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error('Failed to update profile', {
        description: axiosError.response?.data?.message,
      });
    },
  });

  return (
    <div className="form-section space-y-5 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <User className="h-4 w-4 text-[#6366f1]" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Profile Information</h2>
      </div>

      <form onSubmit={handleSubmit((data) => updateProfile(data))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={storedUser?.email || ''}
            disabled
            className="bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={storedUser?.phone || ''}
            disabled
            className="bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400">Phone cannot be changed. Contact support if needed.</p>
        </div>

        <Button type="submit" loading={isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </form>
    </div>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async (data: ChangePasswordSchema) => {
      const response = await settingsApi.changePassword(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      reset();
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error('Failed to change password', {
        description: axiosError.response?.data?.message || 'Please check your current password.',
      });
    },
  });

  return (
    <div className="form-section space-y-5 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <Shield className="h-4 w-4 text-[#6366f1]" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
      </div>

      <form onSubmit={handleSubmit((data) => changePassword(data))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Enter current password"
              error={errors.currentPassword?.message}
              className="pr-10"
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-2.5 text-gray-400"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="Enter new password"
              error={errors.newPassword?.message}
              className="pr-10"
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-2.5 text-gray-400"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat new password"
              error={errors.confirmPassword?.message}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 text-gray-400"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" loading={isPending}>
          <Shield className="h-4 w-4 mr-2" />
          Update Password
        </Button>
      </form>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailOnDelivery: false,
    emailOnFailure: true,
    smsOnLowBalance: true,
    lowBalanceThreshold: 500,
    weeklyReport: false,
  });

  const { data: savedPrefs, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await settingsApi.getNotificationPreferences();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (savedPrefs) setPrefs(savedPrefs);
  }, [savedPrefs]);

  const { mutate: updatePrefs, isPending } = useMutation({
    mutationFn: async (data: NotificationPreferences) => {
      const response = await settingsApi.updateNotificationPreferences(data);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('Notification preferences saved!');
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const togglePref = (key: keyof NotificationPreferences) => {
    if (typeof prefs[key] === 'boolean') {
      setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const toggleItems = [
    {
      key: 'emailOnDelivery' as const,
      title: 'Email on delivery',
      description: 'Receive an email when a message is delivered',
    },
    {
      key: 'emailOnFailure' as const,
      title: 'Email on failure',
      description: 'Receive an email when a message fails to deliver',
    },
    {
      key: 'smsOnLowBalance' as const,
      title: 'SMS on low balance',
      description: 'Get an SMS when your wallet balance is low',
    },
    {
      key: 'weeklyReport' as const,
      title: 'Weekly report',
      description: 'Receive a weekly summary of your usage',
    },
  ];

  return (
    <div className="form-section space-y-5 max-w-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <Bell className="h-4 w-4 text-[#6366f1]" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {toggleItems.map(({ key, title, description }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <Switch
                checked={prefs[key] as boolean}
                onCheckedChange={() => togglePref(key)}
              />
            </div>
          ))}

          {prefs.smsOnLowBalance && (
            <div className="space-y-1.5">
              <Label htmlFor="threshold">Low Balance Threshold (AOA)</Label>
              <Input
                id="threshold"
                type="number"
                value={prefs.lowBalanceThreshold}
                min={100}
                step={100}
                onChange={(e) =>
                  setPrefs((prev) => ({
                    ...prev,
                    lowBalanceThreshold: Number(e.target.value),
                  }))
                }
              />
            </div>
          )}
        </div>
      )}

      <Button onClick={() => updatePrefs(prefs)} loading={isPending}>
        <Save className="h-4 w-4 mr-2" />
        Save Preferences
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardShell title="Settings">
      <div className="max-w-2xl">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
