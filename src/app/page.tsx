'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, ChevronDown, LogOut, Maximize2, Menu, Minimize2, Search, User, UserPlus } from 'lucide-react';
import { OmniSidebar, type AbaOmni } from '@/components/OmniSidebar';
import { OmniDashboard } from '@/components/OmniDashboard';
import { OmniVendasPdv } from '@/components/OmniVendasPdv';
import { OmniClientes, OmniEstoque } from '@/components/OmniEstoqueClientes';
import { OmniFinanceiro } from '@/components/OmniFinanceiro';
import { OmniRelatorios } from '@/components/OmniRelatorios';
import { OmniLojaOnline } from '@/components/OmniLojaOnline';
import { OmniConfiguracoes } from '@/components/OmniConfiguracoes';
import { OmniSuporte } from '@/components/OmniSuporte';
import { OmniCriarUsuarioModal, OmniLoginScreen } from '@/components/OmniAuthModal';
import type { LojaId } from '@/lib/bairrosLimeira';
import type { Cliente, MovimentacaoFinanceira, Produto, UsuarioPublico, Venda } from '@/lib/schemas';

interface OverviewPayload {
  empresa: {
    nome: string;
    operador: string;
    cargo: string;
    tempoPreparoMin: number;
    whatsappDono?: string;
    camilaWebhookUrl?: string;
  };
  produtos: Produto[];
  clientes: Cliente[];
  vendas: Venda[];
  movimentacoesFinanceiras?: MovimentacaoFinanceira[];
  bairrosLoja?: Record<string, LojaId>;
  kpis: { vendasMes: number; produtosEstoque: number; receitaTotal: number; clientesAtivos: number };
}

export default function OmniOsHomePage() {
  const [aba, setAba] = useState<AbaOmni>('inicio');
  const [modalidadePdv, setModalidadePdv] = useState<'balcao' | 'entrega' | 'retirada'>('balcao');
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const [dados, setDados] = useState<OverviewPayload | null>(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);

  const verificarSessao = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const json = await res.json();
      if (json.ok) setUsuario(json.usuario || null);
    } finally {
      setVerificandoAuth(false);
    }
  }, []);

  const sair = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setMenuUsuarioAberto(false);
    setAba('inicio');
    setUsuario(null);
  };

  const alternarTelaCheia = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setTelaCheia(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setTelaCheia(false)).catch(() => {});
    }
  };

  const carregar = useCallback(async () => {
    const res = await fetch('/api/overview');
    const json = await res.json();
    if (json.ok) setDados(json);
  }, []);

  useEffect(() => {
    verificarSessao();
  }, [verificarSessao]);

  useEffect(() => {
    if (!usuario) return;
    carregar();
    const timer = setInterval(carregar, 6000);
    return () => clearInterval(timer);
  }, [carregar, usuario]);

  if (verificandoAuth) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center text-sm font-bold">
        Carregando Omni-OS...
      </div>
    );
  }

  if (!usuario) {
    return <OmniLoginScreen onAutenticado={u => setUsuario(u)} />;
  }

  const produtosFiltrados = (dados?.produtos || []).filter(p =>
    p.nome.toLowerCase().includes(buscaGlobal.toLowerCase())
  );

  return (
    <div className="h-screen overflow-hidden flex bg-[#F4F5F7]">
      <OmniSidebar abaAtiva={aba} perfil={usuario.perfil} onSelecionar={setAba} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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

          <div className="flex items-center gap-4">
            <button
              onClick={alternarTelaCheia}
              title="Tela Cheia"
              className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-700"
            >
              {telaCheia ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button className="relative p-2 rounded-xl hover:bg-zinc-100 text-zinc-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8B0029] text-white text-[10px] font-bold flex items-center justify-center">
                {dados?.vendas?.length || 3}
              </span>
            </button>

            <div className="relative pl-4 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => setMenuUsuarioAberto(!menuUsuarioAberto)}
                className="flex items-center gap-2.5 hover:bg-zinc-50 rounded-xl px-2 py-1 transition"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-xs leading-tight hidden sm:block text-left">
                  <div className="font-bold text-zinc-900">{usuario.nome}</div>
                  <div className="text-zinc-500">{usuario.cargo} • {usuario.lojaPadrao}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>
              {menuUsuarioAberto && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-40 text-xs space-y-1">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <div className="font-black text-zinc-900">{usuario.nome}</div>
                    <div className="text-zinc-500">@{usuario.login} • {usuario.perfil === 'admin' ? 'Admin' : 'Funcionário'}</div>
                  </div>
                  {usuario.perfil === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuUsuarioAberto(false);
                        setModalNovoUsuario(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-100 font-bold text-zinc-800 flex items-center gap-2"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#8B0029]" /> Criar Novo Usuário
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={sair}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-bold text-rose-700 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair / Trocar Usuário
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 max-w-[1600px] w-full mx-auto">
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
              nomeEmpresa={dados.empresa.nome}
              bairrosLoja={dados.bairrosLoja}
              whatsappDono={dados.empresa.whatsappDono}
              camilaWebhookUrl={dados.empresa.camilaWebhookUrl}
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
          ) : aba === 'financeiro' ? (
            <OmniFinanceiro
              vendas={dados.vendas}
              movimentacoes={dados.movimentacoesFinanceiras || []}
              whatsappDono={dados.empresa.whatsappDono}
              camilaWebhookUrl={dados.empresa.camilaWebhookUrl}
              onAtualizar={carregar}
            />
          ) : aba === 'relatorios' ? (
            <OmniRelatorios vendas={dados.vendas} produtos={dados.produtos} />
          ) : aba === 'lojaonline' ? (
            <OmniLojaOnline nomeEmpresa={dados.empresa.nome} totalProdutos={dados.produtos.length} />
          ) : aba === 'configuracoes' ? (
            <OmniConfiguracoes empresa={dados.empresa} onAtualizar={carregar} />
          ) : (
            <OmniSuporte />
          )}
        </main>
      </div>
      <OmniCriarUsuarioModal
        aberto={modalNovoUsuario}
        onFechar={() => setModalNovoUsuario(false)}
        onCriado={carregar}
      />
    </div>
  );
}
