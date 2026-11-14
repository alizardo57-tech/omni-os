import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Omni-OS • Tudo conectado. Tudo sob controle.',
  description: 'Plataforma de gestão Omni-OS: Vendas, PDV, Estoque, Financeiro e Clientes.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
