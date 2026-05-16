'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Users, Send, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sendBulkEmailSchema, type SendBulkEmailSchema } from '@/lib/validations';
import { applicationsApi } from '@/lib/api';
import { useSendBulkEmail } from '@/hooks/useMessages';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export function BulkEmailForm() {
  const { mutate: sendBulkEmail, isPending } = useSendBulkEmail();
  const [recipientCount, setRecipientCount] = useState(0);

  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await applicationsApi.getApplications();
      return response.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SendBulkEmailSchema>({
    resolver: zodResolver(sendBulkEmailSchema),
  });

  const handleRecipientsChange = (value: string) => {
    const count = value
      .split('\n')
      .map((e) => e.trim())
      .filter(Boolean).length;
    setRecipientCount(count);
  };

  const onSubmit = (data: SendBulkEmailSchema) => {
    const recipients = data.recipients
      .split('\n')
      .map((e) => e.trim())
      .filter(Boolean);
    sendBulkEmail({ ...data, recipients }, { onSuccess: () => { reset(); setRecipientCount(0); } });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-section space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
          <Users className="h-4 w-4 text-[#fb923c]" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Bulk Email</h2>
      </div>

      {/* Application */}
      <div className="space-y-1.5">
        <Label>Application</Label>
        <Select onValueChange={(val) => setValue('applicationId', val)}>
          <SelectTrigger error={errors.applicationId?.message}>
            <SelectValue placeholder="Select application" />
          </SelectTrigger>
          <SelectContent>
            {applications?.map((app) => (
              <SelectItem key={app.id} value={app.id}>
                {app.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" {...register('applicationId')} />
      </div>

      {/* Recipients */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="recipients">Recipients</Label>
          {recipientCount > 0 && (
            <span className="text-xs text-gray-400">{recipientCount} recipients</span>
          )}
        </div>
        <Textarea
          id="recipients"
          placeholder="one@example.com&#10;two@example.com&#10;three@example.com"
          rows={6}
          error={errors.recipients?.message}
          {...register('recipients', {
            onChange: (e) => handleRecipientsChange(e.target.value),
          })}
        />
        <p className="text-xs text-gray-400">One email address per line</p>
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          type="text"
          placeholder="Your email subject"
          error={errors.subject?.message}
          {...register('subject')}
        />
      </div>

      {/* HTML Body */}
      <div className="space-y-1.5">
        <Label htmlFor="htmlBody">HTML Body</Label>
        <Textarea
          id="htmlBody"
          placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
          rows={6}
          error={errors.htmlBody?.message}
          {...register('htmlBody')}
        />
      </div>

      {/* Cost preview */}
      {recipientCount > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 rounded-lg px-4 py-3 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            Estimated cost:{' '}
            <span className="font-bold">{formatCurrency(recipientCount * 1)}</span> for{' '}
            {recipientCount} recipient{recipientCount > 1 ? 's' : ''} at AOA 1.00 each
          </span>
        </div>
      )}

      <Button type="submit" className="w-full bg-[#fb923c] hover:bg-[#f97316]" loading={isPending}>
        <Send className="h-4 w-4 mr-2" />
        Send Bulk Email
      </Button>
    </form>
  );
}
