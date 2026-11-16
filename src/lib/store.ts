import fs from 'fs';
import path from 'path';
import type { Cliente, ComandaFantasma, MovimentacaoFinanceira, Produto, Usuario, Venda } from './schemas';
import { hashSenha } from './auth';
import { gerarBackupExterno } from './backup';
import { BAIRROS_LIMEIRA_PADRAO, type LojaId } from './bairrosLimeira';
import produtosSeed from './produtosSeed.json';
import clientesBellaSeed from './clientesBellaSeed.json';

export interface ResumoDiaAnterior {
  data: string;
  qtdPedidos: number;
  totalVendas: number;
  porPagamento: Record<string, number>;
}

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
  comandasFantasmas?: ComandaFantasma[];
  movimentacoesFinanceiras?: MovimentacaoFinanceira[];
  usuarios?: Usuario[];
  bairrosLoja?: Record<string, LojaId>;
  ultimoDiaOperacao?: string;
  resumoDiaAnterior?: ResumoDiaAnterior | null;
}

function dataLocalYYYYMMDD(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'omni-os.json');

function criarUsuariosPadrao(): Usuario[] {
  const agora = new Date().toISOString();
  return [
    {
      id: 'usr-admin',
      nome: 'Dono (Admin)',
      login: 'admin',
      senhaHash: hashSenha('1234'),
      cargo: 'Dono / Administrador',
      perfil: 'admin',
      lojaPadrao: 'Loja 1',
      criadoEm: agora
    },
    {
      id: 'usr-caixa',
      nome: 'Funcionário Caixa',
      login: 'caixa',
      senhaHash: hashSenha('1234'),
      cargo: 'Caixa & Atendimento',
      perfil: 'funcionario',
      lojaPadrao: 'Loja 1',
      criadoEm: agora
    }
  ];
}

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
  comandasFantasmas: [],
  movimentacoesFinanceiras: [],
  usuarios: criarUsuariosPadrao(),
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
  if (!dados.comandasFantasmas) {
    dados.comandasFantasmas = [];
    alterou = true;
  }
  if (!dados.usuarios || dados.usuarios.length === 0) {
    dados.usuarios = criarUsuariosPadrao();
    alterou = true;
  } else if (dados.usuarios.length === 1 && !dados.usuarios.some(u => u.login === 'caixa')) {
    const padrao = criarUsuariosPadrao();
    const caixaPadrao = padrao.find(u => u.login === 'caixa');
    if (caixaPadrao) {
      dados.usuarios.push(caixaPadrao);
      alterou = true;
    }
  }
  if (dados.empresa.whatsappDono === undefined) {
    dados.empresa.whatsappDono = process.env.WHATSAPP_DONO || '';
    alterou = true;
  }
  if (dados.empresa.camilaWebhookUrl === undefined) {
    dados.empresa.camilaWebhookUrl = process.env.CAMILA_WEBHOOK_URL || '';
    alterou = true;
  }

  const hoje = dataLocalYYYYMMDD(new Date());
  const temVendasAntigas = (dados.vendas || []).some(v => dataLocalYYYYMMDD(new Date(v.criadoEm)) < hoje);
  const temMovsAntigas = (dados.movimentacoesFinanceiras || []).some(m => dataLocalYYYYMMDD(new Date(m.criadoEm)) < hoje);
  const temFantasmasAntigas = (dados.comandasFantasmas || []).some(f => dataLocalYYYYMMDD(new Date(f.criadoEm)) < hoje);

  if (temVendasAntigas || temMovsAntigas || temFantasmasAntigas) {
    gerarBackupExterno('virada-dia');
    const vendasAntigas = (dados.vendas || []).filter(v => dataLocalYYYYMMDD(new Date(v.criadoEm)) < hoje);
    if (vendasAntigas.length > 0) {
      const porPagamento: Record<string, number> = {};
      let totalVendas = 0;
      for (const v of vendasAntigas) {
        const f = v.pagamento || 'Outros';
        porPagamento[f] = Number(((porPagamento[f] || 0) + Number(v.total || 0)).toFixed(2));
        totalVendas = Number((totalVendas + Number(v.total || 0)).toFixed(2));
      }
      dados.resumoDiaAnterior = {
        data: dataLocalYYYYMMDD(new Date(vendasAntigas[0].criadoEm)),
        qtdPedidos: vendasAntigas.length,
        totalVendas,
        porPagamento
      };
    }
    dados.vendas = (dados.vendas || []).filter(v => dataLocalYYYYMMDD(new Date(v.criadoEm)) >= hoje);
    dados.movimentacoesFinanceiras = (dados.movimentacoesFinanceiras || []).filter(
      m => dataLocalYYYYMMDD(new Date(m.criadoEm)) >= hoje
    );
    dados.comandasFantasmas = (dados.comandasFantasmas || []).filter(
      f => dataLocalYYYYMMDD(new Date(f.criadoEm)) >= hoje
    );
    dados.ultimoDiaOperacao = hoje;
    alterou = true;
  } else if (dados.ultimoDiaOperacao !== hoje) {
    dados.ultimoDiaOperacao = hoje;
    alterou = true;
  }

  if (alterou) fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2), 'utf8');
  return dados;
}

export function salvarOmniDb(db: OmniDb): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}
