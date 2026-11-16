'use client';

import { useState } from 'react';
import { Lock, LogIn, UserPlus, X } from 'lucide-react';
import type { UsuarioPublico } from '@/lib/schemas';

export function OmniLoginScreen({ onAutenticado }: { onAutenticado: (u: UsuarioPublico) => void }) {
  const [modo, setModo] = useState<'login' | 'registrar'>('login');
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<'admin' | 'funcionario'>('funcionario');
  const [lojaPadrao, setLojaPadrao] = useState<'Loja 1' | 'Loja 2'>('Loja 1');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const cargo = perfil === 'admin' ? 'Dono / Administrador' : 'Caixa & Atendimento';
      const payload =
        modo === 'login'
          ? { acao: 'login', login, senha }
          : { acao: 'registrar', nome, login, senha, cargo, perfil, lojaPadrao, entrarAutomatico: true };
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) {
        setErro(data.erro || 'Não foi possível autenticar.');
        return;
      }
      onAutenticado(data.usuario);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#8B0029] text-white flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-zinc-900">Omni-OS • Acesso ao Sistema</h1>
          <p className="text-xs text-zinc-500">Entre como Dono (Admin) ou Funcionário (Caixa)</p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setModo('login');
              setErro('');
            }}
            className={`py-2 rounded-lg transition inline-flex items-center justify-center gap-1.5 ${
              modo === 'login' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setModo('registrar');
              setErro('');
            }}
            className={`py-2 rounded-lg transition inline-flex items-center justify-center gap-1.5 ${
              modo === 'registrar' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Criar Usuário
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-3 text-xs">
          {modo === 'registrar' && (
            <>
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Nome Completo</label>
                <input
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: João Caixa"
                  className="w-full border border-zinc-300 focus:border-[#8B0029] rounded-xl px-3 py-2.5 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Perfil de Acesso</label>
                  <select
                    value={perfil}
                    onChange={e => setPerfil(e.target.value as 'admin' | 'funcionario')}
                    className="w-full border border-zinc-300 rounded-xl px-2.5 py-2.5"
                  >
                    <option value="funcionario">Funcionário (Caixa)</option>
                    <option value="admin">Dono (Admin Total)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Loja Padrão</label>
                  <select
                    value={lojaPadrao}
                    onChange={e => setLojaPadrao(e.target.value as 'Loja 1' | 'Loja 2')}
                    className="w-full border border-zinc-300 rounded-xl px-2.5 py-2.5"
                  >
                    <option value="Loja 1">Loja 1</option>
                    <option value="Loja 2">Loja 2</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Usuário (login)</label>
            <input
              required
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="admin ou caixa"
              className="w-full border border-zinc-300 focus:border-[#8B0029] rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Senha</label>
            <input
              required
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••"
              className="w-full border border-zinc-300 focus:border-[#8B0029] rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          {erro && <p className="text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 rounded-xl bg-[#8B0029] hover:bg-[#A50034] disabled:opacity-50 text-white font-black text-sm transition"
          >
            {enviando ? 'Entrando...' : modo === 'login' ? 'Entrar no Sistema' : 'Criar Conta & Entrar'}
          </button>
        </form>

        {modo === 'login' && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-[11px] text-center text-zinc-600 space-y-0.5">
            <div>
              <strong>Dono (Admin):</strong> usuário <code>admin</code> • senha <code>1234</code>
            </div>
            <div>
              <strong>Funcionário (Caixa):</strong> usuário <code>caixa</code> • senha <code>1234</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function OmniCriarUsuarioModal({
  aberto,
  onFechar,
  onCriado
}: {
  aberto: boolean;
  onFechar: () => void;
  onCriado: () => void;
}) {
  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<'admin' | 'funcionario'>('funcionario');
  const [lojaPadrao, setLojaPadrao] = useState<'Loja 1' | 'Loja 2'>('Loja 1');
  const [erro, setErro] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setOkMsg('');
    setSalvando(true);
    try {
      const cargo = perfil === 'admin' ? 'Dono / Administrador' : 'Caixa & Atendimento';
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'registrar',
          nome,
          login,
          senha,
          cargo,
          perfil,
          lojaPadrao,
          entrarAutomatico: false
        })
      });
      const data = await res.json();
      if (!data.ok) {
        setErro(data.erro || 'Erro ao criar usuário');
        return;
      }
      setOkMsg(`Usuário "${data.usuario.login}" (${data.usuario.perfil}) criado com sucesso!`);
      setNome('');
      setLogin('');
      setSenha('');
      onCriado();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#8B0029]" /> Criar Novo Usuário
          </h3>
          <button onClick={onFechar} className="p-1 rounded-lg hover:bg-zinc-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={criar} className="space-y-3 text-xs">
          <input
            required
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome completo (ex: Maria Caixa)"
            className="w-full border border-zinc-300 rounded-xl px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Login (ex: maria)"
              className="border border-zinc-300 rounded-xl px-3 py-2"
            />
            <input
              required
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="Senha (mín. 4)"
              className="border border-zinc-300 rounded-xl px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={perfil} onChange={e => setPerfil(e.target.value as 'admin' | 'funcionario')} className="border border-zinc-300 rounded-xl px-2.5 py-2">
              <option value="funcionario">Funcionário (Caixa)</option>
              <option value="admin">Dono (Admin Total)</option>
            </select>
            <select value={lojaPadrao} onChange={e => setLojaPadrao(e.target.value as 'Loja 1' | 'Loja 2')} className="border border-zinc-300 rounded-xl px-2.5 py-2">
              <option value="Loja 1">Loja 1</option>
              <option value="Loja 2">Loja 2</option>
            </select>
          </div>
          {erro && <p className="text-rose-600 font-bold">{erro}</p>}
          {okMsg && <p className="text-emerald-700 font-bold">{okMsg}</p>}
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2.5 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white font-bold text-sm"
          >
            {salvando ? 'Salvando...' : 'Cadastrar Usuário'}
          </button>
        </form>
      </div>
    </div>
  );
}
