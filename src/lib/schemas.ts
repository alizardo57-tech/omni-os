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
  precoUnit: z.number().nonnegative()
});

export const VendaCreateSchema = z.object({
  clienteNome: z.string().min(1).default('Consumidor Balcão'),
  clienteTelefone: z.string().optional().default(''),
  modalidade: z.enum(['balcao', 'entrega', 'retirada']).default('balcao'),
  pagamento: z.string().min(1).default('PIX'),
  endereco: z.string().optional().default(''),
  itens: z.array(ItemVendaSchema).min(1)
});

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
  itens: z.infer<typeof ItemVendaSchema>[];
  total: number;
  status: 'preparando' | 'pronto' | 'entregue';
};
