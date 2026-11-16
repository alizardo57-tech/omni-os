'use client';

import {
  Home,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  BarChart3,
  Globe,
  Settings,
  Headphones,
  Rocket,
  ChevronRight,
  X
} from 'lucide-react';

export type AbaOmni =
  | 'inicio'
  | 'vendas'
  | 'estoque'
  | 'financeiro'
  | 'clientes'
  | 'relatorios'
  | 'lojaonline'
  | 'configuracoes'
  | 'suporte';

const ITENS_MENU: { id: AbaOmni; label: string; icon: React.ComponentType<{ className?: string }>; seta?: boolean }[] = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart, seta: true },
  { id: 'estoque', label: 'Estoque', icon: Package, seta: true },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, seta: true },
  { id: 'clientes', label: 'Clientes', icon: Users, seta: true },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, seta: true },
  { id: 'lojaonline', label: 'Loja Online', icon: Globe, seta: true },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
  { id: 'suporte', label: 'Suporte', icon: Headphones }
];

export function OmniSidebar({
  abaAtiva,
  perfil = 'admin',
  abertaMobile = false,
  onFecharMobile,
  onSelecionar
}: {
  abaAtiva: AbaOmni;
  perfil?: 'admin' | 'funcionario';
  abertaMobile?: boolean;
  onFecharMobile?: () => void;
  onSelecionar: (aba: AbaOmni) => void;
}) {
  const itensVisiveis =
    perfil === 'admin'
      ? ITENS_MENU
      : ITENS_MENU.filter(i => i.id !== 'financeiro' && i.id !== 'relatorios' && i.id !== 'configuracoes');

  const conteudo = (mobile = false) => (
    <aside
      className={`no-print w-64 shrink-0 bg-[#0B0B0B] text-white flex flex-col justify-between ${
        mobile ? 'h-full' : 'min-h-screen'
      } relative overflow-hidden border-r border-zinc-800`}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[#8B0029]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 -left-10 w-48 h-48 rounded-full bg-[#8B0029]/25 blur-3xl" />

      <div>
        <div className="px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between gap-2">
          <img
            src="/brand/omni-os-logo.png"
            alt="Omni-OS"
            className="w-full max-h-14 sm:max-h-16 object-contain mx-auto"
          />
          {mobile && onFecharMobile && (
            <button
              type="button"
              onClick={onFecharMobile}
              aria-label="Fechar menu"
              className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="px-3 py-4 space-y-1">
          {itensVisiveis.map(item => {
            const Icon = item.icon;
            const ativo = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelecionar(item.id);
                  if (mobile && onFecharMobile) onFecharMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  ativo
                    ? 'bg-gradient-to-r from-[#8B0029] to-[#5E001B] text-white font-semibold shadow-md'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.seta && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 space-y-3 relative z-10">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 text-center">
          <div className="w-8 h-8 rounded-full bg-[#8B0029]/30 border border-[#8B0029] flex items-center justify-center mx-auto mb-2">
            <Rocket className="w-4 h-4 text-rose-300" />
          </div>
          <p className="text-xs text-zinc-200 leading-snug">
            Sua empresa sempre um passo <span className="text-rose-400 font-bold">à frente!</span>
          </p>
        </div>
        <div className="text-center text-[11px] text-zinc-500 font-medium">Omni-OS v1.0.0</div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:flex shrink-0">{conteudo(false)}</div>
      {abertaMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden no-print">
          <div className="fixed inset-0 bg-black/60" onClick={onFecharMobile} />
          <div className="relative z-10 h-full">{conteudo(true)}</div>
        </div>
      )}
    </>
  );
}

export function OmniBottomNav({
  abaAtiva,
  onSelecionar,
  onAbrirMenu
}: {
  abaAtiva: AbaOmni;
  onSelecionar: (aba: AbaOmni) => void;
  onAbrirMenu: () => void;
}) {
  const botoes: { id: AbaOmni; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: Users }
  ];
  return (
    <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B0B] text-white border-t border-zinc-800 grid grid-cols-5 h-16">
      {botoes.map(b => {
        const Icon = b.icon;
        const ativo = abaAtiva === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelecionar(b.id)}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${
              ativo ? 'text-rose-400 bg-white/5' : 'text-zinc-400'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{b.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAbrirMenu}
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-zinc-400"
      >
        <Settings className="w-4 h-4" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
