'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, CheckCircle, Smartphone, Building } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { topUpSchema, type TopUpSchema } from '@/lib/validations';
import { useTopUp } from '@/hooks/useWallet';
import type { TopUpResponse } from '@/types/wallet';
import { formatCurrency, copyToClipboard } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopUpModal({ open, onOpenChange }: TopUpModalProps) {
  const [topUpResult, setTopUpResult] = useState<TopUpResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { mutate: topUp, isPending } = useTopUp();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TopUpSchema>({
    resolver: zodResolver(topUpSchema),
    defaultValues: {
      paymentMethod: 'reference',
      phone: '+244',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const amount = watch('amount');

  const handleCopy = async (text: string, field: string) => {
    try {
      await copyToClipboard(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const onSubmit = (data: TopUpSchema) => {
    topUp(data, {
      onSuccess: (result) => {
        if (result.paymentMethod === 'gpo') {
          toast.success('Payment successful!', { description: 'Your wallet has been credited.' });
          handleClose();
        } else {
          setTopUpResult(result);
        }
      },
    });
  };

  const handleClose = () => {
    setTopUpResult(null);
    reset();
    onOpenChange(false);
  };

  // Reference payment result
  if (topUpResult && paymentMethod === 'reference') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Payment Reference Created
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
              Use the following details to pay at any Multicaixa ATM or via the Multicaixa Express app.
            </div>

            <div className="space-y-3">
              {[
                { label: 'Entity', value: topUpResult.entity || '11111', field: 'entity' },
                { label: 'Reference', value: topUpResult.reference || 'REF123456789', field: 'reference' },
                { label: 'Amount', value: formatCurrency(topUpResult.amount || amount), field: 'amount' },
              ].map(({ label, value, field }) => (
                <div key={field} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-gray-900 font-mono">{value}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(value, field)}
                    className="p-1.5 text-gray-400 hover:text-[#6366f1] transition-colors"
                  >
                    {copiedField === field ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Referência válida por 48 horas. O saldo será atualizado automaticamente após o pagamento.
            </p>
            <p className="text-xs text-indigo-500 text-center">
              Esta referência também está guardada no seu histórico de transações e foi enviada para o seu email.
            </p>

            <Button onClick={handleClose} className="w-full">
              Done
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
          <DialogTitle>Top Up Wallet</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (AOA)</Label>
            <Input
              id="amount"
              type="number"
              min={150}
              placeholder="1000"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: 'gpo',
                  label: 'GPO / Multicaixa Express',
                  icon: <Smartphone className="h-5 w-5" />,
                  desc: 'Pay via phone',
                },
                {
                  value: 'reference',
                  label: 'ATM / Multicaixa',
                  icon: <Building className="h-5 w-5" />,
                  desc: 'Pay at ATM',
                },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setValue('paymentMethod', method.value as 'gpo' | 'reference')}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm transition-all',
                    paymentMethod === method.value
                      ? 'border-[#6366f1] bg-indigo-50 text-[#6366f1]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {method.icon}
                  <span className="font-medium text-xs">{method.label}</span>
                  <span className="text-xs opacity-70">{method.desc}</span>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('paymentMethod')} />
          </div>

          {/* Phone (GPO only) */}
          {paymentMethod === 'gpo' && (
            <div className="space-y-1.5">
              <Label htmlFor="phone">Multicaixa Express Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+244923456789"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>
          )}

          {/* Amount preview */}
          {amount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm">
              <p className="text-orange-700">
                You will top up <span className="font-bold">{formatCurrency(amount)}</span> to your wallet
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isPending}>
              {paymentMethod === 'gpo' ? 'Pay with GPO' : 'Get Reference'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
