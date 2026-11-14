'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import type { AbaOmni } from './OmniSidebar';
import type { Venda } from '@/lib/schemas';

interface Props {
  kpis: { vendasMes: number; produtosEstoque: number; receitaTotal: number; clientesAtivos: number };
  vendas: Venda[];
  onNavegar: (aba: AbaOmni) => void;
}

const BARRAS_PERIODO = [42, 52, 53, 62, 48, 46, 56, 72, 85, 76, 55, 50, 65, 70, 88];

export function OmniDashboard({ kpis, vendas, onNavegar }: Props) {
  const [agora, setAgora] = useState(() => new Date());
  const [periodo, setPeriodo] = useState<'30 Dias' | '90 Dias' | '6 Meses' | '1 Ano'>('30 Dias');

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dataStr = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const diaSemana = agora.toLocaleDateString('pt-BR', { weekday: 'long' });
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const cardsKpi = [
    {
      titulo: 'Vendas do Mês',
      valor: `R$ ${kpis.vendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      delta: '+12,5%',
      bgIcon: 'bg-[#8B0029]',
      icon: ShoppingCart,
      waveColor: '#8B0029'
    },
    {
      titulo: 'Produtos em Estoque',
      valor: kpis.produtosEstoque.toLocaleString('pt-BR'),
      delta: '+3,2%',
      bgIcon: 'bg-[#0B0B0B]',
      icon: Package,
      waveColor: '#52525B'
    },
    {
      titulo: 'Receita Total',
      valor: `R$ ${kpis.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      delta: '+8,7%',
      bgIcon: 'bg-[#8B0029]',
      icon: DollarSign,
      waveColor: '#8B0029'
    },
    {
      titulo: 'Clientes Ativos',
      valor: kpis.clientesAtivos.toLocaleString('pt-BR'),
      delta: '+5,1%',
      bgIcon: 'bg-[#0B0B0B]',
      icon: Users,
      waveColor: '#52525B'
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Bem-vindo ao <span className="text-[#8B0029] italic">Omni-OS!</span>
          </h1>
          <p className="text-sm text-zinc-500">Tudo conectado. Tudo sob controle.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs">
            <Calendar className="w-4 h-4 text-[#8B0029]" />
            <div className="text-xs">
              <div className="font-bold text-zinc-800">Hoje é, {dataStr}</div>
              <div className="text-zinc-400 capitalize">{diaSemana}</div>
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs">
            <Clock className="w-4 h-4 text-[#8B0029]" />
            <div className="text-xs">
              <div className="font-extrabold text-zinc-900 text-sm">{horaStr}</div>
              <div className="text-zinc-400">Horário do sistema</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cardsKpi.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.titulo} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs flex items-center justify-between overflow-hidden relative">
              <div className="flex items-center gap-3.5 z-10">
                <div className={`w-12 h-12 rounded-xl ${c.bgIcon} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 font-medium">{c.titulo}</div>
                  <div className="text-xl font-black text-zinc-900 tracking-tight">{c.valor}</div>
                  <div className="text-xs font-bold text-emerald-600">↑ {c.delta}</div>
                </div>
              </div>
              <svg viewBox="0 0 80 36" className="w-20 h-10 opacity-30 shrink-0">
                <path d="M0 32 Q 18 20, 34 25 T 80 6 L 80 36 L 0 36 Z" fill={c.waveColor} />
              </svg>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2 font-extrabold text-zinc-800">
              <BarChart3 className="w-5 h-5 text-[#8B0029]" />
              Vendas por Período
            </div>
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
              {(['30 Dias', '90 Dias', '6 Meses', '1 Ano'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-1 rounded-lg transition ${
                    periodo === p ? 'bg-[#8B0029] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 flex items-end gap-2 sm:gap-3 pt-4 border-b border-zinc-200 px-2">
            {BARRAS_PERIODO.map((alt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#8B0029] to-[#C81E4C] transition-all group-hover:opacity-85"
                  style={{ height: `${alt * 1.6}px` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 font-medium pt-2 px-2">
            <span>01/11</span><span>04/11</span><span>07/11</span><span>10/11</span><span>14/11</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 font-extrabold text-zinc-800 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#8B0029]" />
            Distribuição de Vendas
          </div>
          <div className="flex items-center justify-center gap-6 my-auto">
            <div className="relative w-36 h-36 rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(#8B0029 0% 52.3%, #18181B 52.3% 81%, #D4D4D8 81% 100%)' }}>
              <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                <span className="text-lg font-black text-zinc-900">100%</span>
                <span className="text-[11px] text-zinc-400">Total</span>
              </div>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 font-medium"><i className="w-2.5 h-2.5 rounded-full bg-[#8B0029]" />Balcão / PDV</span><strong className="text-zinc-900">52,3%</strong></div>
              <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 font-medium"><i className="w-2.5 h-2.5 rounded-full bg-zinc-900" />Delivery</span><strong className="text-zinc-900">28,7%</strong></div>
              <div className="flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 font-medium"><i className="w-2.5 h-2.5 rounded-full bg-zinc-300" />Retirada</span><strong className="text-zinc-900">19,0%</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="font-extrabold text-zinc-800 flex items-center gap-2 text-sm">
              <ListTodo className="w-4 h-4 text-[#8B0029]" /> Últimas Atividades
            </span>
            <button onClick={() => onNavegar('vendas')} className="text-xs font-bold text-zinc-600 hover:text-[#8B0029] flex items-center gap-1 border border-zinc-200 rounded-lg px-2.5 py-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {vendas.slice(0, 4).map(v => (
              <div key={v.id} className="flex items-start gap-3 text-xs border-l-2 border-[#8B0029]/30 pl-3">
                <span className="w-2 h-2 rounded-full bg-[#8B0029] mt-1 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-800">Pedido {v.id} • {v.clienteNome}</div>
                  <div className="text-zinc-400">R$ {v.total.toFixed(2)} • {v.pagamento} ({v.status})</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-[#0B0B0B] shadow-sm relative min-h-[190px]">
          <img src="/brand/omni-os-banner.jpg" alt="Omni-OS" className="w-full h-full object-cover" />
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
          <div className="font-extrabold text-zinc-800 text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#8B0029]" /> Atalhos Rápidos
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => onNavegar('vendas')} className="rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white p-3.5 text-xs font-bold flex flex-col items-center gap-1.5 transition">
              <ShoppingCart className="w-5 h-5" /> Nova Venda
            </button>
            <button onClick={() => onNavegar('estoque')} className="rounded-xl bg-[#18181B] hover:bg-black text-white p-3.5 text-xs font-bold flex flex-col items-center gap-1.5 transition">
              <Package className="w-5 h-5" /> Controle de Estoque
            </button>
            <button onClick={() => onNavegar('clientes')} className="rounded-xl bg-[#18181B] hover:bg-black text-white p-3.5 text-xs font-bold flex flex-col items-center gap-1.5 transition">
              <Users className="w-5 h-5" /> Clientes
            </button>
            <button onClick={() => onNavegar('configuracoes')} className="rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white p-3.5 text-xs font-bold flex flex-col items-center gap-1.5 transition">
              <Settings className="w-5 h-5" /> Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
