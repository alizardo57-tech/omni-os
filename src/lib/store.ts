import fs from 'fs';
import path from 'path';
import type { Cliente, Produto, Venda } from './schemas';
import produtosSeed from './produtosSeed.json';
import clientesBellaSeed from './clientesBellaSeed.json';

export interface OmniDb {
  empresa: {
    nome: string;
    operador: string;
    cargo: string;
    tempoPreparoMin: number;
  };
  produtos: Produto[];
  clientes: Cliente[];
  vendas: Venda[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'omni-os.json');

const SEED_INICIAL: OmniDb = {
  empresa: {
    nome: 'Bella Pizza',
    operador: 'Bella Pizza',
    cargo: 'Caixa & Atendimento',
    tempoPreparoMin: 35
  },
  produtos: produtosSeed as Produto[],
  clientes: clientesBellaSeed as Cliente[],
  vendas: [
    {
      id: 'OS-10472',
      criadoEm: new Date(Date.now() - 5 * 60000).toISOString(),
      clienteNome: 'Maria Silva',
      clienteTelefone: '11999991111',
      modalidade: 'entrega',
      pagamento: 'PIX',
      endereco: 'Rua das Flores, 120 - Centro',
      itens: [{ produtoId: 1, nome: 'Pizza Calabresa Grande', qtd: 2, precoUnit: 49.9 }],
      total: 99.8,
      status: 'preparando'
    },
    {
      id: 'OS-10471',
      criadoEm: new Date(Date.now() - 32 * 60000).toISOString(),
      clienteNome: 'João Santos',
      clienteTelefone: '11988882222',
      modalidade: 'balcao',
      pagamento: 'Cartão Crédito',
      endereco: '',
      itens: [{ produtoId: 2, nome: 'Pizza Moda da Casa', qtd: 1, precoUnit: 58.0 }],
      total: 58.0,
      status: 'pronto'
    }
  ]
};

export function lerOmniDb(): OmniDb {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_INICIAL, null, 2), 'utf8');
    return JSON.parse(JSON.stringify(SEED_INICIAL)) as OmniDb;
  }
  const dados = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as OmniDb;
  let alterou = false;
  if (!dados.produtos || dados.produtos.length <= 6) {
    dados.produtos = produtosSeed as Produto[];
    alterou = true;
  }
  if (!dados.clientes || dados.clientes.length <= 3) {
    dados.clientes = clientesBellaSeed as Cliente[];
    alterou = true;
  }
  if (dados.empresa?.operador === 'Alexandre Lizardo') {
    dados.empresa.nome = 'Bella Pizza';
    dados.empresa.operador = 'Bella Pizza';
    dados.empresa.cargo = 'Caixa & Atendimento';
    alterou = true;
  }
  if (alterou) fs.writeFileSync(DB_PATH, JSON.stringify(dados, null, 2), 'utf8');
  return dados;
}

export function salvarOmniDb(db: OmniDb): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}
