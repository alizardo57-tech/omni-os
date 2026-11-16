'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Smartphone } from 'lucide-react';

export function OmniLojaOnline({ nomeEmpresa = 'Bella Pizza', totalProdutos }: { nomeEmpresa?: string; totalProdutos: number }) {
  const [urlLoja, setUrlLoja] = useState('http://localhost:3005/cardapio');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlLoja(`${window.location.origin}/cardapio`);
    }
  }, []);

  const copiarLink = () => {
    navigator.clipboard?.writeText(urlLoja).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#8B0029]" /> Loja Online • {nomeEmpresa}
          </h2>
          <p className="text-xs text-zinc-500">
            Cardápio digital em ordem alfabética ({totalProdutos} itens) integrado direto ao Caixa & Cozinha
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 font-mono text-zinc-800">{urlLoja}</div>
          <button
            type="button"
            onClick={copiarLink}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold inline-flex items-center gap-1.5 transition"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiado ? 'Link Copiado!' : 'Copiar Link'}
          </button>
          <a
            href="/cardapio"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white font-bold inline-flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Aba
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-2">
        <div className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-[#8B0029]" /> Pré-visualização ao vivo da Loja Online
        </div>
        <iframe
          src="/cardapio"
          title="Loja Online Omni-OS"
          className="w-full h-[650px] rounded-xl border border-zinc-200 bg-[#F4F5F7]"
        />
      </div>
    </div>
  );
}
