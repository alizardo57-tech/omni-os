'use client';

import { useState } from 'react';
import type { Cliente, Produto } from '@/lib/schemas';

export function OmniEstoque({ produtos, onAtualizar }: { produtos: Produto[]; onAtualizar: () => void }) {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Geral');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('50');
  const [editMap, setEditMap] = useState<Record<number, { nome: string; preco: string; estoque: string }>>({});

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, categoria, preco: Number(preco), estoque: Number(estoque) })
    });
    setNome(''); setPreco('');
    onAtualizar();
  };

  const salvarEdicao = async (p: Produto) => {
    const ed = editMap[p.id];
    if (!ed) return;
    await fetch(`/api/produtos/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: ed.nome, preco: Number(ed.preco), estoque: Number(ed.estoque) })
    });
    onAtualizar();
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-zinc-900">ERP • Controle e Edição de Estoque</h2>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700">{produtos.length} itens</span>
      </div>

      <form onSubmit={cadastrar} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
        <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do produto" className="sm:col-span-2 bg-white border border-zinc-300 rounded-lg px-3 py-2" />
        <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Categoria" className="bg-white border border-zinc-300 rounded-lg px-3 py-2" />
        <input required type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} placeholder="Preço R$" className="bg-white border border-zinc-300 rounded-lg px-3 py-2" />
        <button type="submit" className="rounded-lg bg-[#8B0029] hover:bg-[#A50034] text-white font-bold py-2">+ Cadastrar</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr><th className="py-2.5 px-3">Produto</th><th className="py-2.5 px-3">Preço R$</th><th className="py-2.5 px-3">Estoque</th><th className="py-2.5 px-3 text-right">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {produtos.map(p => {
              const ed = editMap[p.id] || { nome: p.nome, preco: p.preco.toFixed(2), estoque: String(p.estoque) };
              return (
                <tr key={p.id}>
                  <td className="py-2 px-3">
                    <input value={ed.nome} onChange={e => setEditMap({ ...editMap, [p.id]: { ...ed, nome: e.target.value } })} className="w-full border border-zinc-200 rounded-lg px-2 py-1 font-bold" />
                  </td>
                  <td className="py-2 px-3">
                    <input type="number" step="0.01" value={ed.preco} onChange={e => setEditMap({ ...editMap, [p.id]: { ...ed, preco: e.target.value } })} className="w-24 border border-zinc-200 rounded-lg px-2 py-1 font-mono" />
                  </td>
                  <td className="py-2 px-3">
                    <input type="number" value={ed.estoque} onChange={e => setEditMap({ ...editMap, [p.id]: { ...ed, estoque: e.target.value } })} className="w-20 border border-zinc-200 rounded-lg px-2 py-1 font-mono" />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button onClick={() => salvarEdicao(p)} className="px-3 py-1 rounded-lg bg-[#0B0B0B] hover:bg-[#8B0029] text-white font-bold transition">Salvar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OmniClientes({ clientes, onAtualizar }: { clientes: Cliente[]; onAtualizar: () => void }) {
  const [busca, setBusca] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  const filtrados = clientes.filter(c =>
    `${c.nome} ${c.telefone} ${c.endereco}`.toLowerCase().includes(busca.toLowerCase())
  );

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone, endereco })
    });
    setNome(''); setTelefone(''); setEndereco('');
    onAtualizar();
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-zinc-900">Cadastro de Clientes ({clientes.length})</h2>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar nome, telefone ou endereço..." className="w-full sm:w-72 border border-zinc-300 rounded-xl px-3 py-2 text-xs" />
      </div>

      <form onSubmit={cadastrar} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
        <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="bg-white border border-zinc-300 rounded-lg px-3 py-2" />
        <input required value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="WhatsApp / Telefone" className="bg-white border border-zinc-300 rounded-lg px-3 py-2" />
        <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço completo" className="bg-white border border-zinc-300 rounded-lg px-3 py-2" />
        <button type="submit" className="rounded-lg bg-[#8B0029] hover:bg-[#A50034] text-white font-bold py-2">+ Cadastrar Cliente</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600">
            <tr><th className="py-2.5 px-3">Cliente</th><th className="py-2.5 px-3">Telefone</th><th className="py-2.5 px-3">Endereço</th><th className="py-2.5 px-3">Pedidos</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtrados.map(c => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="py-2.5 px-3 font-bold text-zinc-900">{c.nome}</td>
                <td className="py-2.5 px-3 font-mono text-zinc-700">{c.telefone}</td>
                <td className="py-2.5 px-3 text-zinc-600">{c.endereco || '—'}</td>
                <td className="py-2.5 px-3 font-bold text-[#8B0029]">{c.totalPedidos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
