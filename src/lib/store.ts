import fs from 'fs';
import path from 'path';
import type { Cliente, MovimentacaoFinanceira, Produto, Venda } from './schemas';
import { BAIRROS_LIMEIRA_PADRAO, type LojaId } from './bairrosLimeira';
import produtosSeed from './produtosSeed.json';
import clientesBellaSeed from './clientesBellaSeed.json';

export interface OmniDb {
  empresa: {
    nome: string;
    operador: string;
    cargo: string;
    tempoPreparoMin: number;
    whatsappDono?: string;
    camilaWebhookUrl?: string;
  };
  produtosVersao?: number;
  produtos: Produto[];
  clientes: Cliente[];
  vendas: Venda[];
  movimentacoesFinanceiras?: MovimentacaoFinanceira[];
  bairrosLoja?: Record<string, LojaId>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'omni-os.json');

const SEED_INICIAL: OmniDb = {
  empresa: {
    nome: 'Bella Pizza',
    operador: 'Bella Pizza',
    cargo: 'Caixa & Atendimento',
    tempoPreparoMin: 35,
    whatsappDono: process.env.WHATSAPP_DONO || '',
    camilaWebhookUrl: process.env.CAMILA_WEBHOOK_URL || ''
  },
  produtosVersao: 6,
  produtos: produtosSeed as Produto[],
  clientes: clientesBellaSeed as Cliente[],
  vendas: [],
  movimentacoesFinanceiras: [],
  bairrosLoja: { ...BAIRROS_LIMEIRA_PADRAO }
};

export function lerOmniDb(): OmniDb {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_INICIAL, null, 2), 'utf8');
    return JSON.parse(JSON.stringify(SEED_INICIAL)) as OmniDb;
  }
  const dados = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as OmniDb;
  let alterou = false;
  if (!dados.produtos || (dados.produtosVersao || 1) < 6) {
    dados.produtos = produtosSeed as Produto[];
    dados.produtosVersao = 6;
    alterou = true;
  }
  if (!dados.clientes || dados.clientes.length <= 3) {
    dados.clientes = clientesBellaSeed as Cliente[];
    alterou = true;
  } else {
    let normalizouTel = false;
    dados.clientes = dados.clientes.map(c => {
      let d = String(c.telefone || '').replace(/\D/g, '');
      let mudou = false;
      if (d.length === 8) {
        d = /^[6-9]/.test(d) ? `199${d}` : `19${d}`;
        mudou = true;
      } else if (d.length === 9) {
        d = `19${d}`;
        mudou = true;
      }
      if (mudou) normalizouTel = true;
      return mudou && d ? { ...c, id: d, telefone: d } : c;
    });
    if (normalizouTel) alterou = true;
  }
  if (dados.empresa?.operador === 'Alexandre Lizardo') {
    dados.empresa.nome = 'Bella Pizza';
    dados.empresa.operador = 'Bella Pizza';
    dados.empresa.cargo = 'Caixa & Atendimento';
    alterou = true;
  }
  if (!dados.bairrosLoja || Object.keys(dados.bairrosLoja).length === 0) {
    dados.bairrosLoja = { ...BAIRROS_LIMEIRA_PADRAO };
    alterou = true;
  }
  if (!dados.movimentacoesFinanceiras) {
    dados.movimentacoesFinanceiras = [];
    alterou = true;
  }
  if (dados.empresa.whatsappDono === undefined) {
    dados.empresa.whatsappDono = process.env.WHATSAPP_DONO || '';
    alterou = true;
  }
  if (dados.empresa.camilaWebhookUrl === undefined) {
    dados.empresa.camilaWebhookUrl = process.env.CAMILA_WEBHOOK_URL || '';
    alterou = true;
  }
  if (alterou) fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2), 'utf8');
  return dados;
}

export function salvarOmniDb(db: OmniDb): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}
