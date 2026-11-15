'use client';

import { useState } from 'react';
import { Calculator, Printer, RotateCcw, X } from 'lucide-react';
import type { Venda } from '@/lib/schemas';

export function OmniFechamentoCaixa({
  vendas,
  onAtualizar
}: {
  vendas: Venda[];
  onAtualizar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [processando, setProcessando] = useState(false);

  const porPagamento: Record<string, number> = {};
  let totalGeral = 0;
  for (const v of vendas) {
    const forma = v.pagamento || 'Outros';
    porPagamento[forma] = Number(((porPagamento[forma] || 0) + v.total).toFixed(2));
    totalGeral = Number((totalGeral + v.total).toFixed(2));
  }

  const executarFechamento = async (zerarTurno: boolean) => {
    setProcessando(true);
    try {
      await fetch('/api/vendas/fechamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imprimir: true, zerarTurno })
      });
      if (zerarTurno) setAberto(false);
      onAtualizar();
    } finally {
      setProcessando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#8B0029] hover:bg-[#A50034] text-white inline-flex items-center gap-1.5 transition"
      >
        <Calculator className="w-3.5 h-3.5" /> Fechar Caixa
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#8B0029]" /> Fechamento de Caixa
              </h3>
              <button onClick={() => setAberto(false)} className="p-1 rounded-lg hover:bg-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold text-zinc-600">
                <span>Pedidos no turno:</span>
                <span className="text-zinc-900">{vendas.length}</span>
              </div>
              <div className="border-t border-zinc-100 pt-2 space-y-1.5">
                {Object.keys(porPagamento).length === 0 ? (
                  <p className="text-zinc-400">Nenhuma venda lançada neste turno.</p>
                ) : (
                  Object.entries(porPagamento).map(([forma, valor]) => (
                    <div key={forma} className="flex justify-between font-bold">
                      <span className="text-zinc-700">{forma}</span>
                      <span className="text-zinc-900">R$ {valor.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-zinc-200 pt-2.5 flex justify-between text-base font-black">
                <span>TOTAL DO CAIXA</span>
                <span className="text-[#8B0029]">R$ {totalGeral.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                disabled={processando}
                onClick={() => executarFechamento(false)}
                className="py-2.5 px-3 rounded-xl bg-[#0B0B0B] hover:bg-zinc-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Resumo
              </button>
              <button
                disabled={processando}
                onClick={() => executarFechamento(true)}
                className="py-2.5 px-3 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Encerrar & Zerar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
