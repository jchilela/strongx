'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createApiKeySchema, type CreateApiKeySchema } from '@/lib/validations';
import { apiKeysApi, applicationsApi } from '@/lib/api';
import type { CreateApiKeyResponse } from '@/types/api';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface CreateKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKeyModal({ open, onOpenChange }: CreateKeyModalProps) {
  const queryClient = useQueryClient();
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeySchema>({
    resolver: zodResolver(createApiKeySchema),
  });

  const { mutate: createKey, isPending } = useMutation({
    mutationFn: async (data: CreateApiKeySchema) => {
      const response = await apiKeysApi.createApiKey(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey(data);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error('Failed to create key', {
        description: axiosError.response?.data?.message || 'Please try again.',
      });
    },
  });

  const handleCopy = async () => {
    if (!createdKey?.fullKey) return;
    try {
      await copyToClipboard(createdKey.fullKey);
      setCopied(true);
      toast.success('API key copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleClose = () => {
    setCreatedKey(null);
    setCopied(false);
    reset();
    onOpenChange(false);
  };

  // Show created key view
  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              API Key Created
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-semibold">Save this key now</p>
                <p className="mt-0.5">
                  This is the only time the full key will be shown. If you lose it, you&apos;ll need to create a new one.
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">Your API Key</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 text-green-400 font-mono text-sm rounded-lg px-4 py-3 overflow-x-auto whitespace-nowrap">
                  {createdKey.fullKey}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Key name:</span>{' '}
                {createdKey.apiKey.name}
              </p>
              {createdKey.apiKey.applicationName && (
                <p className="text-gray-700">
                  <span className="font-medium">Application:</span>{' '}
                  {createdKey.apiKey.applicationName}
                </p>
              )}
              <p className="text-gray-700">
                <span className="font-medium">Prefix:</span>{' '}
                <span className="font-mono">{createdKey.apiKey.prefix}...</span>
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              I&apos;ve saved my key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => createKey(data))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="keyName">Key Name</Label>
            <Input
              id="keyName"
              placeholder="My production key"
              error={errors.name?.message}
              {...register('name')}
            />
            <p className="text-xs text-gray-400">
              A descriptive name to identify this key
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Application (Optional)</Label>
            <Select onValueChange={(val) => setValue('applicationId', val === 'none' ? undefined : val)}>
              <SelectTrigger>
                <SelectValue placeholder="No specific application" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific application</SelectItem>
                {applications?.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('applicationId')} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isPending}>
              Create Key
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
