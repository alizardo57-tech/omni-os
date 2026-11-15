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
  vendas: []
};

export function lerOmniDb(): OmniDb {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_INICIAL, null, 2), 'utf8');
    return JSON.parse(JSON.stringify(SEED_INICIAL)) as OmniDb;
  }
  const dados = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as OmniDb;
  let alterou = false;
  if (!dados.produtos || dados.produtos.length < 90 || dados.produtos.find(p => p.id === 56)?.categoria === 'Pizzas Salgadas') {
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
