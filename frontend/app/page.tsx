import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  MessageSquare, Mail, MessageCircle, Zap, Shield, BarChart2,
  Code2, CheckCircle2, ArrowRight, Globe, Clock, Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'StrongX — SMS, Email & WhatsApp Platform for Angola',
  description:
    'Send SMS, Email and WhatsApp messages at scale with StrongX. Simple API, pay-per-message pricing in AOA, built for Angola.',
};

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="StrongX" width={110} height={63} className="object-contain" priority />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#api" className="hover:text-white transition-colors">API</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="https://app.strongx.it.ao/login"
            className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="https://app.strongx.it.ao/register"
            className="text-sm bg-[#6366f1] hover:bg-[#5254cc] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative bg-slate-900 pt-32 pb-24 overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-8">
          <Zap className="h-3.5 w-3.5" />
          Built for Angola — Pay in AOA
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          Send Messages at Scale.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-[#fb923c]">
            SMS, Email &amp; WhatsApp.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          StrongX is the all-in-one notification platform for Angolan businesses.
          Reach your customers via SMS, Email and WhatsApp through a single simple API.
          No monthly fees — pay only per message sent.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="https://app.strongx.it.ao/register"
            className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5254cc] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-indigo-500/30"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="https://app.strongx.it.ao/login"
            className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[
            { label: 'Channels', value: '3' },
            { label: 'Setup time', value: '< 5 min' },
            { label: 'Min. cost / SMS', value: '5 AOA' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const channels = [
    {
      icon: MessageSquare,
      color: 'bg-indigo-500',
      title: 'SMS',
      description:
        'Send transactional and promotional SMS to any Angolan number. High delivery rates through TelcoSMS.',
    },
    {
      icon: Mail,
      color: 'bg-orange-500',
      title: 'Email',
      description:
        'Deliver transactional emails and bulk campaigns reliably. Full HTML support with delivery tracking.',
    },
    {
      icon: MessageCircle,
      color: 'bg-green-500',
      title: 'WhatsApp',
      description:
        'Reach customers on their preferred channel. Send notifications, alerts and marketing messages via WhatsApp.',
    },
  ];

  const advantages = [
    {
      icon: Code2,
      title: 'Simple REST API',
      description: 'Integrate in minutes with our clean REST API. SDKs and code examples provided.',
    },
    {
      icon: BarChart2,
      title: 'Real-time Dashboard',
      description: 'Track delivery status, message history and spending in real time from your dashboard.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'API key authentication per application. Your data is encrypted and never shared.',
    },
    {
      icon: Globe,
      title: 'Angola-First',
      description: 'Built specifically for the Angolan market. Prices in AOA, local payment via AppyPay.',
    },
    {
      icon: Clock,
      title: 'Pay As You Go',
      description: 'No monthly fees. Top up your wallet and pay only per message you actually send.',
    },
    {
      icon: Star,
      title: 'Multi-Application',
      description: 'Manage multiple projects with separate applications and API keys per product.',
    },
  ];

  return (
    <section id="features" className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            One platform, three powerful channels
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Manage all your customer communications from a single dashboard and API.
          </p>
        </div>

        {/* Channel cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {channels.map((ch) => (
            <div key={ch.title} className="rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${ch.color} mb-5`}>
                <ch.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{ch.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{ch.description}</p>
            </div>
          ))}
        </div>

        {/* Advantages grid */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Why teams choose StrongX
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((adv) => (
            <div key={adv.title} className="flex gap-4 p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                <adv.icon className="h-5 w-5 text-[#6366f1]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{adv.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{adv.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      icon: MessageSquare,
      channel: 'SMS',
      price: '5',
      unit: 'AOA / message',
      color: 'border-indigo-200 bg-indigo-50',
      iconBg: 'bg-[#6366f1]',
      features: [
        'Delivery to any Angolan number',
        'Sender name customisation',
        'Delivery status tracking',
        'Bulk sending support',
      ],
    },
    {
      icon: Mail,
      channel: 'Email',
      price: '1',
      unit: 'AOA / message',
      color: 'border-orange-200 bg-orange-50',
      iconBg: 'bg-[#fb923c]',
      featured: true,
      features: [
        'Full HTML email support',
        'Bulk campaigns',
        'Delivery & open tracking',
        'Custom sender domain',
      ],
    },
    {
      icon: MessageCircle,
      channel: 'WhatsApp',
      price: '8',
      unit: 'AOA / message',
      color: 'border-green-200 bg-green-50',
      iconBg: 'bg-green-500',
      features: [
        'WhatsApp Business API',
        'Rich message support',
        'Read receipts',
        'Notification templates',
      ],
    },
  ];

  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            No monthly fees. No setup costs. Top up your wallet in AOA and pay only for what you send.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.channel}
              className={`rounded-2xl border-2 p-8 ${plan.color} ${plan.featured ? 'ring-2 ring-[#6366f1] ring-offset-2' : ''}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${plan.iconBg} mb-5`}>
                <plan.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.channel}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.unit}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="https://app.strongx.it.ao/register"
                className="block text-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Get started
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Custom pricing available for high-volume senders. Contact us for enterprise rates.
        </p>
      </div>
    </section>
  );
}

function ApiSection() {
  const snippet = `curl -X POST https://api.strongx.it.ao/v1/sms/send \\
  -H "Authorization: Bearer strx_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+244912345678",
    "message": "Hello from StrongX!"
  }'`;

  return (
    <section id="api" className="bg-slate-900 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-6">
            <Code2 className="h-3.5 w-3.5" />
            Developer-ready
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
            Integrate in minutes
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Our REST API is straightforward and well-documented. Create an application, generate an API key, and start sending messages with a single HTTP request.
          </p>
          <ul className="space-y-3">
            {[
              'RESTful JSON API',
              'Per-application API keys',
              'Real-time delivery webhooks',
              'Full message history',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-700/50 border-b border-slate-700">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-slate-400 font-mono">Send SMS</span>
          </div>
          <pre className="p-5 text-sm text-slate-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
            {snippet}
          </pre>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Ready to reach your customers?
        </h2>
        <p className="text-indigo-200 text-lg mb-10">
          Create your free account, top up your wallet and send your first message in under 5 minutes.
        </p>
        <Link
          href="https://app.strongx.it.ao/register"
          className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl text-base hover:bg-indigo-50 transition-colors shadow-lg"
        >
          Create Free Account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/logo.png" alt="StrongX" width={100} height={57} className="object-contain" />
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="https://app.strongx.it.ao/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="https://app.strongx.it.ao/register" className="hover:text-white transition-colors">Register</Link>
            <a href="mailto:info@strongbox.ao" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} StrongX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main>
      <NavBar />
      <Hero />
      <Features />
      <Pricing />
      <ApiSection />
      <CTA />
      <Footer />
    </main>
  );
}
