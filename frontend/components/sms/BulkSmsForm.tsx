'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import {
  Upload, Download, Send, X, CheckCircle2, XCircle, Loader2, FileSpreadsheet, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { applicationsApi, messagesApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Contact {
  phone: string;
  name: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Phone', 'Name'],
    ['244923456789', 'João Silva'],
    ['244912345678', 'Maria Santos'],
    ['244934567890', 'Carlos Mendes'],
  ]);
  ws['!cols'] = [{ wch: 20 }, { wch: 25 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
  XLSX.writeFile(wb, 'strongx-sms-template.xlsx');
}

function parseExcel(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

        const contacts: Contact[] = rows
          .map((row) => {
            // Accept both "Phone"/"phone" and "Name"/"name" headers
            const rawPhone = String(
              row['Phone'] ?? row['phone'] ?? row['PHONE'] ?? ''
            ).trim().replace(/\s+/g, '').replace(/^\+/, '');
            const rawName = String(
              row['Name'] ?? row['name'] ?? row['NAME'] ?? ''
            ).trim();
            return { phone: rawPhone, name: rawName, status: 'pending' as const };
          })
          .filter((c) => c.phone.length >= 9);

        if (!contacts.length) reject(new Error('No valid contacts found. Check the file has Phone and Name columns.'));
        else resolve(contacts);
      } catch {
        reject(new Error('Failed to parse file. Make sure it is a valid .xlsx or .csv file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

const SEND_DELAY_MS = 600;

export function BulkSmsForm() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [applicationId, setApplicationId] = useState('');
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const abortRef = useRef(false);

  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await applicationsApi.getApplications()).data.data,
  });

  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) return;
    try {
      const parsed = await parseExcel(file);
      setContacts(parsed);
      setSentCount(0);
      toast.success(`${parsed.length} contact${parsed.length !== 1 ? 's' : ''} loaded`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, [handleFileChange]);

  const handleSend = async () => {
    if (!applicationId) { toast.error('Select an application'); return; }
    if (!message.trim()) { toast.error('Enter a message'); return; }
    if (!contacts.length) { toast.error('Upload a contacts file'); return; }

    const pending = contacts.filter((c) => c.status === 'pending');
    if (!pending.length) { toast.error('No pending contacts to send to'); return; }

    setIsSending(true);
    abortRef.current = false;
    let sent = sentCount;

    for (let i = 0; i < contacts.length; i++) {
      if (abortRef.current) break;
      if (contacts[i].status !== 'pending') continue;

      setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'sending' } : c));

      const personalised = message.replace(/\{\{name\}\}/gi, contacts[i].name);

      try {
        await messagesApi.sendSms({
          to: contacts[i].phone,
          message: personalised,
          applicationId,
        } as Parameters<typeof messagesApi.sendSms>[0]);
        setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'sent' } : c));
        sent++;
        setSentCount(sent);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed';
        setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, status: 'failed', error: msg } : c));
      }

      if (i < contacts.length - 1) {
        await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
      }
    }

    setIsSending(false);
    queryClient.invalidateQueries({ queryKey: ['messages', 'sms'] });
    toast.success(`Done — ${sent} message${sent !== 1 ? 's' : ''} sent`);
  };

  const pendingCount = contacts.filter((c) => c.status === 'pending').length;
  const failedCount = contacts.filter((c) => c.status === 'failed').length;
  const progress = contacts.length > 0 ? Math.round((sentCount / contacts.length) * 100) : 0;

  return (
    <div className="form-section space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <FileSpreadsheet className="h-4 w-4 text-[#6366f1]" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Bulk SMS</h2>
      </div>

      {/* Application */}
      <div className="space-y-1.5">
        <Label>Application</Label>
        <Select onValueChange={setApplicationId} value={applicationId}>
          <SelectTrigger>
            <SelectValue placeholder="Select application" />
          </SelectTrigger>
          <SelectContent>
            {applications?.map((app) => (
              <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Message</Label>
          <span className="text-xs text-gray-400">{message.length}/160</span>
        </div>
        <Textarea
          placeholder={`Hello {{name}}, your message here...`}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> to personalise with the contact's name
        </p>
      </div>

      {/* Template download + upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Contacts file</Label>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            Download template
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
        >
          <Upload className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {contacts.length > 0
              ? <span className="text-indigo-600 font-medium">{contacts.length} contacts loaded — click to replace</span>
              : <>Drop your <strong>.xlsx</strong> or <strong>.csv</strong> here, or click to browse</>
            }
          </p>
          <p className="text-xs text-gray-400 mt-1">Column A: Phone number · Column B: Name</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Contact preview table */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">
              {contacts.length} contacts
              {failedCount > 0 && <span className="text-red-500 ml-2">· {failedCount} failed</span>}
            </p>
            {!isSending && (
              <button
                type="button"
                onClick={() => { setContacts([]); setSentCount(0); }}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
            {contacts.map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800">{c.name || '—'}</span>
                  <span className="text-gray-400 ml-2 font-mono text-xs">{c.phone}</span>
                </div>
                <div className="flex-shrink-0">
                  {c.status === 'pending' && <span className="text-xs text-gray-300">—</span>}
                  {c.status === 'sending' && <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />}
                  {c.status === 'sent' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {c.status === 'failed' && (
                    <span title={c.error}>
                      <XCircle className="h-4 w-4 text-red-400" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {isSending && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Sending...</span>
                <span>{sentCount} / {contacts.length}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send / Stop */}
      <div className="flex gap-2">
        {isSending ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { abortRef.current = true; }}
          >
            <X className="h-4 w-4 mr-2" /> Stop sending
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={!pendingCount || !applicationId || !message.trim()}
            onClick={handleSend}
          >
            <Send className="h-4 w-4 mr-2" />
            Send to {pendingCount || contacts.length || 0} contact{(pendingCount || contacts.length) !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </div>
  );
}
