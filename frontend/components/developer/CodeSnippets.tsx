'use client';

import { useState } from 'react';
import { Copy, CheckCircle, Terminal } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

const API_BASE = 'https://api.strongx.it.ao/v1';

const snippets = {
  sms: {
    curl: `curl -X POST ${API_BASE}/sms/send \\
  -H "Authorization: Bearer strx_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+244923456789",
    "message": "Hello from StrongX!",
    "applicationId": "YOUR_APP_ID"
  }'`,
    python: `import requests

response = requests.post(
    "${API_BASE}/sms/send",
    headers={
        "Authorization": "Bearer strx_YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "to": "+244923456789",
        "message": "Hello from StrongX!",
        "applicationId": "YOUR_APP_ID"
    }
)

data = response.json()
print(f"Message ID: {data['data']['id']}")
print(f"Status: {data['data']['status']}")`,
    nodejs: `const axios = require('axios');

const response = await axios.post(
  '${API_BASE}/sms/send',
  {
    to: '+244923456789',
    message: 'Hello from StrongX!',
    applicationId: 'YOUR_APP_ID',
  },
  {
    headers: {
      'Authorization': 'Bearer strx_YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
  }
);

console.log('Message ID:', response.data.data.id);
console.log('Status:', response.data.data.status);`,
    php: `<?php
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => '${API_BASE}/sms/send',
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer strx_YOUR_API_KEY',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'to' => '+244923456789',
        'message' => 'Hello from StrongX!',
        'applicationId' => 'YOUR_APP_ID',
    ]),
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

echo 'Message ID: ' . $response['data']['id'];
echo 'Status: ' . $response['data']['status'];`,
  },
  email: {
    curl: `curl -X POST ${API_BASE}/email/send \\
  -H "Authorization: Bearer strx_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "user@example.com",
    "subject": "Hello from StrongX!",
    "htmlBody": "<h1>Hello!</h1><p>This is a test email.</p>",
    "textBody": "Hello! This is a test email.",
    "applicationId": "YOUR_APP_ID"
  }'`,
    python: `import requests

response = requests.post(
    "${API_BASE}/email/send",
    headers={
        "Authorization": "Bearer strx_YOUR_API_KEY",
    },
    json={
        "to": "user@example.com",
        "subject": "Hello from StrongX!",
        "htmlBody": "<h1>Hello!</h1><p>This is a test email.</p>",
        "applicationId": "YOUR_APP_ID"
    }
)

data = response.json()
print(f"Email ID: {data['data']['id']}")`,
    nodejs: `const axios = require('axios');

const response = await axios.post(
  '${API_BASE}/email/send',
  {
    to: 'user@example.com',
    subject: 'Hello from StrongX!',
    htmlBody: '<h1>Hello!</h1><p>This is a test email.</p>',
    applicationId: 'YOUR_APP_ID',
  },
  {
    headers: { 'Authorization': 'Bearer strx_YOUR_API_KEY' },
  }
);

console.log('Email ID:', response.data.data.id);`,
    php: `<?php
$ch = curl_init('${API_BASE}/email/send');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer strx_YOUR_API_KEY',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'to' => 'user@example.com',
        'subject' => 'Hello from StrongX!',
        'htmlBody' => '<h1>Hello!</h1>',
        'applicationId' => 'YOUR_APP_ID',
    ]),
]);
$response = json_decode(curl_exec($ch), true);`,
  },
  whatsapp: {
    curl: `curl -X POST ${API_BASE}/whatsapp/send \\
  -H "Authorization: Bearer strx_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+244923456789",
    "message": "Hello from StrongX via WhatsApp!",
    "applicationId": "YOUR_APP_ID"
  }'`,
    python: `import requests

response = requests.post(
    "${API_BASE}/whatsapp/send",
    headers={
        "Authorization": "Bearer strx_YOUR_API_KEY",
    },
    json={
        "to": "+244923456789",
        "message": "Hello from StrongX via WhatsApp!",
        "applicationId": "YOUR_APP_ID"
    }
)

data = response.json()
print(f"Message ID: {data['data']['id']}")`,
    nodejs: `const axios = require('axios');

const response = await axios.post(
  '${API_BASE}/whatsapp/send',
  {
    to: '+244923456789',
    message: 'Hello from StrongX via WhatsApp!',
    applicationId: 'YOUR_APP_ID',
  },
  {
    headers: { 'Authorization': 'Bearer strx_YOUR_API_KEY' },
  }
);

console.log('Message ID:', response.data.data.id);`,
    php: `<?php
$ch = curl_init('${API_BASE}/whatsapp/send');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer strx_YOUR_API_KEY',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'to' => '+244923456789',
        'message' => 'Hello via WhatsApp!',
        'applicationId' => 'YOUR_APP_ID',
    ]),
]);
$response = json_decode(curl_exec($ch), true);`,
  },
};

type Channel = keyof typeof snippets;
type Lang = 'curl' | 'python' | 'nodejs' | 'php';

interface CodeBlockProps {
  code: string;
}

function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(code);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="relative group">
      <pre className="code-block overflow-x-auto whitespace-pre-wrap break-words text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? (
          <CheckCircle className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function CodeSnippets() {
  const [channel, setChannel] = useState<Channel>('sms');

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 p-5 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
          <Terminal className="h-4 w-4 text-slate-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Code Snippets</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Channel selector */}
        <div className="flex gap-2">
          {(['sms', 'email', 'whatsapp'] as Channel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                channel === ch
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {ch === 'whatsapp' ? 'WhatsApp' : ch.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Language tabs */}
        <Tabs defaultValue="curl">
          <TabsList>
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="nodejs">Node.js</TabsTrigger>
            <TabsTrigger value="php">PHP</TabsTrigger>
          </TabsList>

          {(['curl', 'python', 'nodejs', 'php'] as Lang[]).map((lang) => (
            <TabsContent key={lang} value={lang}>
              <CodeBlock code={snippets[channel][lang]} />
            </TabsContent>
          ))}
        </Tabs>

        {/* API docs note */}
        <p className="text-xs text-gray-400">
          Replace <code className="bg-gray-100 px-1 rounded">strx_YOUR_API_KEY</code> with your actual API key and{' '}
          <code className="bg-gray-100 px-1 rounded">YOUR_APP_ID</code> with your application ID.
        </p>
      </div>
    </div>
  );
}
