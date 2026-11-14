'use client';

import { useState } from 'react';
import { Plus, Trash2, Printer, CheckCircle2, Clock } from 'lucide-react';
import type { Cliente, Produto, Venda } from '@/lib/schemas';

interface Props {
  produtos: Produto[];
  vendas: Venda[];
  clientes: Cliente[];
  tempoPreparoMin: number;
  onAtualizar: () => void;
}

export function OmniVendasPdv({ produtos, vendas, clientes, tempoPreparoMin, onAtualizar }: Props) {
  const [carrinho, setCarrinho] = useState<{ produto: Produto; qtd: number }[]>([]);
  const [clienteNome, setClienteNome] = useState('Consumidor Balcão');
  const [clienteTel, setClienteTel] = useState('');
  const [modalidade, setModalidade] = useState<'balcao' | 'entrega' | 'retirada'>('balcao');
  const [pagamento, setPagamento] = useState('PIX');
  const [endereco, setEndereco] = useState('');
  const [cupomAtual, setCupomAtual] = useState<Venda | null>(null);
  const [salvando, setSalvando] = useState(false);

  const adicionar = (produto: Produto) => {
    setCarrinho(prev => {
      const idx = prev.findIndex(i => i.produto.id === produto.id);
      if (idx >= 0) {
        return prev.map((item, k) => (k === idx ? { ...item, qtd: item.qtd + 1 } : item));
      }
      return [...prev, { produto, qtd: 1 }];
    });
  };

  const remover = (id: number) => setCarrinho(prev => prev.filter(i => i.produto.id !== id));
  const total = carrinho.reduce((s, i) => s + i.produto.preco * i.qtd, 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return;
    setSalvando(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome,
          clienteTelefone: clienteTel,
          modalidade,
          pagamento,
          endereco,
          itens: carrinho.map(i => ({
            produtoId: i.produto.id,
            nome: i.produto.nome,
            qtd: i.qtd,
            precoUnit: i.produto.preco
          }))
        })
      });
      const data = await res.json();
      if (data.ok) {
        setCupomAtual(data.venda);
        setCarrinho([]);
        onAtualizar();
      }
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (id: string, status: Venda['status']) => {
    await fetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    onAtualizar();
  };

  const reimprimirBematech = async (id: string) => {
    await fetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reimprimir: true })
    });
  };

  const ajustarTempo = async (delta: number) => {
    const novo = Math.max(5, Math.min(180, tempoPreparoMin + delta));
    await fetch('/api/overview', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempoPreparoMin: novo })
    });
    onAtualizar();
  };

  const aoDigitarTel = (valor: string) => {
    setClienteTel(valor);
    const limpo = valor.replace(/\D/g, '');
    if (limpo.length >= 8) {
      const achado = clientes.find(c => c.telefone.includes(limpo));
      if (achado) {
        setClienteNome(achado.nome);
        if (achado.endereco) {
          setEndereco(achado.endereco);
          setModalidade('entrega');
        }
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 no-print">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-extrabold text-zinc-900">PDV • Catálogo Rápido</h2>
            <a href="/cardapio" target="_blank" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0B0B0B] hover:bg-[#8B0029] text-white transition">
              📱 Abrir Cardápio Tablet / Celular
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {produtos.map(p => (
              <button
                key={p.id}
                onClick={() => adicionar(p)}
                className="text-left p-3.5 rounded-xl border border-zinc-200 hover:border-[#8B0029] hover:bg-rose-50/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-zinc-900">{p.nome}</div>
                  <div className="text-xs text-zinc-500">{p.categoria} • Estoque: {p.estoque}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-[#8B0029]">R$ {p.preco.toFixed(2)}</div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                    <Plus className="w-3 h-3" /> Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 mb-3">Resumo da Venda</h2>
            <div className="space-y-2 text-xs mb-3">
              <input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Nome do cliente" className="w-full border border-zinc-300 rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input value={clienteTel} onChange={e => aoDigitarTel(e.target.value)} placeholder="WhatsApp (auto-busca)" className="border border-zinc-300 rounded-lg px-3 py-2" />
                <select value={pagamento} onChange={e => setPagamento(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-2">
                  <option>PIX</option><option>Dinheiro</option><option>Cartão Crédito</option><option>Cartão Débito</option>
                </select>
              </div>
              <select value={modalidade} onChange={e => setModalidade(e.target.value as 'balcao' | 'entrega' | 'retirada')} className="w-full border border-zinc-300 rounded-lg px-3 py-2">
                <option value="balcao">Balcão</option><option value="entrega">Delivery / Entrega</option><option value="retirada">Retirada</option>
              </select>
              {modalidade === 'entrega' && (
                <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço completo" className="w-full border border-zinc-300 rounded-lg px-3 py-2" />
              )}
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto border-t border-zinc-100 pt-2">
              {carrinho.length === 0 && <p className="text-xs text-zinc-400">Nenhum item selecionado.</p>}
              {carrinho.map(i => (
                <div key={i.produto.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800">{i.qtd}x {i.produto.nome}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">R$ {(i.qtd * i.produto.preco).toFixed(2)}</span>
                    <button onClick={() => remover(i.produto.id)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 space-y-2">
            <div className="flex justify-between text-base font-black text-zinc-900">
              <span>TOTAL</span>
              <span className="text-[#8B0029]">R$ {total.toFixed(2)}</span>
            </div>
            <button
              disabled={salvando || carrinho.length === 0}
              onClick={finalizarVenda}
              className="w-full py-2.5 rounded-xl bg-[#8B0029] hover:bg-[#A50034] disabled:opacity-50 text-white font-bold text-sm transition"
            >
              {salvando ? 'Lançando...' : 'Finalizar & Gerar Comanda'}
            </button>
          </div>
        </div>
      </div>

      {cupomAtual && (
        <div className="bg-white rounded-2xl border-2 border-zinc-900 p-5 max-w-sm font-mono font-black text-black space-y-2">
          <div className="flex justify-between items-center border-b-2 border-black pb-2">
            <span>OMNI-OS COMANDA #{cupomAtual.id}</span>
            <button onClick={() => window.print()} className="no-print text-xs px-2.5 py-1 rounded bg-[#0B0B0B] text-white inline-flex items-center gap-1">
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>
          <div className="text-xs">Cliente: {cupomAtual.clienteNome}</div>
          <div className="text-xs">Modalidade: {cupomAtual.modalidade.toUpperCase()} | {cupomAtual.pagamento}</div>
          {cupomAtual.endereco && <div className="text-xs">End: {cupomAtual.endereco}</div>}
          <div className="border-y-2 border-dashed border-black py-2 space-y-1 text-xs">
            {cupomAtual.itens.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{it.qtd}x {it.nome}</span>
                <span>R$ {(it.qtd * it.precoUnit).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span>TOTAL GERAL:</span>
            <span>R$ {cupomAtual.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs no-print">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8B0029]" /> Fila de Pedidos & Cozinha
          </h3>
          <div className="flex items-center gap-1.5 text-xs bg-zinc-100 px-3 py-1.5 rounded-xl font-bold">
            <span>Tempo Meta: {tempoPreparoMin} min</span>
            <button onClick={() => ajustarTempo(-5)} className="px-2 py-0.5 rounded bg-white border border-zinc-300 hover:bg-zinc-200">-5</button>
            <button onClick={() => ajustarTempo(5)} className="px-2 py-0.5 rounded bg-white border border-zinc-300 hover:bg-zinc-200">+5</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {vendas.map(v => {
            const minDecorridos = Math.max(0, Math.floor((Date.now() - new Date(v.criadoEm).getTime()) / 60000));
            const atrasado = v.status === 'preparando' && minDecorridos > tempoPreparoMin;
            return (
              <div key={v.id} className={`p-3.5 rounded-xl border space-y-2 text-xs ${atrasado ? 'border-rose-500 bg-rose-50' : 'border-zinc-200 bg-zinc-50'}`}>
                <div className="flex justify-between font-black text-zinc-900">
                  <span>{v.id} • {v.clienteNome}</span>
                  <span className="text-[#8B0029]">R$ {v.total.toFixed(2)}</span>
                </div>
                <div className="text-zinc-500">{v.itens.map(i => `${i.qtd}x ${i.nome}`).join(', ')}</div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className={atrasado ? 'text-rose-600' : 'text-zinc-500'}>
                    ⏱ {minDecorridos} min {atrasado ? '• ATRASADO' : ''}
                  </span>
                  <button onClick={() => reimprimirBematech(v.id)} className="text-zinc-700 hover:text-[#8B0029] inline-flex items-center gap-1">
                    <Printer className="w-3 h-3" /> 2 Vias
                  </button>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <button onClick={() => mudarStatus(v.id, 'pronto')} className={`flex-1 py-1 rounded-lg font-bold ${v.status === 'pronto' ? 'bg-emerald-600 text-white' : 'bg-white border border-zinc-300'}`}>
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />Pronto
                  </button>
                  <button onClick={() => mudarStatus(v.id, 'entregue')} className={`flex-1 py-1 rounded-lg font-bold ${v.status === 'entregue' ? 'bg-[#0B0B0B] text-white' : 'bg-white border border-zinc-300'}`}>
                    Entregue
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
