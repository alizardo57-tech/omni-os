'use client';

import { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Plus, Trash2, Wallet } from 'lucide-react';
import type { MovimentacaoFinanceira, Venda } from '@/lib/schemas';
import { OmniFechamentoCaixa } from './OmniFechamentoCaixa';

export function OmniFinanceiro({
  vendas,
  movimentacoes,
  whatsappDono,
  camilaWebhookUrl,
  onAtualizar
}: {
  vendas: Venda[];
  movimentacoes: MovimentacaoFinanceira[];
  whatsappDono?: string;
  camilaWebhookUrl?: string;
  onAtualizar: () => void;
}) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Motoboy / Entrega');
  const [valor, setValor] = useState('');
  const [loja, setLoja] = useState<'Loja 1' | 'Loja 2'>('Loja 1');
  const [pagamento, setPagamento] = useState('Dinheiro');
  const [salvando, setSalvando] = useState(false);

  const receitaVendas = vendas.reduce((s, v) => s + Number(v.total || 0), 0);
  const entradasAvulsas = movimentacoes.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
  const saidasCaixa = movimentacoes.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
  const saldoLiquido = receitaVendas + entradasAvulsas - saidasCaixa;

  const porPagamento: Record<string, number> = {};
  const porLoja: Record<string, number> = { 'Loja 1': 0, 'Loja 2': 0 };
  for (const v of vendas) {
    const f = v.pagamento || 'Outros';
    porPagamento[f] = Number(((porPagamento[f] || 0) + v.total).toFixed(2));
    const l = v.loja || 'Loja 1';
    porLoja[l] = Number(((porLoja[l] || 0) + v.total).toFixed(2));
  }

  const registrarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor.replace(',', '.'));
    if (!descricao.trim() || !valorNum || valorNum <= 0) return;
    setSalvando(true);
    try {
      const res = await fetch('/api/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          descricao: descricao.trim(),
          categoria,
          valor: valorNum,
          loja,
          pagamento
        })
      });
      if ((await res.json()).ok) {
        setDescricao('');
        setValor('');
        onAtualizar();
      }
    } finally {
      setSalvando(false);
    }
  };

  const removerMovimentacao = async (id: string) => {
    await fetch(`/api/financeiro?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    onAtualizar();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-zinc-900">Financeiro & Fluxo de Caixa</h2>
          <p className="text-xs text-zinc-500">Controle de entradas, despesas/sangrias, formas de pagamento e fechamento</p>
        </div>
        <OmniFechamentoCaixa
          vendas={vendas}
          whatsappDonoInicial={whatsappDono}
          camilaWebhookInicial={camilaWebhookUrl}
          onAtualizar={onAtualizar}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#8B0029]" /> Vendas do Turno
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">R$ {receitaVendas.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">{vendas.length} pedidos lançados</div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
            <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> Entradas Avulsas
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">R$ {entradasAvulsas.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Reforço de caixa / troco</div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
            <ArrowDownCircle className="w-4 h-4 text-rose-600" /> Despesas / Sangrias
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">R$ {saidasCaixa.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Motoboy, gás, insumos, etc.</div>
        </div>
        <div className="bg-[#0B0B0B] text-white rounded-2xl border border-zinc-800 p-4 shadow-xs">
          <div className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-rose-400" /> Saldo Líquido
          </div>
          <div className="text-2xl font-black text-white mt-1">R$ {saldoLiquido.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Vendas + Entradas - Saídas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={registrarMovimentacao} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-black text-zinc-900">Lançar Despesa / Sangria / Reforço</h3>
          <div className="grid grid-cols-2 gap-1.5 font-bold">
            <button
              type="button"
              onClick={() => setTipo('saida')}
              className={`py-2 rounded-xl border transition ${tipo === 'saida' ? 'bg-rose-600 text-white border-rose-600' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
            >
              Saída / Despesa
            </button>
            <button
              type="button"
              onClick={() => setTipo('entrada')}
              className={`py-2 rounded-xl border transition ${tipo === 'entrada' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-zinc-50 text-zinc-700 border-zinc-200'}`}
            >
              Entrada / Reforço
            </button>
          </div>
          <input
            required
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descrição (ex: Diária Motoboy, Gás, Troco)"
            className="w-full border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]"
          />
          <div className="grid grid-cols-2 gap-2">
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border border-zinc-300 rounded-xl px-2.5 py-2">
              <option>Motoboy / Entrega</option>
              <option>Insumos / Mercado</option>
              <option>Gás / Energia</option>
              <option>Embalagens</option>
              <option>Sangria / Retirada</option>
              <option>Reforço de Troco</option>
              <option>Outros</option>
            </select>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="Valor R$"
              className="border border-zinc-300 rounded-xl px-3 py-2 font-bold outline-none focus:border-[#8B0029]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={loja} onChange={e => setLoja(e.target.value as 'Loja 1' | 'Loja 2')} className="border border-zinc-300 rounded-xl px-2.5 py-2">
              <option value="Loja 1">Loja 1</option>
              <option value="Loja 2">Loja 2</option>
            </select>
            <select value={pagamento} onChange={e => setPagamento(e.target.value)} className="border border-zinc-300 rounded-xl px-2.5 py-2">
              <option>Dinheiro</option>
              <option>PIX</option>
              <option>Cartão</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2.5 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white font-bold inline-flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> {salvando ? 'Salvando...' : 'Registrar Movimentação'}
          </button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 text-xs space-y-1.5">
              <div className="font-black text-zinc-900">Por Forma de Pagamento</div>
              {Object.keys(porPagamento).length === 0 ? (
                <p className="text-zinc-400">Nenhuma venda registrada.</p>
              ) : (
                Object.entries(porPagamento).map(([f, val]) => (
                  <div key={f} className="flex justify-between font-bold">
                    <span className="text-zinc-600">{f}</span>
                    <span className="text-zinc-900">R$ {val.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 text-xs space-y-1.5">
              <div className="font-black text-zinc-900">Faturamento por Unidade</div>
              {Object.entries(porLoja).map(([l, val]) => (
                <div key={l} className="flex justify-between font-bold">
                  <span className="text-zinc-600">{l}</span>
                  <span className="text-[#8B0029]">R$ {val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-zinc-900">Histórico de Movimentações Avulsas</h4>
            <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl">
              {movimentacoes.length === 0 ? (
                <p className="p-4 text-xs text-zinc-400 text-center">Nenhuma despesa ou entrada avulsa lançada.</p>
              ) : (
                movimentacoes.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div>
                      <div className="font-bold text-zinc-900">
                        {m.tipo === 'entrada' ? '🟢' : '🔴'} {m.descricao}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {m.categoria} • {m.loja} • {m.pagamento} • {new Date(m.criadoEm).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${m.tipo === 'entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.tipo === 'entrada' ? '+' : '-'} R$ {m.valor.toFixed(2)}
                      </span>
                      <button onClick={() => removerMovimentacao(m.id)} className="text-zinc-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
