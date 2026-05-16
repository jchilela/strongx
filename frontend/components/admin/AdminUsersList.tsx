'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, ChevronRight, Key,
  DollarSign, Shield, ShieldOff, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { adminApi } from '@/lib/api';
import type { AdminUser } from '@/types/admin';
import type { ApiKey } from '@/types/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

function PricingModal({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [smsCost, setSmsCost] = useState(user.smsCost?.toString() ?? '');
  const [emailCost, setEmailCost] = useState(user.emailCost?.toString() ?? '');
  const [whatsappCost, setWhatsappCost] = useState(user.whatsappCost?.toString() ?? '');

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      adminApi.updateUser(user.id, {
        smsCost: smsCost === '' ? null : parseFloat(smsCost),
        emailCost: emailCost === '' ? null : parseFloat(emailCost),
        whatsappCost: whatsappCost === '' ? null : parseFloat(whatsappCost),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Pricing updated');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update pricing'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Custom Pricing — {user.name}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 -mt-2">Leave blank to use global defaults.</p>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sms-cost">SMS cost per unit (AOA)</Label>
            <Input
              id="sms-cost"
              type="number"
              min="0"
              step="0.0001"
              placeholder="Global default"
              value={smsCost}
              onChange={(e) => setSmsCost(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-cost">Email cost per unit (AOA)</Label>
            <Input
              id="email-cost"
              type="number"
              min="0"
              step="0.0001"
              placeholder="Global default"
              value={emailCost}
              onChange={(e) => setEmailCost(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-cost">WhatsApp cost per unit (AOA)</Label>
            <Input
              id="whatsapp-cost"
              type="number"
              min="0"
              step="0.0001"
              placeholder="Global default"
              value={whatsappCost}
              onChange={(e) => setWhatsappCost(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save()} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeysModal({
  user,
  open,
  onOpenChange,
}: {
  user: AdminUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ['admin-user-keys', user.id],
    queryFn: async () => {
      const res = await adminApi.getUserApiKeys(user.id);
      return res.data.data as ApiKey[];
    },
    enabled: open,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ keyId, isActive }: { keyId: string; isActive: boolean }) =>
      adminApi.toggleApiKey(keyId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-keys', user.id] });
      toast.success('API key updated');
    },
    onError: () => toast.error('Failed to update key'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>API Keys — {user.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 flex justify-center"><RefreshCw className="h-5 w-5 animate-spin text-gray-400" /></div>
        ) : !keys?.length ? (
          <p className="text-sm text-gray-500 py-4 text-center">No API keys found.</p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{key.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{key.prefix}••••••••</p>
                  {key.applicationName && (
                    <p className="text-xs text-indigo-500">{key.applicationName}</p>
                  )}
                </div>
                <Switch
                  checked={key.isActive}
                  onCheckedChange={(checked) => toggle({ keyId: key.id, isActive: checked })}
                />
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminUsersList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pricingUser, setPricingUser] = useState<AdminUser | null>(null);
  const [keysUser, setKeysUser] = useState<AdminUser | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await adminApi.getUsers();
      return res.data.data as AdminUser[];
    },
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUser(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const filtered = users?.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q)
    );
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {/* Search + links */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/admin/applications">
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4 mr-1" />
            Applications
          </Button>
        </Link>
      </div>

      {/* Table */}
      {!filtered?.length ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState icon={Users} title="No users found" description="No users match your search." />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pricing (AOA)</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-400">{user.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={user.isActive ? 'success' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.isAdmin && <Badge variant="default">Admin</Badge>}
                        {!user.emailVerified && <Badge variant="warning">Email unverified</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 space-y-0.5">
                      <p>SMS: {user.smsCost != null ? `${user.smsCost}` : <span className="text-gray-400">default</span>}</p>
                      <p>Email: {user.emailCost != null ? `${user.emailCost}` : <span className="text-gray-400">default</span>}</p>
                      <p>WA: {user.whatsappCost != null ? `${user.whatsappCost}` : <span className="text-gray-400">default</span>}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(user.createdAt).split(',')[0]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleActive({ id: user.id, isActive: !user.isActive })}
                        >
                          {user.isActive ? (
                            <ShieldOff className="h-4 w-4 text-red-400" />
                          ) : (
                            <Shield className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit pricing"
                          onClick={() => setPricingUser(user)}
                        >
                          <DollarSign className="h-4 w-4 text-indigo-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Manage API keys"
                          onClick={() => setKeysUser(user)}
                        >
                          <Key className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pricingUser && (
        <PricingModal
          user={pricingUser}
          open={!!pricingUser}
          onOpenChange={(open) => { if (!open) setPricingUser(null); }}
        />
      )}
      {keysUser && (
        <ApiKeysModal
          user={keysUser}
          open={!!keysUser}
          onOpenChange={(open) => { if (!open) setKeysUser(null); }}
        />
      )}
    </div>
  );
}
