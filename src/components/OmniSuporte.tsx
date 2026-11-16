'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Headphones, Printer, Smartphone, Store } from 'lucide-react';

export function OmniSuporte() {
  const [statusApi, setStatusApi] = useState<'verificando' | 'online' | 'offline'>('verificando');

  useEffect(() => {
    fetch('/api/health')
      .then(r => (r.ok ? setStatusApi('online') : setStatusApi('offline')))
      .catch(() => setStatusApi('offline'));
  }, []);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
          <Headphones className="w-5 h-5 text-[#8B0029]" /> Suporte & Guia Rápido Local
        </h2>
        <p className="text-xs text-zinc-500">Diagnóstico do sistema local e instruções rápidas de operação</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex items-center justify-between">
        <div className="text-xs">
          <div className="font-black text-zinc-900">Status do Servidor Local (Omni-OS)</div>
          <div className="text-zinc-500">Banco local salvo em <code>data/omni-os.json</code> • Porta 3005</div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 ${
            statusApi === 'online' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> {statusApi === 'online' ? 'Sistema Online' : 'Verificando...'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-1.5">
          <div className="font-black text-zinc-900 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-[#8B0029]" /> Impressão Térmica
          </div>
          <p className="text-zinc-600 leading-relaxed">
            Detecta automaticamente impressoras Bematech, MP, POS, Thermal ou EPSON instaladas no Windows em 80mm (32 colunas).
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-1.5">
          <div className="font-black text-zinc-900 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-[#8B0029]" /> 2 Lojas (Limeira)
          </div>
          <p className="text-zinc-600 leading-relaxed">
            Configure os bairros no botão <strong>Bairros Limeira (2 Lojas)</strong> no PDV para direcionar pedidos automaticamente entre Loja 1 e Loja 2.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-1.5">
          <div className="font-black text-zinc-900 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#8B0029]" /> Cardápio Tablet
          </div>
          <p className="text-zinc-600 leading-relaxed">
            Acesse <code>/cardapio</code> em qualquer tablet ou celular conectado na mesma rede Wi-Fi da loja.
          </p>
        </div>
      </div>
    </div>
  );
}
