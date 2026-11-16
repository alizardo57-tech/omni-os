import fs from 'fs';
import os from 'os';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'omni-os.json');

export function getBackupDir(): string {
  return process.env.OMNI_BACKUP_DIR || path.join(os.homedir(), 'Documents', 'OmniOS-Backups');
}

export function gerarBackupExterno(motivo = 'manual'): {
  ok: boolean;
  caminho?: string;
  pasta: string;
  erro?: string;
} {
  const pasta = getBackupDir();
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { ok: false, pasta, erro: 'Banco local data/omni-os.json ainda não foi criado.' };
    }
    if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
    const agora = new Date();
    const stamp = [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, '0'),
      String(agora.getDate()).padStart(2, '0')
    ].join('-') +
      '_' +
      [
        String(agora.getHours()).padStart(2, '0'),
        String(agora.getMinutes()).padStart(2, '0'),
        String(agora.getSeconds()).padStart(2, '0')
      ].join('-');
    const arquivo = `omni-os-backup-${stamp}-${motivo}.json`;
    const destino = path.join(pasta, arquivo);
    fs.copyFileSync(DB_PATH, destino);
    return { ok: true, caminho: destino, pasta };
  } catch (err) {
    return {
      ok: false,
      pasta,
      erro: err instanceof Error ? err.message : 'Erro ao gerar backup externo'
    };
  }
}

export function listarBackupsExternos(): { nome: string; tamanhoBytes: number; criadoEm: string }[] {
  const pasta = getBackupDir();
  if (!fs.existsSync(pasta)) return [];
  return fs
    .readdirSync(pasta)
    .filter(f => f.startsWith('omni-os-backup-') && f.endsWith('.json'))
    .map(nome => {
      const stat = fs.statSync(path.join(pasta, nome));
      return {
        nome,
        tamanhoBytes: stat.size,
        criadoEm: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 15);
}
