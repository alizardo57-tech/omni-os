import { z } from 'zod';

export const ProdutoSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1),
  categoria: z.string().min(1).default('Geral'),
  preco: z.number().nonnegative(),
  estoque: z.number().int().nonnegative(),
  descricao: z.string().optional().default(''),
  imagem: z.string().optional().default('')
});

export const ProdutoUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
  preco: z.number().nonnegative().optional(),
  estoque: z.number().int().nonnegative().optional(),
  descricao: z.string().optional(),
  imagem: z.string().optional()
});

export const ProdutoCreateSchema = z.object({
  nome: z.string().min(1),
  categoria: z.string().min(1).default('Geral'),
  preco: z.number().nonnegative(),
  estoque: z.number().int().nonnegative().default(50),
  descricao: z.string().optional().default(''),
  imagem: z.string().optional().default('')
});

export const ClienteSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  telefone: z.string().min(8),
  endereco: z.string().default(''),
  cashback: z.number().nonnegative().default(0),
  totalPedidos: z.number().int().nonnegative().default(0)
});

export const ClienteCreateSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().min(8),
  endereco: z.string().optional().default('')
});

export const ItemVendaSchema = z.object({
  produtoId: z.number().int().positive(),
  nome: z.string().min(1),
  qtd: z.number().int().positive(),
  precoUnit: z.number().nonnegative(),
  observacao: z.string().optional().default('')
});

export const VendaCreateSchema = z.object({
  clienteNome: z.string().min(1).default('Consumidor Balcão'),
  clienteTelefone: z.string().optional().default(''),
  modalidade: z.enum(['balcao', 'entrega', 'retirada']).default('balcao'),
  pagamento: z.string().min(1).default('PIX'),
  endereco: z.string().optional().default(''),
  bairro: z.string().optional().default(''),
  loja: z.enum(['Loja 1', 'Loja 2']).optional().default('Loja 1'),
  observacao: z.string().optional().default(''),
  taxaEntrega: z.number().nonnegative().optional().default(0),
  desconto: z.number().nonnegative().optional().default(0),
  valorPago: z.number().nonnegative().optional().default(0),
  itens: z.array(ItemVendaSchema).min(1)
});

export const MovimentacaoFinanceiraSchema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  descricao: z.string().min(1),
  categoria: z.string().min(1).default('Operacional'),
  valor: z.number().positive(),
  loja: z.enum(['Loja 1', 'Loja 2']).optional().default('Loja 1'),
  pagamento: z.string().optional().default('Dinheiro')
});

export type MovimentacaoFinanceira = z.infer<typeof MovimentacaoFinanceiraSchema> & {
  id: string;
  criadoEm: string;
};

export type Usuario = {
  id: string;
  nome: string;
  login: string;
  senhaHash: string;
  cargo: string;
  perfil: 'admin' | 'funcionario';
  lojaPadrao: 'Loja 1' | 'Loja 2';
  criadoEm: string;
};

export type UsuarioPublico = Omit<Usuario, 'senhaHash'>;

export type Produto = z.infer<typeof ProdutoSchema>;
export type Cliente = z.infer<typeof ClienteSchema>;
export type Venda = {
  id: string;
  criadoEm: string;
  clienteNome: string;
  clienteTelefone: string;
  modalidade: 'balcao' | 'entrega' | 'retirada';
  pagamento: string;
  endereco: string;
  bairro?: string;
  loja?: 'Loja 1' | 'Loja 2';
  observacao?: string;
  itens: z.input<typeof ItemVendaSchema>[];
  subtotal?: number;
  taxaEntrega?: number;
  desconto?: number;
  valorPago?: number;
  troco?: number;
  total: number;
  status: 'preparando' | 'pronto' | 'entregue';
  ocultoCozinha?: boolean;
};
