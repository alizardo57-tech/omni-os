'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Trash2, Printer, CheckCircle2, Clock, MapPin, MessageCircle, Flame, Bike, Search, X } from 'lucide-react';
import type { Cliente, Produto, Venda } from '@/lib/schemas';
import type { CaixaAbertura } from '@/lib/store';
import { ordenarProdutosAlfabeticamente } from '@/lib/ordenacao';
import { detectarBairroNoEndereco, type LojaId } from '@/lib/bairrosLimeira';
import { OmniFechamentoCaixa } from './OmniFechamentoCaixa';

interface Props {
  produtos: Produto[];
  vendas: Venda[];
  clientes: Cliente[];
  tempoPreparoMin: number;
  nomeEmpresa?: string;
  bairrosLoja?: Record<string, LojaId>;
  motoboys?: string[];
  caixaAbertura?: CaixaAbertura | null;
  whatsappDono?: string;
  camilaWebhookUrl?: string;
  lojaPadrao?: LojaId;
  perfil?: 'admin' | 'funcionario';
  modalidadeInicial?: 'balcao' | 'entrega' | 'retirada';
  onAtualizar: () => void;
}

export function OmniVendasPdv({
  produtos,
  vendas,
  clientes,
  tempoPreparoMin,
  nomeEmpresa = 'Bella Pizza',
  bairrosLoja = {},
  motoboys = ['Motoboy 1', 'Motoboy 2', 'Motoboy 3'],
  caixaAbertura = null,
  whatsappDono = '',
  camilaWebhookUrl = '',
  lojaPadrao = 'Loja 1',
  perfil = 'funcionario',
  modalidadeInicial = 'balcao',
  onAtualizar
}: Props) {
  const [carrinho, setCarrinho] = useState<{ produto: Produto; qtd: number; observacao: string }[]>([]);
  const [clienteNome, setClienteNome] = useState('Consumidor Balcão');
  const [clienteTel, setClienteTel] = useState('');
  const [modalidade, setModalidade] = useState<'balcao' | 'entrega' | 'retirada'>(modalidadeInicial);
  const [pagamento, setPagamento] = useState('PIX');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [loja, setLoja] = useState<LojaId>(lojaPadrao);
  const [motoboy, setMotoboy] = useState('');
  const clienteInputRef = useRef<HTMLInputElement | null>(null);
  const qtdVendasAnteriorRef = useRef<number>(vendas.length);
  const [filtroLojaCozinha, setFiltroLojaCozinha] = useState<'Todas' | LojaId>('Todas');
  const [modalBairrosAberto, setModalBairrosAberto] = useState(false);
  const [buscaBairro, setBuscaBairro] = useState('');
  const [novoBairroNome, setNovoBairroNome] = useState('');
  const [novoBairroLoja, setNovoBairroLoja] = useState<LojaId>('Loja 1');
  const [observacaoPedido, setObservacaoPedido] = useState('');
  const [taxaEntrega, setTaxaEntrega] = useState('');
  const [desconto, setDesconto] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [itemAvulsoAberto, setItemAvulsoAberto] = useState<number | null>(null);
  const [avulsoNome, setAvulsoNome] = useState('');
  const [avulsoValor, setAvulsoValor] = useState('');
  const [obsBuilder, setObsBuilder] = useState('');
  const [obsBuilder2, setObsBuilder2] = useState('');
  const [avulsoBuilderNome, setAvulsoBuilderNome] = useState('');
  const [avulsoBuilderValor, setAvulsoBuilderValor] = useState('');
  const [clienteSalvoMsg, setClienteSalvoMsg] = useState<string | null>(null);
  const [mostrarSugestoesCliente, setMostrarSugestoesCliente] = useState(false);
  const [mostrarSugestoesBairro, setMostrarSugestoesBairro] = useState(false);
  const [previaComandaAberta, setPreviaComandaAberta] = useState(false);
  const [mostrarFantasmas, setMostrarFantasmas] = useState(false);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<Venda | null>(null);
  const [passoExclusao, setPassoExclusao] = useState<1 | 2>(1);
  const [segundosExclusao, setSegundosExclusao] = useState(5);

  useEffect(() => {
    if (!pedidoParaExcluir || passoExclusao !== 2 || segundosExclusao <= 0) return;
    const t = setTimeout(() => setSegundosExclusao(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [pedidoParaExcluir, passoExclusao, segundosExclusao]);

  useEffect(() => {
    if (vendas.length > qtdVendasAnteriorRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.36);
        }
      } catch {
        // Ignora bloqueio de autoplay do navegador
      }
    }
    qtdVendasAnteriorRef.current = vendas.length;
  }, [vendas.length]);

  const [ultimoPedidoOk, setUltimoPedidoOk] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        clienteInputRef.current?.focus();
        clienteInputRef.current?.select();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (carrinho.length > 0 && !salvando) {
          setPreviaComandaAberta(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [carrinho.length, salvando]);
  const [buscaPdv, setBuscaPdv] = useState('');
  const [catPdv, setCatPdv] = useState('Todas');

  const categoriasPdv = ['Todas', ...Array.from(new Set(produtos.map(p => p.categoria)))];
  const produtosPdv = ordenarProdutosAlfabeticamente(
    produtos.filter(
      p => (catPdv === 'Todas' || p.categoria === catPdv) && `${p.nome} ${p.categoria}`.toLowerCase().includes(buscaPdv.toLowerCase())
    )
  );

  const [tamanhoPizza, setTamanhoPizza] = useState<'Grande' | 'Broto'>('Grande');
  const saboresPizza = ordenarProdutosAlfabeticamente(
    produtos.filter(p =>
      tamanhoPizza === 'Broto'
        ? p.categoria === 'Broto'
        : p.categoria === 'Pizzas Salgadas' || p.categoria === 'Pizzas Doces'
    )
  );
  const [sabor1Id, setSabor1Id] = useState<number>(() => saboresPizza[0]?.id || produtos[0]?.id || 0);
  const [sabor2Id, setSabor2Id] = useState<number>(0);

  const alterarTamanhoPizza = (novo: 'Grande' | 'Broto') => {
    setTamanhoPizza(novo);
    const lista = ordenarProdutosAlfabeticamente(
      produtos.filter(p =>
        novo === 'Broto' ? p.categoria === 'Broto' : p.categoria === 'Pizzas Salgadas' || p.categoria === 'Pizzas Doces'
      )
    );
    setSabor1Id(lista[0]?.id || 0);
    setSabor2Id(0);
  };

  const [bordaId, setBordaId] = useState<number>(0);
  const bordas = ordenarProdutosAlfabeticamente(produtos.filter(p => p.categoria === 'Bordas Recheadas'));
  const adicionaisCadastrados = ordenarProdutosAlfabeticamente(produtos.filter(p => p.categoria === 'Adicionais'));

  const parseValor = (v: string) => Math.max(0, Number(v.replace(',', '.')) || 0);

  const aplicarBorda = (pizza: Produto): Produto => {
    const isPizza = pizza.categoria === 'Pizzas Salgadas' || pizza.categoria === 'Pizzas Doces' || pizza.categoria === 'Broto';
    if (!isPizza || bordaId === 0) return pizza;
    if (bordaId < 0) return { ...pizza, nome: `${pizza.nome} + ${bordaId === -1 ? 'SEM BORDA' : 'BORDA FALSA'}` };
    const b = bordas.find(x => x.id === bordaId);
    return b ? { ...pizza, nome: `${pizza.nome} + ${b.nome}`, preco: Number((pizza.preco + b.preco).toFixed(2)) } : pizza;
  };

  const adicionar = (produto: Produto, obsExtra = '', avNomeExtra = '', avValorExtra = 0) => {
    let itemFinal = aplicarBorda(produto);
    if (itemFinal !== produto) setBordaId(0);
    const avNome = (avNomeExtra || avulsoBuilderNome).trim();
    const avVal = avNomeExtra ? avValorExtra : parseValor(avulsoBuilderValor);
    if (avNome) {
      itemFinal = {
        ...itemFinal,
        nome: `${itemFinal.nome} + ${avNome}`,
        preco: Number((itemFinal.preco + Math.max(0, avVal)).toFixed(2))
      };
      setAvulsoBuilderNome('');
      setAvulsoBuilderValor('');
    }
    const obsFinal = (obsExtra || obsBuilder).trim();
    if (obsBuilder) setObsBuilder('');
    const isPizza = produto.categoria === 'Pizzas Salgadas' || produto.categoria === 'Pizzas Doces' || produto.categoria === 'Broto';
    setCarrinho(prev => {
      const idx = prev.findIndex(
        i => i.produto.id === itemFinal.id && i.produto.nome === itemFinal.nome && i.observacao === obsFinal
      );
      if (idx >= 0) {
        if (isPizza) setItemAvulsoAberto(idx);
        return prev.map((item, k) => (k === idx ? { ...item, qtd: item.qtd + 1 } : item));
      }
      const next = [...prev, { produto: itemFinal, qtd: 1, observacao: obsFinal }];
      if (isPizza) setItemAvulsoAberto(next.length - 1);
      return next;
    });
  };

  const atualizarObservacaoItem = (idx: number, observacao: string) => {
    setCarrinho(prev => prev.map((item, k) => (k === idx ? { ...item, observacao } : item)));
  };

  const adicionarAvulsoNaPizza = (idx: number, nomeRaw: string, valorRaw: number) => {
    const nomeLimpo = nomeRaw.trim();
    if (!nomeLimpo) return;
    const valor = Math.max(0, Number(valorRaw) || 0);
    setCarrinho(prev =>
      prev.map((item, k) =>
        k === idx
          ? {
              ...item,
              produto: {
                ...item.produto,
                nome: `${item.produto.nome} + ${nomeLimpo}`,
                preco: Number((item.produto.preco + valor).toFixed(2))
              }
            }
          : item
      )
    );
    setAvulsoNome('');
    setAvulsoValor('');
    setItemAvulsoAberto(null);
  };

  const adicionarPizzaMontada = () => {
    const p1 = produtos.find(p => p.id === Number(sabor1Id)) || saboresPizza[0];
    if (!p1) return;
    if (!sabor2Id || Number(sabor2Id) === 0 || Number(sabor2Id) === p1.id) {
      adicionar(p1);
      setObsBuilder2('');
      return;
    }
    const p2 = produtos.find(p => p.id === Number(sabor2Id)) || p1;
    const base = p1.preco >= p2.preco ? p1 : p2;
    const obs1 = obsBuilder.trim();
    const obs2 = obsBuilder2.trim();
    const parte1 = `1/2 ${p1.nome}${obs1 ? ` (Obs: ${obs1})` : ''}`;
    const parte2 = `1/2 ${p2.nome}${obs2 ? ` (Obs: ${obs2})` : ''}`;
    setObsBuilder('');
    setObsBuilder2('');
    adicionar({ ...base, nome: `${parte1} + ${parte2}`, preco: Math.max(p1.preco, p2.preco) });
  };

  const remover = (id: number, nome: string) =>
    setCarrinho(prev => prev.filter(i => !(i.produto.id === id && i.produto.nome === nome)));

  const alterarQtdItem = (idx: number, delta: number) => {
    setCarrinho(prev =>
      prev
        .map((item, k) => (k === idx ? { ...item, qtd: item.qtd + delta } : item))
        .filter(item => item.qtd > 0)
    );
  };

  const subtotal = carrinho.reduce((s, i) => s + i.produto.preco * i.qtd, 0);
  const taxaEntregaNum = parseValor(taxaEntrega);
  const descontoNum = parseValor(desconto);
  const total = Math.max(0, subtotal + taxaEntregaNum - descontoNum);
  const valorPagoNum = parseValor(valorPago);
  const troco = valorPagoNum > total ? valorPagoNum - total : 0;

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
          bairro,
          loja,
          motoboy: modalidade === 'entrega' ? motoboy : '',
          observacao: observacaoPedido.trim(),
          taxaEntrega: taxaEntregaNum,
          desconto: descontoNum,
          valorPago: valorPagoNum,
          itens: carrinho.map(i => ({
            produtoId: i.produto.id,
            nome: i.produto.nome,
            qtd: i.qtd,
            precoUnit: i.produto.preco,
            observacao: i.observacao.trim()
          }))
        })
      });
      const data = await res.json();
      if (data.ok) {
        setPreviaComandaAberta(false);
        setUltimoPedidoOk(data.venda.id);
        setCarrinho([]);
        setClienteNome('Consumidor Balcão');
        setClienteTel('');
        setEndereco('');
        setBairro('');
        setLoja(lojaPadrao);
        setObservacaoPedido('');
        setTaxaEntrega('');
        setDesconto('');
        setValorPago('');
        setMotoboy('');
        setModalidade('balcao');
        setPagamento('PIX');
        setTimeout(() => setUltimoPedidoOk(null), 4000);
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

  const atribuirMotoboy = async (id: string, novoMotoboy: string) => {
    await fetch('/api/vendas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, motoboy: novoMotoboy })
    });
    onAtualizar();
  };

  const abrirWhatsappCliente = (v: Venda) => {
    const digits = (v.clienteTelefone || '').replace(/\D/g, '');
    if (!digits) return;
    const tel = digits.startsWith('55') ? digits : `55${digits}`;
    const statusTexto =
      v.status === 'forno'
        ? 'está no forno 🍕'
        : v.status === 'pronto'
          ? 'está pronto!'
          : v.status === 'saiu_entrega'
            ? `saiu para entrega${v.motoboy ? ` com ${v.motoboy}` : ''} 🛵`
            : v.status === 'entregue'
              ? 'foi entregue!'
              : 'foi recebido e está em preparo!';
    const msg = `Olá ${v.clienteNome}! Seu pedido #${v.id} da ${nomeEmpresa} ${statusTexto} Total: R$ ${v.total.toFixed(2)}.`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
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

  const limparCozinha = async (id?: string) => {
    await fetch(id ? `/api/vendas?id=${encodeURIComponent(id)}` : '/api/vendas', { method: 'DELETE' });
    onAtualizar();
  };

  const confirmarExclusaoDefinitiva = async () => {
    if (!pedidoParaExcluir) return;
    await fetch(`/api/vendas?id=${encodeURIComponent(pedidoParaExcluir.id)}&excluir=true`, { method: 'DELETE' });
    setPedidoParaExcluir(null);
    setPassoExclusao(1);
    onAtualizar();
  };

  const qtdFantasmas = vendas.filter(v => v.ocultoCozinha).length;

  const aoAlterarEndereco = (valor: string) => {
    setEndereco(valor);
    const detectado = detectarBairroNoEndereco(valor, bairrosLoja);
    if (detectado) {
      setBairro(detectado);
      setLoja(bairrosLoja[detectado]);
    }
  };

  const aoSelecionarBairro = (b: string) => {
    setBairro(b);
    if (b && bairrosLoja[b]) {
      setLoja(bairrosLoja[b]);
    }
  };

  const alternarBairroLoja = async (nomeBairro: string, novaLoja: LojaId) => {
    const atualizado = { ...bairrosLoja, [nomeBairro]: novaLoja };
    await fetch('/api/overview', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bairrosLoja: atualizado })
    });
    if (bairro === nomeBairro) setLoja(novaLoja);
    onAtualizar();
  };

  const adicionarNovoBairro = async () => {
    const nome = novoBairroNome.trim();
    if (!nome) return;
    await alternarBairroLoja(nome, novoBairroLoja);
    setNovoBairroNome('');
  };

  const bairrosOrdenados = Object.keys(bairrosLoja).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const selecionarCliente = (c: Cliente) => {
    setClienteNome(c.nome);
    setClienteTel(c.telefone);
    setMostrarSugestoesCliente(false);
    if (c.endereco) {
      aoAlterarEndereco(c.endereco);
      setModalidade('entrega');
    }
  };

  const clientesSugeridos =
    mostrarSugestoesCliente && clienteNome.trim().length >= 2 && clienteNome !== 'Consumidor Balcão'
      ? clientes
          .filter(c => c.nome.toLowerCase().includes(clienteNome.trim().toLowerCase()))
          .slice(0, 6)
      : [];

  const aoDigitarTel = (valor: string) => {
    setClienteTel(valor);
    const limpo = valor.replace(/\D/g, '');
    if (limpo.length >= 8) {
      const achado = clientes.find(c => c.telefone.endsWith(limpo) || c.telefone.includes(limpo));
      if (achado) {
        setClienteNome(achado.nome);
        if (achado.endereco) {
          aoAlterarEndereco(achado.endereco);
          setModalidade('entrega');
        }
      }
    }
  };

  const salvarClienteNovo = async () => {
    const telLimpo = clienteTel.replace(/\D/g, '');
    if (!clienteNome.trim() || telLimpo.length < 8) {
      setClienteSalvoMsg('Informe nome e telefone (mín. 8 dígitos)');
      setTimeout(() => setClienteSalvoMsg(null), 3000);
      return;
    }
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: clienteNome.trim(),
        telefone: telLimpo,
        endereco: endereco.trim()
      })
    });
    const data = await res.json();
    if (data.ok) {
      setClienteSalvoMsg('Cliente e endereço salvos!');
      setTimeout(() => setClienteSalvoMsg(null), 3000);
      onAtualizar();
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 no-print">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-base font-extrabold text-zinc-900">PDV • Catálogo Rápido</h2>
            <div className="flex flex-wrap items-center gap-2">
              <OmniFechamentoCaixa
                vendas={vendas}
                whatsappDonoInicial={whatsappDono}
                camilaWebhookInicial={camilaWebhookUrl}
                caixaAbertura={caixaAbertura}
                onAtualizar={onAtualizar}
              />
              <button
                type="button"
                onClick={() => setModalBairrosAberto(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 inline-flex items-center gap-1 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-[#8B0029]" /> Bairros Limeira (2 Lojas)
              </button>
              <a href="/cardapio" target="_blank" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0B0B0B] hover:bg-[#8B0029] text-white transition">
                📱 Cardápio Tablet / Celular
              </a>
            </div>
          </div>

          {saboresPizza.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50/70 border border-[#8B0029]/25 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-black text-[#8B0029]">🍕 Montar Pizza (Inteira ou 1/2 a 1/2), Borda, Obs. e Adicional Avulso</div>
                <div className="flex rounded-lg overflow-hidden border border-[#8B0029]/30 bg-white font-bold text-[11px]">
                  {(['Grande', 'Broto'] as const).map(tam => (
                    <button
                      key={tam}
                      type="button"
                      onClick={() => alterarTamanhoPizza(tam)}
                      className={`px-2.5 py-1 transition ${tamanhoPizza === tam ? 'bg-[#8B0029] text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}
                    >
                      {tam}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                <select value={sabor1Id} onChange={e => setSabor1Id(Number(e.target.value))} className="sm:col-span-2 bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-semibold">
                  {saboresPizza.map(p => (
                    <option key={p.id} value={p.id}>
                      {sabor2Id > 0 ? `1/2 ${p.nome}` : p.nome} (R$ {p.preco.toFixed(2)})
                    </option>
                  ))}
                </select>
                <select value={sabor2Id} onChange={e => setSabor2Id(Number(e.target.value))} className="sm:col-span-2 bg-white border border-zinc-300 rounded-lg px-2.5 py-2 font-semibold">
                  <option value={0}>Pizza Inteira (apenas 1 sabor)</option>
                  {saboresPizza.map(p => <option key={p.id} value={p.id}>1/2 {p.nome} (R$ {p.preco.toFixed(2)})</option>)}
                </select>
                <select value={bordaId} onChange={e => setBordaId(Number(e.target.value))} className="sm:col-span-1 bg-white border border-zinc-300 rounded-lg px-2 py-2 font-semibold">
                  <option value={0}>Borda Grátis</option>
                  <option value={-1}>Sem Borda</option>
                  <option value={-2}>Borda Falsa</option>
                  {bordas.map(b => <option key={b.id} value={b.id}>{b.nome.replace(/^Borda\s+(de\s+)?/i, '')} (+R$ {b.preco.toFixed(2)})</option>)}
                </select>
                <button type="button" onClick={adicionarPizzaMontada} className="bg-[#8B0029] hover:bg-[#A50034] text-white font-bold rounded-lg py-2 px-3 transition">
                  + Add Pizza
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                <input
                  value={obsBuilder}
                  onChange={e => setObsBuilder(e.target.value)}
                  placeholder={sabor2Id > 0 ? 'Obs. 1/2 Sabor 1 (ex: sem cebola)...' : 'Obs. da pizza (ex: sem cebola, bem assada)...'}
                  className={`${sabor2Id > 0 ? 'sm:col-span-2' : 'sm:col-span-3'} bg-white border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2.5 py-1.5 outline-none`}
                />
                {sabor2Id > 0 && (
                  <input
                    value={obsBuilder2}
                    onChange={e => setObsBuilder2(e.target.value)}
                    placeholder="Obs. 1/2 Sabor 2 (ex: com cebola)..."
                    className="sm:col-span-2 bg-white border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2.5 py-1.5 outline-none"
                  />
                )}
                <input
                  value={avulsoBuilderNome}
                  onChange={e => setAvulsoBuilderNome(e.target.value)}
                  placeholder="Adicional avulso (ex: Bacon)"
                  className={`${sabor2Id > 0 ? 'sm:col-span-1' : 'sm:col-span-2'} bg-white border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2.5 py-1.5 outline-none`}
                />
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={avulsoBuilderValor}
                  onChange={e => setAvulsoBuilderValor(e.target.value)}
                  placeholder="+ R$ avulso"
                  className="sm:col-span-1 bg-white border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2.5 py-1.5 font-bold outline-none"
                />
              </div>
              {adicionaisCadastrados.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[11px] font-bold text-zinc-600 mr-1">Adicionais:</span>
                  {adicionaisCadastrados.map(ad => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={() => {
                        setAvulsoBuilderNome(ad.nome);
                        setAvulsoBuilderValor(String(ad.preco));
                      }}
                      className="px-2 py-0.5 rounded bg-white border border-zinc-300 hover:border-[#8B0029] text-[10px] font-bold transition"
                    >
                      + {ad.nome} (R$ {ad.preco.toFixed(2)})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mb-3 space-y-2">
            <input
              value={buscaPdv}
              onChange={e => setBuscaPdv(e.target.value)}
              placeholder={`Buscar nos ${produtos.length} itens (ex: Calabresa, Broto, Coca, Doce)...`}
              className="w-full bg-zinc-50 border border-zinc-300 focus:border-[#8B0029] rounded-xl px-3 py-2 text-xs outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {categoriasPdv.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatPdv(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    catPdv === c ? 'bg-[#8B0029] text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {produtosPdv.map(p => (
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
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-extrabold text-zinc-900">Resumo da Venda</h2>
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                F2 Cliente • F9 Finalizar
              </span>
            </div>
            <div className="space-y-2 text-xs mb-3">
              <div className="relative">
                <div className="flex gap-1.5">
                  <input
                    ref={clienteInputRef}
                    value={clienteNome}
                    onChange={e => {
                      setClienteNome(e.target.value);
                      setMostrarSugestoesCliente(true);
                    }}
                    onFocus={() => setMostrarSugestoesCliente(true)}
                    placeholder="Nome do cliente (digite p/ buscar)"
                    className="flex-1 border border-zinc-300 rounded-lg px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setClienteNome('');
                      setClienteTel('');
                      setEndereco('');
                      setMostrarSugestoesCliente(false);
                    }}
                    title="Limpar para cadastrar novo cliente"
                    className="px-2.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-700"
                  >
                    Novo
                  </button>
                </div>
                {clientesSugeridos.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-300 rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto divide-y divide-zinc-100">
                    {clientesSugeridos.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selecionarCliente(c)}
                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-xs flex flex-col"
                      >
                        <span className="font-bold text-zinc-900">{c.nome} • {c.telefone}</span>
                        {c.endereco && <span className="text-[11px] text-zinc-500 truncate">{c.endereco}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={clienteTel} onChange={e => aoDigitarTel(e.target.value)} placeholder="WhatsApp (auto-busca)" className="border border-zinc-300 rounded-lg px-3 py-2" />
                <select value={pagamento} onChange={e => setPagamento(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-2">
                  <option>PIX</option><option>Dinheiro</option><option>Cartão Crédito</option><option>Cartão Débito</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={modalidade} onChange={e => setModalidade(e.target.value as 'balcao' | 'entrega' | 'retirada')} className="border border-zinc-300 rounded-lg px-3 py-2">
                  <option value="balcao">Balcão</option><option value="entrega">Delivery / Entrega</option><option value="retirada">Retirada</option>
                </select>
                {modalidade === 'entrega' ? (
                  <select value={motoboy} onChange={e => setMotoboy(e.target.value)} className="border border-zinc-300 rounded-lg px-2 py-2 font-semibold">
                    <option value="">Motoboy (opcional)</option>
                    {motoboys.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <div className="border border-zinc-200 bg-zinc-50 rounded-lg px-3 py-2 text-zinc-400 flex items-center">
                    Sem entrega
                  </div>
                )}
              </div>
              <input value={endereco} onChange={e => aoAlterarEndereco(e.target.value)} placeholder="Endereço completo (novo ou cadastrado)" className="w-full border border-zinc-300 rounded-lg px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={bairro}
                    onChange={e => {
                      aoSelecionarBairro(e.target.value);
                      setMostrarSugestoesBairro(true);
                    }}
                    onFocus={() => setMostrarSugestoesBairro(true)}
                    onBlur={() => setTimeout(() => setMostrarSugestoesBairro(false), 180)}
                    placeholder="🔍 Buscar ou digitar bairro..."
                    className="w-full border border-zinc-300 rounded-lg pl-8 pr-2 py-2 outline-none focus:border-[#8B0029]"
                  />
                  {mostrarSugestoesBairro && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-300 rounded-xl shadow-lg z-30 max-h-44 overflow-y-auto divide-y divide-zinc-100">
                      {bairrosOrdenados
                        .filter(b =>
                          b
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .includes(
                              bairro
                                .trim()
                                .toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                            )
                        )
                        .slice(0, 30)
                        .map(b => (
                          <button
                            key={b}
                            type="button"
                            onMouseDown={e => {
                              e.preventDefault();
                              aoSelecionarBairro(b);
                              setMostrarSugestoesBairro(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-rose-50 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="font-semibold text-zinc-900 truncate">{b}</span>
                            <span className="text-[10px] font-bold text-[#8B0029] shrink-0">{bairrosLoja[b]}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <select value={loja} onChange={e => setLoja(e.target.value as LojaId)} className="border border-zinc-300 rounded-lg px-2 py-2 font-bold text-[#8B0029]">
                  <option value="Loja 1">Direcionar: Loja 1</option>
                  <option value="Loja 2">Direcionar: Loja 2</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={salvarClienteNovo}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-[#8B0029] text-white font-bold text-[11px] transition"
                >
                  + Salvar Cliente / Endereço
                </button>
                {clienteSalvoMsg && <span className="text-[11px] font-bold text-emerald-700">{clienteSalvoMsg}</span>}
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border-t border-zinc-100 pt-2">
              {carrinho.length === 0 && <p className="text-xs text-zinc-400">Nenhum item selecionado.</p>}
              {carrinho.map((i, idx) => (
                <div key={`${i.produto.id}_${i.produto.nome}_${idx}`} className="space-y-1 bg-zinc-50 rounded-lg p-2 border border-zinc-100">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-zinc-800">{i.qtd}x {i.produto.nome}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => alterarQtdItem(idx, -1)}
                        className="w-5 h-5 rounded bg-white border border-zinc-300 hover:bg-zinc-200 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-black w-4 text-center">{i.qtd}</span>
                      <button
                        type="button"
                        onClick={() => alterarQtdItem(idx, 1)}
                        className="w-5 h-5 rounded bg-white border border-zinc-300 hover:bg-zinc-200 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="font-bold ml-1">R$ {(i.qtd * i.produto.preco).toFixed(2)}</span>
                      <button onClick={() => remover(i.produto.id, i.produto.nome)} className="text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <input
                      value={i.observacao}
                      onChange={e => atualizarObservacaoItem(idx, e.target.value)}
                      placeholder="Obs. da pizza (ex: sem cebola, bem assada)..."
                      className="flex-1 bg-white border border-zinc-200 focus:border-[#8B0029] rounded px-2 py-1 text-[11px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setItemAvulsoAberto(itemAvulsoAberto === idx ? null : idx)}
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-[#8B0029] text-[#8B0029] hover:text-white border border-[#8B0029]/25 text-[10px] font-bold whitespace-nowrap transition"
                    >
                      + Avulso
                    </button>
                  </div>
                  {itemAvulsoAberto === idx && (
                    <div className="bg-white border border-[#8B0029]/30 rounded p-2 space-y-1.5">
                      {adicionaisCadastrados.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {adicionaisCadastrados.map(ad => (
                            <button
                              key={ad.id}
                              type="button"
                              onClick={() => adicionarAvulsoNaPizza(idx, ad.nome, ad.preco)}
                              className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-[#8B0029] hover:text-white text-[10px] font-bold transition"
                            >
                              + {ad.nome} (R$ {ad.preco.toFixed(2)})
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5 items-center">
                        <input
                          value={avulsoNome}
                          onChange={e => setAvulsoNome(e.target.value)}
                          placeholder="Adicional avulso (ex: Bacon, Catupiry)"
                          className="flex-1 border border-zinc-300 focus:border-[#8B0029] rounded px-2 py-1 text-[11px] outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={avulsoValor}
                          onChange={e => setAvulsoValor(e.target.value)}
                          placeholder="R$"
                          className="w-16 border border-zinc-300 focus:border-[#8B0029] rounded px-2 py-1 text-[11px] font-bold outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => adicionarAvulsoNaPizza(idx, avulsoNome, parseValor(avulsoValor))}
                          className="px-2.5 py-1 rounded bg-[#8B0029] hover:bg-[#A50034] text-white text-[11px] font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-200 pt-3 space-y-2.5">
            <input
              value={observacaoPedido}
              onChange={e => setObservacaoPedido(e.target.value)}
              placeholder="Obs. geral do pedido (opcional)..."
              className="w-full border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2.5 py-1.5 text-xs outline-none"
            />
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <label className="block">
                <span className="font-bold text-zinc-600 block mb-0.5">Taxa Entrega (R$)</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={taxaEntrega}
                  onChange={e => setTaxaEntrega(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                />
              </label>
              <label className="block">
                <span className="font-bold text-zinc-600 block mb-0.5">Desconto (R$)</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={desconto}
                  onChange={e => setDesconto(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                />
              </label>
              <label className="block">
                <span className="font-bold text-zinc-600 block mb-0.5">Valor Pago (R$)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={valorPago}
                  onChange={e => setValorPago(e.target.value)}
                  placeholder="Troco p/"
                  className="w-full border border-zinc-300 focus:border-[#8B0029] rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
                />
              </label>
            </div>
            {(taxaEntregaNum > 0 || descontoNum > 0) && (
              <div className="text-xs text-zinc-500 space-y-0.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {taxaEntregaNum > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa de Entrega</span>
                    <span>+ R$ {taxaEntregaNum.toFixed(2)}</span>
                  </div>
                )}
                {descontoNum > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Desconto</span>
                    <span>- R$ {descontoNum.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between text-base font-black text-zinc-900">
              <span>TOTAL A PAGAR</span>
              <span className="text-[#8B0029]">R$ {total.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between items-center text-sm font-black px-3 py-2 rounded-xl border ${valorPagoNum > 0 && valorPagoNum < total ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
              <span>{valorPagoNum > 0 && valorPagoNum < total ? 'FALTA RECEBER' : 'TROCO (antes de fechar)'}</span>
              <span>R$ {(valorPagoNum > 0 && valorPagoNum < total ? total - valorPagoNum : troco).toFixed(2)}</span>
            </div>
            <button
              disabled={salvando || carrinho.length === 0}
              onClick={() => setPreviaComandaAberta(true)}
              className="w-full py-2.5 rounded-xl bg-[#8B0029] hover:bg-[#A50034] disabled:opacity-50 text-white font-bold text-sm transition"
            >
              Conferir Comanda & Finalizar
            </button>
          </div>
        </div>
      </div>

      {ultimoPedidoOk && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-bold">
          <span>✅ Pedido <strong>#{ultimoPedidoOk}</strong> lançado e enviado automaticamente para impressão (2 vias em negrito)!</span>
          <button onClick={() => setUltimoPedidoOk(null)} className="underline ml-3">Fechar</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs no-print">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8B0029]" /> Fila de Pedidos & Cozinha
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 font-bold">
              {(['Todas', 'Loja 1', 'Loja 2'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setFiltroLojaCozinha(l)}
                  className={`px-2.5 py-1.5 transition ${filtroLojaCozinha === l ? 'bg-[#8B0029] text-white' : 'text-zinc-700 hover:bg-zinc-200'}`}
                >
                  {l === 'Todas' ? 'Todas Lojas' : l}
                </button>
              ))}
            </div>
            {perfil === 'admin' && (
              <button
                type="button"
                onClick={() => setMostrarFantasmas(!mostrarFantasmas)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${mostrarFantasmas ? 'bg-[#8B0029] text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'}`}
              >
                {mostrarFantasmas ? 'Ocultar Arquivados' : `Arquivados (${qtdFantasmas})`}
              </button>
            )}
            <button onClick={() => limparCozinha()} className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-[#8B0029] text-white font-bold transition">
              Limpar Prontos / Entregues
            </button>
            <div className="flex items-center gap-1.5 bg-zinc-100 px-3 py-1.5 rounded-xl font-bold">
              <span>Tempo Meta: {tempoPreparoMin} min</span>
              <button onClick={() => ajustarTempo(-5)} className="px-2 py-0.5 rounded bg-white border border-zinc-300 hover:bg-zinc-200">-5</button>
              <button onClick={() => ajustarTempo(5)} className="px-2 py-0.5 rounded bg-white border border-zinc-300 hover:bg-zinc-200">+5</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {vendas
            .filter(v => (mostrarFantasmas ? v.ocultoCozinha : !v.ocultoCozinha) && (filtroLojaCozinha === 'Todas' || (v.loja || 'Loja 1') === filtroLojaCozinha))
            .map(v => {
              const minDecorridos = Math.max(0, Math.floor((Date.now() - new Date(v.criadoEm).getTime()) / 60000));
              const atrasado = (v.status === 'preparando' || v.status === 'forno') && minDecorridos > tempoPreparoMin;
              return (
                <div key={v.id} className={`p-3.5 rounded-xl border space-y-2 text-xs ${v.ocultoCozinha ? 'border-dashed border-zinc-400 bg-zinc-100/80 opacity-85' : atrasado ? 'border-rose-500 bg-rose-50' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="flex justify-between font-black text-zinc-900 gap-2">
                    <span>{v.id} • {v.clienteNome}</span>
                    <span className="text-[#8B0029] shrink-0">R$ {v.total.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 text-white">{v.loja || 'Loja 1'}</span>
                    {v.bairro && <span className="px-2 py-0.5 rounded bg-white border border-zinc-300 text-zinc-700">{v.bairro}</span>}
                    {v.motoboy && <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">🛵 {v.motoboy}</span>}
                    {v.ocultoCozinha && perfil === 'admin' && <span className="px-2 py-0.5 rounded bg-zinc-700 text-white">Arquivado (no caixa)</span>}
                  </div>
                  <div className="text-zinc-500">
                    {v.itens.map(i => `${i.qtd}x ${i.nome}${i.observacao ? ` (Obs: ${i.observacao})` : ''}`).join(', ')}
                  </div>
                  {v.observacao && <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded">Obs: {v.observacao}</div>}
                  {((v.taxaEntrega ?? 0) > 0 || (v.desconto ?? 0) > 0 || (v.troco ?? 0) > 0) && (
                    <div className="text-[11px] text-zinc-600 flex flex-wrap gap-2">
                      {(v.taxaEntrega ?? 0) > 0 && <span>Taxa: R$ {v.taxaEntrega!.toFixed(2)}</span>}
                      {(v.desconto ?? 0) > 0 && <span>Desc: -R$ {v.desconto!.toFixed(2)}</span>}
                      {(v.troco ?? 0) > 0 && <span className="font-bold text-emerald-700">Troco: R$ {v.troco!.toFixed(2)}</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] font-bold gap-2">
                    <span className={atrasado ? 'text-rose-600' : 'text-zinc-500'}>
                      ⏱ {minDecorridos} min {atrasado ? '• ATRASADO' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      {v.clienteTelefone && (
                        <button
                          type="button"
                          onClick={() => abrirWhatsappCliente(v)}
                          title="Enviar status no WhatsApp do cliente"
                          className="text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </button>
                      )}
                      <button onClick={() => reimprimirBematech(v.id)} className="text-zinc-700 hover:text-[#8B0029] inline-flex items-center gap-1">
                        <Printer className="w-3 h-3" /> 2 Vias
                      </button>
                    </div>
                  </div>
                  {v.modalidade === 'entrega' && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Bike className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <select
                        value={v.motoboy || ''}
                        onChange={e => atribuirMotoboy(v.id, e.target.value)}
                        className="flex-1 bg-white border border-zinc-300 rounded-lg px-2 py-1 text-[11px] font-semibold"
                      >
                        <option value="">Selecionar motoboy...</option>
                        {motoboys.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button onClick={() => mudarStatus(v.id, 'forno')} className={`flex-1 py-1 px-1.5 rounded-lg font-bold ${v.status === 'forno' ? 'bg-amber-500 text-white' : 'bg-white border border-zinc-300'}`}>
                      <Flame className="w-3 h-3 inline mr-0.5" />Forno
                    </button>
                    <button onClick={() => mudarStatus(v.id, 'pronto')} className={`flex-1 py-1 px-1.5 rounded-lg font-bold ${v.status === 'pronto' ? 'bg-emerald-600 text-white' : 'bg-white border border-zinc-300'}`}>
                      <CheckCircle2 className="w-3 h-3 inline mr-0.5" />Pronto
                    </button>
                    {v.modalidade === 'entrega' && (
                      <button onClick={() => mudarStatus(v.id, 'saiu_entrega')} className={`flex-1 py-1 px-1.5 rounded-lg font-bold ${v.status === 'saiu_entrega' ? 'bg-blue-600 text-white' : 'bg-white border border-zinc-300'}`}>
                        <Bike className="w-3 h-3 inline mr-0.5" />Saiu
                      </button>
                    )}
                    <button onClick={() => mudarStatus(v.id, 'entregue')} className={`flex-1 py-1 px-1.5 rounded-lg font-bold ${v.status === 'entregue' ? 'bg-[#0B0B0B] text-white' : 'bg-white border border-zinc-300'}`}>
                      Entregue
                    </button>
                    {!v.ocultoCozinha && (v.status === 'entregue' || v.status === 'pronto') && (
                      <button onClick={() => limparCozinha(v.id)} title="Limpar pedido pronto da fila" className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white font-bold inline-flex items-center gap-1">
                        Limpar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setPedidoParaExcluir(v);
                        setPassoExclusao(1);
                        setSegundosExclusao(5);
                      }}
                      title="Apagar / Cancelar pedido"
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold inline-flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {pedidoParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-black text-rose-700">
                {passoExclusao === 1 ? '⚠️ Confirmação 1 de 2 • Apagar Pedido' : '🚨 Confirmação 2 de 2 • Ação Definitiva'}
              </h3>
              <button onClick={() => setPedidoParaExcluir(null)} className="p-1 rounded-lg hover:bg-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-2 text-zinc-700">
              <p className="font-bold text-zinc-900">
                Pedido: <span className="text-[#8B0029]">{pedidoParaExcluir.id}</span> • {pedidoParaExcluir.clienteNome} •{' '}
                <strong>R$ {pedidoParaExcluir.total.toFixed(2)}</strong>
              </p>
              <p className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 font-semibold">
                Status atual: <strong className="uppercase">{pedidoParaExcluir.status}</strong> ({pedidoParaExcluir.pagamento}).
                {pedidoParaExcluir.status !== 'preparando' && ' Atenção: este pedido já consta como pronto/entregue!'}
              </p>
              {passoExclusao === 1 ? (
                <p>
                  Tem certeza que deseja <strong>apagar/cancelar</strong> este pedido do sistema?
                </p>
              ) : (
                <p className="text-rose-700 font-bold">
                  CONFIRMAÇÃO FINAL: Ao confirmar, o pedido será removido do caixa e da cozinha.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPedidoParaExcluir(null)}
                className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold"
              >
                Cancelar (Manter Pedido)
              </button>
              {passoExclusao === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setPassoExclusao(2);
                    setSegundosExclusao(5);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black"
                >
                  Sim, Continuar (1/2)
                </button>
              ) : (
                <button
                  type="button"
                  disabled={segundosExclusao > 0}
                  onClick={confirmarExclusaoDefinitiva}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black"
                >
                  {segundosExclusao > 0 ? `Aguarde ${segundosExclusao}s...` : 'Apagar Definitivamente (2/2)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {previaComandaAberta && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#8B0029]" /> Conferência da Comanda (Antes de Imprimir)
              </h3>
              <button onClick={() => setPreviaComandaAberta(false)} className="p-1 rounded-lg hover:bg-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 font-mono text-xs text-zinc-900 space-y-1.5 max-h-[60vh] overflow-y-auto">
              <div className="text-center font-black border-b border-dashed border-zinc-400 pb-2">
                <div>{nomeEmpresa.toUpperCase()}</div>
                <div className="text-[11px]">COMANDA DE PEDIDO (PRÉVIA)</div>
              </div>
              <div><strong>CLIENTE:</strong> {clienteNome || 'Consumidor Balcão'}</div>
              <div><strong>FONE:</strong> {clienteTel || 'Não informado'}</div>
              <div><strong>TIPO:</strong> {modalidade.toUpperCase()} • <strong>PAGTO:</strong> {pagamento}</div>
              <div><strong>LOJA:</strong> {loja}{bairro ? ` • BAIRRO: ${bairro}` : ''}</div>
              {endereco && <div><strong>END:</strong> {endereco}</div>}
              <div className="border-t border-dashed border-zinc-400 pt-2 space-y-1.5">
                <div className="font-black">ITENS:</div>
                {carrinho.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{it.qtd}x {it.produto.nome}</span>
                      <span className="shrink-0 ml-2">R$ {(it.qtd * it.produto.preco).toFixed(2)}</span>
                    </div>
                    {it.observacao.trim() && (
                      <div className="text-[11px] font-bold text-[#8B0029] pl-2">OBS: {it.observacao.trim()}</div>
                    )}
                  </div>
                ))}
              </div>
              {observacaoPedido.trim() && (
                <div className="border-t border-dashed border-zinc-400 pt-1.5 font-bold text-[#8B0029]">
                  OBS PEDIDO: {observacaoPedido.trim()}
                </div>
              )}
              <div className="border-t border-dashed border-zinc-400 pt-2 space-y-0.5">
                {(taxaEntregaNum > 0 || descontoNum > 0) && (
                  <div className="flex justify-between"><span>SUBTOTAL:</span><span>R$ {subtotal.toFixed(2)}</span></div>
                )}
                {taxaEntregaNum > 0 && (
                  <div className="flex justify-between"><span>TAXA ENT:</span><span>R$ {taxaEntregaNum.toFixed(2)}</span></div>
                )}
                {descontoNum > 0 && (
                  <div className="flex justify-between"><span>DESCONTO:</span><span>-R$ {descontoNum.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>TOTAL:</span><span>R$ {total.toFixed(2)}</span>
                </div>
                {valorPagoNum > 0 && (
                  <>
                    <div className="flex justify-between"><span>VALOR PAGO:</span><span>R$ {valorPagoNum.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm font-black text-emerald-700">
                      <span>TROCO:</span><span>R$ {troco.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreviaComandaAberta(false)}
                className="py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition"
              >
                Voltar e Corrigir
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={finalizarVenda}
                className="py-2.5 px-3 rounded-xl bg-[#8B0029] hover:bg-[#A50034] disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" /> {salvando ? 'Imprimindo...' : 'Confirmar & Imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalBairrosAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8B0029]" /> Direcionamento por Bairros de Limeira
              </h3>
              <button onClick={() => setModalBairrosAberto(false)} className="p-1 rounded-lg hover:bg-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              <input
                value={novoBairroNome}
                onChange={e => setNovoBairroNome(e.target.value)}
                placeholder="Adicionar novo bairro..."
                className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 outline-none"
              />
              <select
                value={novoBairroLoja}
                onChange={e => setNovoBairroLoja(e.target.value as LojaId)}
                className="border border-zinc-300 rounded-lg px-2 py-2 font-bold"
              >
                <option value="Loja 1">Loja 1</option>
                <option value="Loja 2">Loja 2</option>
              </select>
              <button
                type="button"
                onClick={adicionarNovoBairro}
                className="px-3 py-2 rounded-lg bg-[#8B0029] text-white font-bold"
              >
                + Add
              </button>
            </div>
            <input
              value={buscaBairro}
              onChange={e => setBuscaBairro(e.target.value)}
              placeholder="Filtrar bairro de Limeira..."
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-2 text-xs outline-none"
            />
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl">
              {bairrosOrdenados
                .filter(b => b.toLowerCase().includes(buscaBairro.toLowerCase()))
                .map(b => (
                  <div key={b} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-semibold text-zinc-800">{b}</span>
                    <div className="flex gap-1">
                      {(['Loja 1', 'Loja 2'] as const).map(l => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => alternarBairroLoja(b, l)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition ${
                            bairrosLoja[b] === l ? 'bg-[#8B0029] text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
