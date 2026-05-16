'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, Info } from 'lucide-react';
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
import { sendSmsSchema, type SendSmsSchema } from '@/lib/validations';
import { applicationsApi } from '@/lib/api';
import { useSendSms } from '@/hooks/useMessages';
import {
  countSmsSegments,
  calculateSmsCost,
  formatCurrency,
} from '@/lib/utils';
import { useEffect, useState } from 'react';

export function SendSmsForm() {
  const { mutate: sendSms, isPending } = useSendSms();
  const [charCount, setCharCount] = useState(0);

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<SendSmsSchema>({
    resolver: zodResolver(sendSmsSchema),
  });

  const messageValue = watch('message', '');

  useEffect(() => {
    setCharCount(messageValue?.length || 0);
  }, [messageValue]);

  const smsSegments = countSmsSegments(messageValue || '');
  const smsCost = calculateSmsCost(messageValue || '');

  const onSubmit = (data: SendSmsSchema) => {
    sendSms(data, {
      onSuccess: () => {
        reset();
        setCharCount(0);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-section space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <MessageSquare className="h-4 w-4 text-[#6366f1]" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Send SMS</h2>
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
            {(!applications || applications.length === 0) && (
              <SelectItem value="none" disabled>
                No applications found
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <input type="hidden" {...register('applicationId')} />
      </div>

      {/* To */}
      <div className="space-y-1.5">
        <Label htmlFor="to">To (Phone Number)</Label>
        <Input
          id="to"
          type="tel"
          placeholder="+244923456789"
          error={errors.to?.message}
          {...register('to')}
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">Message</Label>
          <span className="text-xs text-gray-400">
            {charCount}/160 chars ({smsSegments} SMS)
          </span>
        </div>
        <Textarea
          id="message"
          placeholder="Type your SMS message..."
          rows={5}
          error={errors.message?.message}
          {...register('message')}
        />
        {/* SMS character progress bar */}
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6366f1] transition-all rounded-full"
            style={{ width: `${Math.min((charCount / 160) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Cost preview */}
      {charCount > 0 && (
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-lg px-4 py-3 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            This will cost{' '}
            <span className="font-bold">{formatCurrency(smsCost)}</span> — {smsSegments}{' '}
            SMS segment{smsSegments > 1 ? 's' : ''} at{' '}
            <span className="font-semibold">AOA 2.50</span> each
          </span>
        </div>
      )}

      <Button type="submit" className="w-full" loading={isPending}>
        <Send className="h-4 w-4 mr-2" />
        Send SMS
      </Button>
    </form>
  );
}
