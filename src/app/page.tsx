'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, ChevronDown, Menu, Search, User } from 'lucide-react';
import { OmniSidebar, type AbaOmni } from '@/components/OmniSidebar';
import { OmniDashboard } from '@/components/OmniDashboard';
import { OmniVendasPdv } from '@/components/OmniVendasPdv';
import { OmniClientes, OmniEstoque } from '@/components/OmniEstoqueClientes';
import type { Cliente, Produto, Venda } from '@/lib/schemas';

interface OverviewPayload {
  empresa: { nome: string; operador: string; cargo: string; tempoPreparoMin: number };
  produtos: Produto[];
  clientes: Cliente[];
  vendas: Venda[];
  kpis: { vendasMes: number; produtosEstoque: number; receitaTotal: number; clientesAtivos: number };
}

export default function OmniOsHomePage() {
  const [aba, setAba] = useState<AbaOmni>('inicio');
  const [modalidadePdv, setModalidadePdv] = useState<'balcao' | 'entrega' | 'retirada'>('balcao');
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [dados, setDados] = useState<OverviewPayload | null>(null);

  const carregar = useCallback(async () => {
    const res = await fetch('/api/overview');
    const json = await res.json();
    if (json.ok) setDados(json);
  }, []);

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 6000);
    return () => clearInterval(timer);
  }, [carregar]);

  const produtosFiltrados = (dados?.produtos || []).filter(p =>
    p.nome.toLowerCase().includes(buscaGlobal.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#F4F5F7]">
      <OmniSidebar abaAtiva={aba} onSelecionar={setAba} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button onClick={() => setAba('inicio')} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={buscaGlobal}
                onChange={e => setBuscaGlobal(e.target.value)}
                placeholder="Pesquisar no sistema..."
                className="w-full bg-zinc-100 border border-transparent focus:border-[#8B0029] focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-800 outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative p-2 rounded-xl hover:bg-zinc-100 text-zinc-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8B0029] text-white text-[10px] font-bold flex items-center justify-center">
                {dados?.vendas?.length || 3}
              </span>
            </button>

            <div className="flex items-center gap-2.5 pl-4 border-l border-zinc-200">
              <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="text-xs leading-tight hidden sm:block">
                <div className="font-bold text-zinc-900">{dados?.empresa.operador || 'Alexandre Lizardo'}</div>
                <div className="text-zinc-500">{dados?.empresa.cargo || 'Administrador'}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {!dados ? (
            <div className="text-sm text-zinc-500 font-medium">Carregando Omni-OS...</div>
          ) : aba === 'inicio' ? (
            <OmniDashboard kpis={dados.kpis} vendas={dados.vendas} onNavegar={setAba} />
          ) : aba === 'vendas' ? (
            <OmniVendasPdv
              produtos={produtosFiltrados}
              vendas={dados.vendas}
              clientes={dados.clientes}
              tempoPreparoMin={dados.empresa.tempoPreparoMin || 35}
              modalidadeInicial={modalidadePdv}
              onAtualizar={carregar}
            />
          ) : aba === 'estoque' ? (
            <OmniEstoque
              produtos={produtosFiltrados}
              onAtualizar={carregar}
              onPedidoEntrega={() => {
                setModalidadePdv('entrega');
                setAba('vendas');
              }}
              onCadastrarCliente={() => setAba('clientes')}
            />
          ) : aba === 'clientes' ? (
            <OmniClientes clientes={dados.clientes} onAtualizar={carregar} />
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-2">
              <h2 className="text-lg font-extrabold text-zinc-900 capitalize">{aba} • Omni-OS</h2>
              <p className="text-sm text-zinc-500">
                Módulo conectado ao núcleo <strong>Omni-OS v1.0.0</strong>. Tudo conectado. Tudo sob controle.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
