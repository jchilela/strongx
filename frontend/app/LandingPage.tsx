'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MessageSquare, Mail, MessageCircle, Zap, Shield, BarChart2,
  Code2, CheckCircle2, ArrowRight, Globe, Clock, Star, Phone,
} from 'lucide-react';

type Lang = 'pt' | 'en';

const translations = {
  pt: {
    nav: {
      features: 'Funcionalidades',
      pricing: 'Preços',
      api: 'API',
      contact: 'Contacto',
      signIn: 'Entrar',
      getStarted: 'Começar Agora',
    },
    hero: {
      badge: 'Feito para Angola — Pague em AOA',
      h1a: 'Envie Mensagens em Escala.',
      h1b: 'SMS, Email e WhatsApp.',
      description:
        'StrongX é a plataforma de notificações completa para empresas angolanas. Alcance os seus clientes via SMS, Email e WhatsApp através de uma API simples e única. Sem mensalidades — pague apenas por mensagem enviada.',
      createAccount: 'Criar Conta Gratuita',
      signIn: 'Entrar no Painel',
      stats: [
        { label: 'Canais', value: '3' },
        { label: 'Configuração', value: '< 5 min' },
        { label: 'A partir de', value: '9 AOA/SMS' },
      ],
    },
    features: {
      h2: 'Uma plataforma, três canais poderosos',
      sub: 'Gira todas as comunicações com os seus clientes a partir de um único painel e API.',
      channels: [
        {
          title: 'SMS',
          description:
            'Envie SMS transacionais e promocionais para qualquer número angolano. Altas taxas de entrega através da TelcoSMS.',
        },
        {
          title: 'Email',
          description:
            'Entregue emails transacionais e campanhas em massa de forma fiável. Suporte HTML completo com rastreamento de entrega.',
        },
        {
          title: 'WhatsApp',
          description:
            'Alcance os clientes no canal preferido. Envie notificações, alertas e mensagens de marketing via WhatsApp.',
        },
      ],
      whyTitle: 'Por que as equipas escolhem o StrongX',
      advantages: [
        { title: 'API REST Simples', description: 'Integre em minutos com a nossa API REST. SDKs e exemplos de código disponíveis.' },
        { title: 'Painel em Tempo Real', description: 'Acompanhe o estado de entrega, histórico de mensagens e gastos em tempo real.' },
        { title: 'Seguro e Fiável', description: 'Autenticação por chave API por aplicação. Os seus dados são encriptados e nunca partilhados.' },
        { title: 'Angola em Primeiro', description: 'Construído especificamente para o mercado angolano. Preços em AOA, pagamento local.' },
        { title: 'Pague Conforme Usa', description: 'Sem mensalidades. Carregue a sua carteira e pague apenas pelas mensagens que envia.' },
        { title: 'Multi-Aplicação', description: 'Gira múltiplos projetos com aplicações separadas e chaves API por produto.' },
      ],
    },
    pricing: {
      h2: 'Preços simples e transparentes',
      sub: 'Sem mensalidades. Sem custos de configuração. Carregue a sua carteira em AOA e pague apenas o que envia.',
      startingFrom: 'A partir de',
      perMsg: 'AOA / mensagem',
      volume: 'Volume',
      price: 'Preço',
      smsTiers: [
        { range: '1 – 50.000 SMS', price: '11 AOA' },
        { range: '50.001 – 150.000 SMS', price: '10 AOA' },
        { range: '1.000.001 – 6.000.000 SMS', price: '9 AOA' },
      ],
      smsFeatures: [
        'Entrega a qualquer número angolano',
        'Personalização do nome do remetente',
        'Rastreamento do estado de entrega',
        'Envio em massa',
      ],
      emailFeatures: [
        'Suporte HTML completo',
        'Campanhas em massa',
        'Rastreamento de entrega e abertura',
        'Domínio de remetente personalizado',
      ],
      whatsappFeatures: [
        'WhatsApp Business API',
        'Suporte a mensagens ricas',
        'Confirmações de leitura',
        'Modelos de notificação',
      ],
      customPricing: 'Preços personalizados disponíveis para grandes volumes. Contacte-nos.',
      getStarted: 'Começar',
      comingSoon: 'Brevemente',
    },
    api: {
      badge: 'Pronto para Developers',
      h2: 'Integre em minutos',
      description:
        'A nossa API REST é simples e bem documentada. Crie uma aplicação, gere uma chave API e comece a enviar mensagens com um único pedido HTTP.',
      features: [
        'API REST em JSON',
        'Chaves API por aplicação',
        'Webhooks de entrega em tempo real',
        'Histórico completo de mensagens',
      ],
    },
    contact: {
      h2: 'Contacto',
      sub: 'Estamos disponíveis para responder às suas questões.',
      email: 'Email',
      phone: 'Telefone',
    },
    cta: {
      h2: 'Pronto para alcançar os seus clientes?',
      description: 'Crie a sua conta gratuita, carregue a sua carteira e envie a primeira mensagem em menos de 5 minutos.',
      button: 'Criar Conta Gratuita',
    },
    footer: {
      rights: 'Todos os direitos reservados.',
      signIn: 'Entrar',
      register: 'Registar',
      contact: 'Contacto',
    },
  },
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      api: 'API',
      contact: 'Contact',
      signIn: 'Sign In',
      getStarted: 'Get Started',
    },
    hero: {
      badge: 'Built for Angola — Pay in AOA',
      h1a: 'Send Messages at Scale.',
      h1b: 'SMS, Email & WhatsApp.',
      description:
        'StrongX is the all-in-one notification platform for Angolan businesses. Reach your customers via SMS, Email and WhatsApp through a single simple API. No monthly fees — pay only per message sent.',
      createAccount: 'Create Free Account',
      signIn: 'Sign In to Dashboard',
      stats: [
        { label: 'Channels', value: '3' },
        { label: 'Setup time', value: '< 5 min' },
        { label: 'Starting from', value: '9 AOA/SMS' },
      ],
    },
    features: {
      h2: 'One platform, three powerful channels',
      sub: 'Manage all your customer communications from a single dashboard and API.',
      channels: [
        {
          title: 'SMS',
          description:
            'Send transactional and promotional SMS to any Angolan number. High delivery rates through TelcoSMS.',
        },
        {
          title: 'Email',
          description:
            'Deliver transactional emails and bulk campaigns reliably. Full HTML support with delivery tracking.',
        },
        {
          title: 'WhatsApp',
          description:
            'Reach customers on their preferred channel. Send notifications, alerts and marketing messages via WhatsApp.',
        },
      ],
      whyTitle: 'Why teams choose StrongX',
      advantages: [
        { title: 'Simple REST API', description: 'Integrate in minutes with our clean REST API. SDKs and code examples provided.' },
        { title: 'Real-time Dashboard', description: 'Track delivery status, message history and spending in real time from your dashboard.' },
        { title: 'Secure & Reliable', description: 'API key authentication per application. Your data is encrypted and never shared.' },
        { title: 'Angola-First', description: 'Built specifically for the Angolan market. Prices in AOA, local payment.' },
        { title: 'Pay As You Go', description: 'No monthly fees. Top up your wallet and pay only per message you actually send.' },
        { title: 'Multi-Application', description: 'Manage multiple projects with separate applications and API keys per product.' },
      ],
    },
    pricing: {
      h2: 'Simple, transparent pricing',
      sub: 'No monthly fees. No setup costs. Top up your wallet in AOA and pay only for what you send.',
      startingFrom: 'Starting from',
      perMsg: 'AOA / message',
      volume: 'Volume',
      price: 'Price',
      smsTiers: [
        { range: '1 – 50,000 SMS', price: '11 AOA' },
        { range: '50,001 – 150,000 SMS', price: '10 AOA' },
        { range: '1,000,001 – 6,000,000 SMS', price: '9 AOA' },
      ],
      smsFeatures: [
        'Delivery to any Angolan number',
        'Sender name customisation',
        'Delivery status tracking',
        'Bulk sending support',
      ],
      emailFeatures: [
        'Full HTML email support',
        'Bulk campaigns',
        'Delivery & open tracking',
        'Custom sender domain',
      ],
      whatsappFeatures: [
        'WhatsApp Business API',
        'Rich message support',
        'Read receipts',
        'Notification templates',
      ],
      customPricing: 'Custom pricing available for high-volume senders. Contact us for enterprise rates.',
      getStarted: 'Get started',
      comingSoon: 'Coming Soon',
    },
    api: {
      badge: 'Developer-ready',
      h2: 'Integrate in minutes',
      description:
        'Our REST API is straightforward and well-documented. Create an application, generate an API key, and start sending messages with a single HTTP request.',
      features: [
        'RESTful JSON API',
        'Per-application API keys',
        'Real-time delivery webhooks',
        'Full message history',
      ],
    },
    contact: {
      h2: 'Contact',
      sub: 'We are available to answer your questions.',
      email: 'Email',
      phone: 'Phone',
    },
    cta: {
      h2: 'Ready to reach your customers?',
      description: 'Create your free account, top up your wallet and send your first message in under 5 minutes.',
      button: 'Create Free Account',
    },
    footer: {
      rights: 'All rights reserved.',
      signIn: 'Sign In',
      register: 'Register',
      contact: 'Contact',
    },
  },
};

const channelIcons = [MessageSquare, Mail, MessageCircle];
const channelColors = ['bg-indigo-500', 'bg-orange-500', 'bg-green-500'];
const advantageIcons = [Code2, BarChart2, Shield, Globe, Clock, Star];

const snippet = `curl -X POST https://api.strongx.it.ao/v1/sms/send \\
  -H "Authorization: Bearer strx_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+244912345678",
    "message": "Hello from StrongX!"
  }'`;

export function LandingPage() {
  const [lang, setLang] = useState<Lang>('pt');
  const tr = translations[lang];

  const LangToggle = () => (
    <div className="flex items-center gap-0.5 border border-slate-700 rounded-lg p-0.5">
      {(['pt', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors ${
            lang === l ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <main>
      {/* ── NavBar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="StrongX" width={110} height={63} className="object-contain" priority />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">{tr.nav.features}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{tr.nav.pricing}</a>
            <a href="#api" className="hover:text-white transition-colors">{tr.nav.api}</a>
            <a href="#contact" className="hover:text-white transition-colors">{tr.nav.contact}</a>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            <Link
              href="https://app.strongx.it.ao/login"
              className="hidden sm:block text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              {tr.nav.signIn}
            </Link>
            <Link
              href="https://app.strongx.it.ao/register"
              className="text-sm bg-[#6366f1] hover:bg-[#5254cc] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {tr.nav.getStarted}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-slate-900 pt-32 pb-24 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-8">
            <Zap className="h-3.5 w-3.5" />
            {tr.hero.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            {tr.hero.h1a}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-[#fb923c]">
              {tr.hero.h1b}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            {tr.hero.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="https://app.strongx.it.ao/register"
              className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5254cc] text-white font-bold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-indigo-500/30"
            >
              {tr.hero.createAccount}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="https://app.strongx.it.ao/login"
              className="flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              {tr.hero.signIn}
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {tr.hero.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {tr.features.h2}
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">{tr.features.sub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {tr.features.channels.map((ch, i) => {
              const Icon = channelIcons[i];
              return (
                <div key={ch.title} className="rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-shadow">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${channelColors[i]} mb-5`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{ch.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{ch.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
              {tr.features.whyTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tr.features.advantages.map((adv, i) => {
              const Icon = advantageIcons[i];
              return (
                <div key={adv.title} className="flex gap-4 p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                    <Icon className="h-5 w-5 text-[#6366f1]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{adv.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{adv.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              {tr.pricing.h2}
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">{tr.pricing.sub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SMS — tiered pricing */}
            <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1] mb-5">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">SMS</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">9</span>
                <span className="text-gray-500 text-sm">{tr.pricing.perMsg}</span>
              </div>
              <p className="text-xs text-gray-400 mb-5">{tr.pricing.startingFrom}</p>

              {/* Volume tiers table */}
              <div className="rounded-xl overflow-hidden border border-indigo-200 mb-6">
                <div className="grid grid-cols-2 bg-indigo-100 px-3 py-2">
                  <span className="text-xs font-semibold text-indigo-700">{tr.pricing.volume}</span>
                  <span className="text-xs font-semibold text-indigo-700 text-right">{tr.pricing.price}</span>
                </div>
                {tr.pricing.smsTiers.map((tier) => (
                  <div key={tier.range} className="grid grid-cols-2 bg-white px-3 py-2 border-t border-indigo-100">
                    <span className="text-xs text-gray-600">{tier.range}</span>
                    <span className="text-xs font-semibold text-gray-900 text-right">{tier.price}</span>
                  </div>
                ))}
              </div>

              <ul className="space-y-3 mb-8">
                {tr.pricing.smsFeatures.map((f) => (
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
                {tr.pricing.getStarted}
              </Link>
            </div>

            {/* Email */}
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 ring-2 ring-[#6366f1] ring-offset-2 p-8 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                  {tr.pricing.comingSoon}
                </span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fb923c] mb-5">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Email</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">1</span>
                <span className="text-gray-500 text-sm">{tr.pricing.perMsg}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tr.pricing.emailFeatures.map((f) => (
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
                {tr.pricing.getStarted}
              </Link>
            </div>

            {/* WhatsApp */}
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                  {tr.pricing.comingSoon}
                </span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 mb-5">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">WhatsApp</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">8</span>
                <span className="text-gray-500 text-sm">{tr.pricing.perMsg}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tr.pricing.whatsappFeatures.map((f) => (
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
                {tr.pricing.getStarted}
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">{tr.pricing.customPricing}</p>
        </div>
      </section>

      {/* ── API Section ── */}
      <section id="api" className="bg-slate-900 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-sm text-indigo-400 mb-6">
              <Code2 className="h-3.5 w-3.5" />
              {tr.api.badge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">{tr.api.h2}</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">{tr.api.description}</p>
            <ul className="space-y-3">
              {tr.api.features.map((item) => (
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

      {/* ── Contact ── */}
      <section id="contact" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{tr.contact.h2}</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">{tr.contact.sub}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="mailto:geral@strongbox.ao"
              className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-gray-100 px-8 py-5 min-w-[240px]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6366f1]">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{tr.contact.email}</p>
                <p className="text-base font-semibold text-gray-900">geral@strongbox.ao</p>
              </div>
            </a>
            <a
              href="tel:+244951797569"
              className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-gray-100 px-8 py-5 min-w-[240px]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{tr.contact.phone}</p>
                <p className="text-base font-semibold text-gray-900">+244 951 797 569</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">{tr.cta.h2}</h2>
          <p className="text-indigo-200 text-lg mb-10">{tr.cta.description}</p>
          <Link
            href="https://app.strongx.it.ao/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl text-base hover:bg-indigo-50 transition-colors shadow-lg"
          >
            {tr.cta.button}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image src="/logo.png" alt="StrongX" width={100} height={57} className="object-contain" />
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="https://app.strongx.it.ao/login" className="hover:text-white transition-colors">{tr.footer.signIn}</Link>
              <Link href="https://app.strongx.it.ao/register" className="hover:text-white transition-colors">{tr.footer.register}</Link>
              <a href="mailto:geral@strongbox.ao" className="hover:text-white transition-colors">{tr.footer.contact}</a>
              <a href="tel:+244951797569" className="hover:text-white transition-colors">+244 951 797 569</a>
            </div>
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} StrongX. {tr.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
