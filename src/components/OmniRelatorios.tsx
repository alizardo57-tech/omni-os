'use client';

import { BarChart3, Download, EyeOff, MapPin, ShoppingBag, TrendingUp } from 'lucide-react';
import type { ComandaFantasma, Produto, Venda } from '@/lib/schemas';

export function OmniRelatorios({
  vendas,
  produtos,
  comandasFantasmas = []
}: {
  vendas: Venda[];
  produtos: Produto[];
  comandasFantasmas?: ComandaFantasma[];
}) {
  const totalVendas = vendas.reduce((s, v) => s + Number(v.total || 0), 0);
  const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

  const porProduto: Record<string, { qtd: number; valor: number }> = {};
  const porModalidade: Record<string, number> = { balcao: 0, entrega: 0, retirada: 0 };
  const porBairro: Record<string, { qtd: number; valor: number }> = {};

  for (const v of vendas) {
    porModalidade[v.modalidade] = (porModalidade[v.modalidade] || 0) + 1;
    if (v.bairro) {
      if (!porBairro[v.bairro]) porBairro[v.bairro] = { qtd: 0, valor: 0 };
      porBairro[v.bairro].qtd += 1;
      porBairro[v.bairro].valor += v.total;
    }
    for (const it of v.itens) {
      if (!porProduto[it.nome]) porProduto[it.nome] = { qtd: 0, valor: 0 };
      porProduto[it.nome].qtd += it.qtd;
      porProduto[it.nome].valor += it.qtd * it.precoUnit;
    }
  }

  const topProdutos = Object.entries(porProduto)
    .sort((a, b) => b[1].qtd - a[1].qtd)
    .slice(0, 10);

  const topBairros = Object.entries(porBairro)
    .sort((a, b) => b[1].qtd - a[1].qtd)
    .slice(0, 10);

  const exportarCsv = () => {
    const cabecalho = 'ID;Data;Cliente;Telefone;Loja;Bairro;Modalidade;Pagamento;Total\n';
    const linhas = vendas
      .map(
        v =>
          `${v.id};${new Date(v.criadoEm).toLocaleString('pt-BR')};${v.clienteNome};${v.clienteTelefone};${v.loja || 'Loja 1'};${v.bairro || ''};${v.modalidade};${v.pagamento};${v.total.toFixed(2)}`
      )
      .join('\n');
    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-zinc-900">Relatórios & Desempenho</h2>
          <p className="text-xs text-zinc-500">Ranking de sabores, bairros de entrega, ticket médio e exportação CSV</p>
        </div>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={vendas.length === 0}
          className="px-4 py-2 rounded-xl bg-[#8B0029] hover:bg-[#A50034] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4" /> Exportar Vendas (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#8B0029]" /> Ticket Médio
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">R$ {ticketMedio.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-emerald-600" /> Pedidos por Canal
          </div>
          <div className="text-xs font-bold text-zinc-800 mt-2 space-y-0.5">
            <div>Balcão: {porModalidade.balcao} • Entrega: {porModalidade.entrega} • Retirada: {porModalidade.retirada}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
          <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-zinc-700" /> Catálogo Ativo
          </div>
          <div className="text-2xl font-black text-zinc-900 mt-1">{produtos.length} itens</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-zinc-900">Top 10 Itens / Sabores Mais Vendidos</h3>
          {topProdutos.length === 0 ? (
            <p className="text-xs text-zinc-400">Nenhuma venda lançada ainda.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {topProdutos.map(([nome, info], idx) => (
                <div key={nome} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
                  <span className="font-bold text-zinc-800">
                    {idx + 1}. {nome}
                  </span>
                  <span className="font-black text-[#8B0029]">
                    {info.qtd}x • R$ {info.valor.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#8B0029]" /> Top Bairros de Limeira Atendidos
          </h3>
          {topBairros.length === 0 ? (
            <p className="text-xs text-zinc-400">Nenhum pedido com bairro selecionado ainda.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {topBairros.map(([b, info]) => (
                <div key={b} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
                  <span className="font-bold text-zinc-800">{b}</span>
                  <span className="font-black text-zinc-900">
                    {info.qtd} pedidos • R$ {info.valor.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-rose-800 flex items-center gap-1.5">
              <EyeOff className="w-4 h-4" /> Comandas Fantasmas • Auditoria de Exclusões (Visível apenas para Admin)
            </h3>
            <p className="text-[11px] text-zinc-500">
              Todo pedido apagado/cancelado no PDV continua salvo aqui para controle do dono e vai no relatório diário pela Camila.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black">
            {comandasFantasmas.length} excluídos • R$ {comandasFantasmas.reduce((s, f) => s + Number(f.total || 0), 0).toFixed(2)}
          </span>
        </div>
        {comandasFantasmas.length === 0 ? (
          <p className="text-xs text-zinc-400">Nenhuma comanda foi excluída até o momento.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl text-xs">
            {comandasFantasmas.map((f, idx) => (
              <div key={`${f.id}_${idx}`} className="p-3 space-y-1 bg-rose-50/30">
                <div className="flex justify-between font-black text-zinc-900">
                  <span>
                    {f.id} • {f.clienteNome} ({f.loja || 'Loja 1'})
                  </span>
                  <span className="text-rose-700">R$ {f.total.toFixed(2)}</span>
                </div>
                <div className="text-zinc-600">{f.itens.map(i => `${i.qtd}x ${i.nome}`).join(', ')}</div>
                <div className="text-[11px] text-zinc-500">
                  Excluído em {new Date(f.excluidoEm).toLocaleString('pt-BR')} por <strong>{f.excluidoPor}</strong> • Status antes da exclusão:{' '}
                  <strong className="uppercase">{f.statusAntesExclusao}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
