'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Minus, Plus, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import type { Produto } from '@/lib/schemas';

export default function CardapioDigitalPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoria, setCategoria] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [mesaOuNome, setMesaOuNome] = useState('Mesa 01');
  const [pagamento, setPagamento] = useState('Pagar no Caixa');
  const [carrinho, setCarrinho] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [pedidoOk, setPedidoOk] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/produtos')
      .then(r => r.json())
      .then(d => {
        if (d.ok) setProdutos(d.produtos || []);
      });
  }, []);

  const categorias = ['Todas', ...Array.from(new Set(produtos.map(p => p.categoria)))];
  const filtrados = produtos.filter(
    p => (categoria === 'Todas' || p.categoria === categoria) && p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const alterarQtd = (id: number, delta: number) => {
    setCarrinho(prev => {
      const atual = prev[id] || 0;
      const prox = Math.max(0, atual + delta);
      if (prox === 0) {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      }
      return { ...prev, [id]: prox };
    });
  };

  const itensSelecionados = Object.entries(carrinho)
    .map(([id, qtd]) => {
      const produto = produtos.find(p => p.id === Number(id));
      return produto ? { produto, qtd } : null;
    })
    .filter((x): x is { produto: Produto; qtd: number } => Boolean(x));

  const total = itensSelecionados.reduce((s, i) => s + i.produto.preco * i.qtd, 0);

  const enviarParaCaixa = async () => {
    if (itensSelecionados.length === 0) return;
    setEnviando(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: mesaOuNome.trim() || 'Mesa / Balcão',
          clienteTelefone: '',
          modalidade: 'balcao',
          pagamento,
          endereco: '',
          itens: itensSelecionados.map(i => ({
            produtoId: i.produto.id,
            nome: i.produto.nome,
            qtd: i.qtd,
            precoUnit: i.produto.preco
          }))
        })
      });
      const data = await res.json();
      if (data.ok) {
        setPedidoOk(data.venda.id);
        setCarrinho({});
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-28">
      <header className="bg-[#0B0B0B] text-white px-4 py-4 sticky top-0 z-20 border-b border-[#8B0029]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/brand/omni-os-icon.png" alt="Omni-OS" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="text-base font-black tracking-tight flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-rose-400" /> Cardápio Digital • Mesa & Tablet
              </h1>
              <p className="text-[11px] text-zinc-400">Pedido enviado direto para o Caixa & Cozinha</p>
            </div>
          </div>
          <input
            value={mesaOuNome}
            onChange={e => setMesaOuNome(e.target.value)}
            placeholder="Mesa / Nome"
            className="w-32 sm:w-44 bg-zinc-900 border border-zinc-700 focus:border-[#8B0029] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {pedidoOk && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              Pedido <span className="font-black">{pedidoOk}</span> enviado direto para o Caixa!
            </div>
            <button onClick={() => setPedidoOk(null)} className="text-xs font-bold underline">Fechar</button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar sabor, bebida ou item..."
            className="flex-1 min-w-[200px] bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#8B0029]"
          />
          <div className="flex gap-1.5 overflow-x-auto py-1">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  categoria === cat ? 'bg-[#8B0029] text-white' : 'bg-white border border-zinc-200 text-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtrados.map(p => {
            const qtd = carrinho[p.id] || 0;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-zinc-200 p-3.5 shadow-xs flex gap-3.5 items-stretch">
                {p.imagem ? (
                  <img
                    src={p.imagem}
                    alt={p.nome}
                    className="w-24 h-24 rounded-xl object-cover shrink-0 bg-zinc-100 border border-zinc-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs shrink-0">
                    Sem foto
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B0029]">{p.categoria}</span>
                    <h3 className="font-extrabold text-zinc-900 text-sm leading-snug">{p.nome}</h3>
                    {p.descricao && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{p.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2.5">
                    <p className="text-base font-black text-zinc-900">R$ {p.preco.toFixed(2)}</p>
                    <div className="flex items-center gap-1.5">
                      {qtd > 0 && (
                        <>
                          <button onClick={() => alterarQtd(p.id, -1)} className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-5 text-center font-black text-sm">{qtd}</span>
                        </>
                      )}
                      <button onClick={() => alterarQtd(p.id, 1)} className="w-8 h-8 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white flex items-center justify-center font-bold">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {itensSelecionados.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0B0B0B] text-white border-t border-zinc-800 px-4 py-3 z-30">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B0029] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-400">{itensSelecionados.reduce((s, i) => s + i.qtd, 0)} itens • {mesaOuNome}</div>
                <div className="text-lg font-black">R$ {total.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select value={pagamento} onChange={e => setPagamento(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white">
                <option>Pagar no Caixa</option><option>PIX</option><option>Cartão</option><option>Dinheiro</option>
              </select>
              <button
                disabled={enviando}
                onClick={enviarParaCaixa}
                className="px-5 py-2.5 rounded-xl bg-[#8B0029] hover:bg-[#A50034] font-black text-sm transition"
              >
                {enviando ? 'Enviando...' : 'Enviar Pedido ao Caixa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
