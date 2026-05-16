import { Badge } from '@/components/ui/badge';
import type { MessageStatus } from '@/types/message';
import type { TransactionStatus, TransactionType } from '@/types/wallet';

interface MessageStatusBadgeProps {
  status: MessageStatus;
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  const config: Record<MessageStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' }> = {
    queued: { label: 'Queued', variant: 'warning' },
    sent: { label: 'Sent', variant: 'info' },
    delivered: { label: 'Delivered', variant: 'success' },
    failed: { label: 'Failed', variant: 'destructive' },
    read: { label: 'Read', variant: 'success' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'secondary' };

  return <Badge variant={variant}>{label}</Badge>;
}

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  const config: Record<TransactionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' }> = {
    pending: { label: 'Pending', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    failed: { label: 'Failed', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'secondary' };

  return <Badge variant={variant}>{label}</Badge>;
}

interface TransactionTypeBadgeProps {
  type: TransactionType;
}

export function TransactionTypeBadge({ type }: TransactionTypeBadgeProps) {
  if (type === 'credit') {
    return <Badge variant="success">Credit</Badge>;
  }
  return <Badge variant="accent">Debit</Badge>;
}
