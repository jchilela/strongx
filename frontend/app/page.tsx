import type { Metadata } from 'next';
import { LandingPage } from './LandingPage';

export const metadata: Metadata = {
  title: 'StrongX — Plataforma de SMS, Email e WhatsApp para Angola',
  description:
    'Envie SMS, Email e WhatsApp em escala com o StrongX. API simples, preços por mensagem em AOA, construído para Angola.',
};

export default function HomePage() {
  return <LandingPage />;
}
