import { describe, expect, it } from 'vitest';
import { ProdutoCreateSchema, VendaCreateSchema } from '@/lib/schemas';

describe('Omni-OS Schemas', () => {
  it('valida cadastro de produto válido', () => {
    const res = ProdutoCreateSchema.safeParse({ nome: 'Pizza Calabresa', categoria: 'Pizzas', preco: 49.9, estoque: 20 });
    expect(res.success).toBe(true);
  });

  it('rejeita venda sem itens', () => {
    const res = VendaCreateSchema.safeParse({ clienteNome: 'Maria', itens: [] });
    expect(res.success).toBe(false);
  });
});
