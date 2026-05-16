'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createApplicationSchema, type CreateApplicationSchema } from '@/lib/validations';
import { applicationsApi } from '@/lib/api';
import type { Application } from '@/types/api';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface ApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application | null;
}

export function ApplicationModal({
  open,
  onOpenChange,
  application,
}: ApplicationModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!application;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApplicationSchema>({
    resolver: zodResolver(createApplicationSchema),
  });

  useEffect(() => {
    if (application) {
      reset({ name: application.name, description: application.description || '' });
    } else {
      reset({ name: '', description: '' });
    }
  }, [application, reset, open]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateApplicationSchema) => {
      if (isEditing && application) {
        const response = await applicationsApi.updateApplication(application.id, data);
        return response.data.data;
      } else {
        const response = await applicationsApi.createApplication(data);
        return response.data.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(
        isEditing ? 'Application updated!' : 'Application created!',
        {
          description: isEditing
            ? 'Changes have been saved.'
            : 'Your new application is ready to use.',
        }
      );
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error('Failed', {
        description: axiosError.response?.data?.message || 'Please try again.',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Application' : 'New Application'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Application Name</Label>
            <Input
              id="name"
              placeholder="My App"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description{' '}
              <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of this application..."
              rows={3}
              {...register('description')}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditing ? 'Save Changes' : 'Create Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
