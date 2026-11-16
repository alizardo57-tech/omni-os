'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, HardDriveDownload, Save, Settings, Trash2, UserPlus, Users } from 'lucide-react';
import type { UsuarioPublico } from '@/lib/schemas';

export function OmniConfiguracoes({
  empresa,
  onAtualizar
}: {
  empresa: {
    nome: string;
    operador: string;
    cargo: string;
    tempoPreparoMin: number;
    whatsappDono?: string;
    camilaWebhookUrl?: string;
  };
  onAtualizar: () => void;
}) {
  const [nome, setNome] = useState(empresa.nome);
  const [operador, setOperador] = useState(empresa.operador);
  const [cargo, setCargo] = useState(empresa.cargo);
  const [tempoPreparoMin, setTempoPreparoMin] = useState(String(empresa.tempoPreparoMin || 35));
  const [whatsappDono, setWhatsappDono] = useState(empresa.whatsappDono || '');
  const [camilaWebhookUrl, setCamilaWebhookUrl] = useState(empresa.camilaWebhookUrl || '');
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [pastaBackup, setPastaBackup] = useState('');
  const [backups, setBackups] = useState<{ nome: string; tamanhoBytes: number; criadoEm: string }[]>([]);
  const [gerandoBackup, setGerandoBackup] = useState(false);
  const [msgBackup, setMsgBackup] = useState('');
  const [zerandoTeste, setZerandoTeste] = useState(false);
  const [msgZerar, setMsgZerar] = useState('');
  const [usuarios, setUsuarios] = useState<UsuarioPublico[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<'admin' | 'funcionario'>('funcionario');
  const [novaLoja, setNovaLoja] = useState<'Loja 1' | 'Loja 2'>('Loja 1');
  const [msgUsuario, setMsgUsuario] = useState('');

  const carregarUsuarios = () => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(d => {
        if (d.ok) setUsuarios(d.usuarios || []);
      });
  };

  useEffect(() => {
    carregarUsuarios();
    fetch('/api/backup')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setPastaBackup(d.pasta || '');
          setBackups(d.backups || []);
        }
      });
  }, []);

  const criarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgUsuario('');
    const cargoUsr = novoPerfil === 'admin' ? 'Dono / Administrador' : 'Caixa & Atendimento';
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'registrar',
        nome: novoNome,
        login: novoLogin,
        senha: novaSenha,
        cargo: cargoUsr,
        perfil: novoPerfil,
        lojaPadrao: novaLoja,
        entrarAutomatico: false
      })
    });
    const d = await res.json();
    if (d.ok) {
      setNovoNome('');
      setNovoLogin('');
      setNovaSenha('');
      setMsgUsuario(`Usuário "${d.usuario.login}" criado com sucesso!`);
      carregarUsuarios();
    } else {
      setMsgUsuario(d.erro || 'Erro ao criar usuário.');
    }
  };

  const removerUsuario = async (id: string) => {
    await fetch(`/api/auth?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    carregarUsuarios();
  };

  const zerarValoresDeTeste = async () => {
    if (!window.confirm('Zerar todas as vendas, financeiro e auditoria de teste? Produtos, clientes e usuários serão mantidos.')) {
      return;
    }
    setZerandoTeste(true);
    setMsgZerar('');
    try {
      const res = await fetch('/api/overview', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zerarValoresTeste: true })
      });
      if ((await res.json()).ok) {
        setMsgZerar('✅ Valores zerados com sucesso! (Backup salvo antes em Documents\\OmniOS-Backups).');
        onAtualizar();
      }
    } finally {
      setZerandoTeste(false);
    }
  };

  const gerarBackupAgora = async () => {
    setGerandoBackup(true);
    setMsgBackup('');
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const d = await res.json();
      if (d.ok) {
        setBackups(d.backups || []);
        setMsgBackup(`Backup salvo em ${d.caminho}`);
      } else {
        setMsgBackup(d.erro || 'Não foi possível gerar backup.');
      }
    } finally {
      setGerandoBackup(false);
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setSalvoOk(false);
    try {
      const res = await fetch('/api/overview', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaNome: nome,
          operador,
          cargo,
          tempoPreparoMin: Math.max(5, Math.min(180, Number(tempoPreparoMin) || 35)),
          whatsappDono,
          camilaWebhookUrl
        })
      });
      if ((await res.json()).ok) {
        setSalvoOk(true);
        setTimeout(() => setSalvoOk(false), 3000);
        onAtualizar();
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#8B0029]" /> Configurações do Estabelecimento
        </h2>
        <p className="text-xs text-zinc-500">Ajuste os dados locais do sistema, tempo de cozinha e integração da Camila</p>
      </div>

      <form onSubmit={salvar} className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="font-bold text-zinc-700 block mb-1">Nome do Estabelecimento</span>
            <input value={nome} onChange={e => setNome(e.target.value)} className="w-full border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]" />
          </label>
          <label className="block">
            <span className="font-bold text-zinc-700 block mb-1">Tempo Meta Cozinha (min)</span>
            <input type="number" min="5" max="180" value={tempoPreparoMin} onChange={e => setTempoPreparoMin(e.target.value)} className="w-full border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]" />
          </label>
          <label className="block">
            <span className="font-bold text-zinc-700 block mb-1">Operador Atual</span>
            <input value={operador} onChange={e => setOperador(e.target.value)} className="w-full border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]" />
          </label>
          <label className="block">
            <span className="font-bold text-zinc-700 block mb-1">Cargo</span>
            <input value={cargo} onChange={e => setCargo(e.target.value)} className="w-full border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]" />
          </label>
        </div>

        <div className="border-t border-zinc-100 pt-3 space-y-3">
          <div className="font-black text-zinc-900">Fechamento Automático • Camila / WhatsApp do Dono</div>
          <label className="block">
            <span className="font-bold text-zinc-700 block mb-1">WhatsApp do Dono (com DDD)</span>
            <input value={whatsappDono} onChange={e => setWhatsappDono(e.target.value)} placeholder="19999999999" className="w-full border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]" />
          </label>
          <label className="block">
            <span className="font-bold text-zinc-700 block mb-1">URL Webhook Camila (n8n / API WhatsApp)</span>
            <input value={camilaWebhookUrl} onChange={e => setCamilaWebhookUrl(e.target.value)} placeholder="https://..." className="w-full border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]" />
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="px-5 py-2.5 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white font-bold inline-flex items-center gap-1.5 transition"
          >
            <Save className="w-4 h-4" /> {salvando ? 'Salvando...' : 'Salvar Configurações'}
          </button>
          {salvoOk && (
            <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
            </span>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
              <HardDriveDownload className="w-4 h-4 text-[#8B0029]" /> Backup Externo Automático (Fora do Sistema)
            </h3>
            <p className="text-zinc-500">
              Pasta segura: <code>{pastaBackup || 'Documents/OmniOS-Backups'}</code> (gerado automaticamente a cada fechamento).
            </p>
          </div>
          <button
            type="button"
            disabled={gerandoBackup}
            onClick={gerarBackupAgora}
            className="px-4 py-2 rounded-xl bg-[#0B0B0B] hover:bg-[#8B0029] text-white font-bold transition"
          >
            {gerandoBackup ? 'Gerando...' : 'Gerar Backup Agora'}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100">
          <span className="text-[11px] text-zinc-600">
            Quer limpar vendas e financeiro de teste sem apagar produtos, clientes ou usuários?
          </span>
          <button
            type="button"
            disabled={zerandoTeste}
            onClick={zerarValoresDeTeste}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 font-bold transition"
          >
            {zerandoTeste ? 'Zerando...' : 'Zerar Valores de Teste'}
          </button>
        </div>
        {msgZerar && <p className="font-bold text-emerald-700">{msgZerar}</p>}
        {msgBackup && <p className="font-bold text-emerald-700">{msgBackup}</p>}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[11px] text-zinc-700">
          <strong>Alerta automático na VPS / Agentes (se não fechar o caixa):</strong> configure seu agendador/n8n para chamar{' '}
          <code>POST /api/vendas/fechamento/alerta</code> no fim do expediente — se houver pedidos em aberto, ele salva um backup e avisa o dono pela Camila.
        </div>
        {backups.length > 0 && (
          <div className="max-h-36 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl">
            {backups.map(b => (
              <div key={b.nome} className="flex justify-between px-3 py-1.5 text-[11px]">
                <span className="font-semibold text-zinc-800">{b.nome}</span>
                <span className="text-zinc-500">{(b.tamanhoBytes / 1024).toFixed(0)} KB</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4 text-xs">
        <div>
          <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#8B0029]" /> Área do Admin • Gerenciar & Criar Usuários
          </h3>
          <p className="text-zinc-500">Crie acessos separados para Dono (Admin) e Funcionários (Caixa/Atendimento)</p>
        </div>

        <form onSubmit={criarUsuario} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
          <input
            required
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder="Nome completo"
            className="sm:col-span-2 border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]"
          />
          <input
            required
            value={novoLogin}
            onChange={e => setNovoLogin(e.target.value)}
            placeholder="Login (ex: joao)"
            className="sm:col-span-1 border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]"
          />
          <input
            required
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            placeholder="Senha"
            className="sm:col-span-1 border border-zinc-300 rounded-xl px-3 py-2 outline-none focus:border-[#8B0029]"
          />
          <select
            value={novoPerfil}
            onChange={e => setNovoPerfil(e.target.value as 'admin' | 'funcionario')}
            className="sm:col-span-1 border border-zinc-300 rounded-xl px-2 py-2 font-semibold"
          >
            <option value="funcionario">Funcionário</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={novaLoja}
            onChange={e => setNovaLoja(e.target.value as 'Loja 1' | 'Loja 2')}
            className="sm:col-span-1 border border-zinc-300 rounded-xl px-2 py-2 font-semibold"
          >
            <option value="Loja 1">Loja 1</option>
            <option value="Loja 2">Loja 2</option>
          </select>
          <button
            type="submit"
            className="sm:col-span-6 py-2.5 px-4 rounded-xl bg-[#8B0029] hover:bg-[#A50034] text-white font-bold inline-flex items-center justify-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4" /> Criar Usuário
          </button>
        </form>

        {msgUsuario && <p className="font-bold text-emerald-700">{msgUsuario}</p>}

        <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl">
          {usuarios.map(u => (
            <div key={u.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <div className="font-bold text-zinc-900">
                  {u.nome} <span className="text-zinc-500 font-normal">(@{u.login})</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  {u.perfil === 'admin' ? '👑 Dono / Admin' : '🧾 Funcionário'} • {u.lojaPadrao}
                </div>
              </div>
              {u.id !== 'usr-admin' && (
                <button
                  type="button"
                  onClick={() => removerUsuario(u.id)}
                  className="text-rose-600 hover:text-rose-800 p-1"
                  title="Remover usuário"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
