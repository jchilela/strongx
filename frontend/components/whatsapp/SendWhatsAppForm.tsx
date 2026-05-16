'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Send, Info } from 'lucide-react';
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
import { sendWhatsAppSchema, type SendWhatsAppSchema } from '@/lib/validations';
import { applicationsApi } from '@/lib/api';
import { useSendWhatsApp } from '@/hooks/useMessages';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export function SendWhatsAppForm() {
  const { mutate: sendWhatsApp, isPending } = useSendWhatsApp();
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
    setValue,
    formState: { errors },
  } = useForm<SendWhatsAppSchema>({
    resolver: zodResolver(sendWhatsAppSchema),
  });

  const onSubmit = (data: SendWhatsAppSchema) => {
    sendWhatsApp(data, { onSuccess: () => { reset(); setCharCount(0); } });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-section space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
          <MessageCircle className="h-4 w-4 text-green-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Send WhatsApp</h2>
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

      {/* To */}
      <div className="space-y-1.5">
        <Label htmlFor="to">To (WhatsApp Number)</Label>
        <Input
          id="to"
          type="tel"
          placeholder="+244923456789"
          error={errors.to?.message}
          {...register('to')}
        />
        <p className="text-xs text-gray-400">
          Angola format: +244 followed by 9 digits
        </p>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="message">Message</Label>
          <span className="text-xs text-gray-400">
            {charCount}/4096 chars
          </span>
        </div>
        <Textarea
          id="message"
          placeholder="Type your WhatsApp message..."
          rows={6}
          error={errors.message?.message}
          {...register('message', {
            onChange: (e) => setCharCount(e.target.value.length),
          })}
        />
      </div>

      {/* Cost info */}
      <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>WhatsApp message costs <span className="font-bold">AOA 3.00</span></span>
      </div>

      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700"
        loading={isPending}
      >
        <Send className="h-4 w-4 mr-2" />
        Send WhatsApp Message
      </Button>
    </form>
  );
}
