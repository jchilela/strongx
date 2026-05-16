'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Mail, Send, Info } from 'lucide-react';
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
import { sendEmailSchema, type SendEmailSchema } from '@/lib/validations';
import { applicationsApi } from '@/lib/api';
import { useSendEmail } from '@/hooks/useMessages';

export function SendEmailForm() {
  const { mutate: sendEmail, isPending } = useSendEmail();

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
  } = useForm<SendEmailSchema>({
    resolver: zodResolver(sendEmailSchema),
  });

  const onSubmit = (data: SendEmailSchema) => {
    sendEmail(data, { onSuccess: () => reset() });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-section space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
          <Mail className="h-4 w-4 text-[#fb923c]" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Single Email</h2>
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
        <Label htmlFor="to">To (Email Address)</Label>
        <Input
          id="to"
          type="email"
          placeholder="recipient@example.com"
          error={errors.to?.message}
          {...register('to')}
        />
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

      {/* Text Body */}
      <div className="space-y-1.5">
        <Label htmlFor="textBody">
          Plain Text Body{' '}
          <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </Label>
        <Textarea
          id="textBody"
          placeholder="Plain text fallback..."
          rows={3}
          {...register('textBody')}
        />
      </div>

      {/* Cost info */}
      <div className="flex items-center gap-2 bg-orange-50 text-orange-700 rounded-lg px-4 py-3 text-sm">
        <Info className="h-4 w-4 flex-shrink-0" />
        <span>Single email costs <span className="font-bold">AOA 1.00</span></span>
      </div>

      <Button type="submit" className="w-full bg-[#fb923c] hover:bg-[#f97316]" loading={isPending}>
        <Send className="h-4 w-4 mr-2" />
        Send Email
      </Button>
    </form>
  );
}
