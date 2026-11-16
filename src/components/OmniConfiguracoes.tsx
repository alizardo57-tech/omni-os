'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, HardDriveDownload, Save, Settings } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/backup')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setPastaBackup(d.pasta || '');
          setBackups(d.backups || []);
        }
      });
  }, []);

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
    </div>
  );
}
