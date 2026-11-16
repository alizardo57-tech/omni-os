'use client';

import { useEffect, useState } from 'react';
import { Calculator, MessageCircle, Printer, RotateCcw, Settings2, X } from 'lucide-react';
import type { Venda } from '@/lib/schemas';

export function OmniFechamentoCaixa({
  vendas,
  whatsappDonoInicial = '',
  camilaWebhookInicial = '',
  onAtualizar
}: {
  vendas: Venda[];
  whatsappDonoInicial?: string;
  camilaWebhookInicial?: string;
  onAtualizar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [lojaFiltro, setLojaFiltro] = useState<'Todas' | 'Loja 1' | 'Loja 2'>('Todas');
  const [whatsappDono, setWhatsappDono] = useState(whatsappDonoInicial);
  const [camilaWebhookUrl, setCamilaWebhookUrl] = useState(camilaWebhookInicial);
  const [configCamilaAberta, setConfigCamilaAberta] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setWhatsappDono(whatsappDonoInicial);
  }, [whatsappDonoInicial]);

  useEffect(() => {
    setCamilaWebhookUrl(camilaWebhookInicial);
  }, [camilaWebhookInicial]);

  const vendasFiltradas =
    lojaFiltro === 'Todas' ? vendas : vendas.filter(v => (v.loja || 'Loja 1') === lojaFiltro);

  const porPagamento: Record<string, number> = {};
  let totalGeral = 0;
  for (const v of vendasFiltradas) {
    const forma = v.pagamento || 'Outros';
    porPagamento[forma] = Number(((porPagamento[forma] || 0) + v.total).toFixed(2));
    totalGeral = Number((totalGeral + v.total).toFixed(2));
  }

  const executarFechamento = async (zerarTurno: boolean, enviarWhatsapp = false) => {
    setProcessando(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/vendas/fechamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imprimir: true,
          zerarTurno,
          loja: lojaFiltro,
          enviarWhatsapp,
          whatsappDono,
          camilaWebhookUrl
        })
      });
      const data = await res.json();
      if (data.ok) {
        const avisoBackup = data.backupCaminho ? ` | Backup salvo em ${data.backupPasta}` : '';
        if (enviarWhatsapp) {
          if (data.camilaEnviado) {
            setFeedback(`✅ Fechamento enviado pela Camila no WhatsApp do dono!${avisoBackup}`);
          } else if (data.whatsappUrl) {
            window.open(data.whatsappUrl, '_blank');
            setFeedback(
              data.camilaErro
                ? `Webhook da Camila (${data.camilaErro}) — WhatsApp aberto.${avisoBackup}`
                : `✅ Resumo aberto no WhatsApp do dono!${avisoBackup}`
            );
          } else {
            setFeedback(`Informe o WhatsApp do dono acima para enviar pela Camila.${avisoBackup}`);
          }
        } else if (data.backupCaminho) {
          setFeedback(`✅ Resumo impresso e backup salvo fora do sistema (${data.backupPasta}).`);
        }
      }
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

            <div className="flex gap-1.5 text-xs font-bold">
              {(['Todas', 'Loja 1', 'Loja 2'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLojaFiltro(l)}
                  className={`flex-1 py-1.5 rounded-lg border transition ${
                    lojaFiltro === l ? 'bg-[#8B0029] text-white border-[#8B0029]' : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                  }`}
                >
                  {l === 'Todas' ? 'Todas Lojas' : l}
                </button>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold text-zinc-600">
                <span>Pedidos no turno:</span>
                <span className="text-zinc-900">{vendasFiltradas.length}</span>
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

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-700">WhatsApp do Dono (envio pela Camila)</span>
                <button
                  type="button"
                  onClick={() => setConfigCamilaAberta(!configCamilaAberta)}
                  className="text-[11px] font-bold text-[#8B0029] inline-flex items-center gap-1"
                >
                  <Settings2 className="w-3 h-3" /> Webhook Camila
                </button>
              </div>
              <input
                value={whatsappDono}
                onChange={e => setWhatsappDono(e.target.value)}
                placeholder="Ex: 19999999999 (com DDD)"
                className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-xs outline-none"
              />
              {configCamilaAberta && (
                <input
                  value={camilaWebhookUrl}
                  onChange={e => setCamilaWebhookUrl(e.target.value)}
                  placeholder="URL Webhook Camila / n8n (opcional)"
                  className="w-full bg-white border border-zinc-300 rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
                />
              )}
              {feedback && <p className="text-[11px] font-bold text-emerald-700">{feedback}</p>}
            </div>

            <div className="space-y-2 pt-1">
              <button
                disabled={processando}
                onClick={() => executarFechamento(false, true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" /> Enviar Fechamento p/ Dono (Camila / WhatsApp)
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={processando}
                  onClick={() => executarFechamento(false, false)}
                  className="py-2.5 px-3 rounded-xl bg-[#0B0B0B] hover:bg-zinc-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir Resumo
                </button>
                <button
                  disabled={processando}
                  onClick={() => executarFechamento(true, true)}
                  className="py-2.5 px-3 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Encerrar & Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
