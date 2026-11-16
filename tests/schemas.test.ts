import { describe, expect, it } from 'vitest';
import { ProdutoCreateSchema, VendaCreateSchema } from '@/lib/schemas';
import { ordenarProdutosAlfabeticamente } from '@/lib/ordenacao';
import { BAIRROS_LIMEIRA_PADRAO, detectarBairroNoEndereco } from '@/lib/bairrosLimeira';

describe('Omni-OS Schemas & Helpers', () => {
  it('valida cadastro de produto válido', () => {
    const res = ProdutoCreateSchema.safeParse({ nome: 'Pizza Calabresa', categoria: 'Pizzas', preco: 49.9, estoque: 20 });
    expect(res.success).toBe(true);
  });

  it('rejeita venda sem itens', () => {
    const res = VendaCreateSchema.safeParse({ clienteNome: 'Maria', itens: [] });
    expect(res.success).toBe(false);
  });

  it('valida venda com taxaEntrega, desconto, valorPago, bairro, loja e observacao no item', () => {
    const res = VendaCreateSchema.safeParse({
      clienteNome: 'Carlos',
      bairro: 'Centro',
      loja: 'Loja 1',
      taxaEntrega: 7.5,
      desconto: 5,
      valorPago: 100,
      observacao: 'Sem campainha',
      itens: [{ produtoId: 1001, nome: 'Broto 1 - Moda Da Casa', qtd: 1, precoUnit: 49.99, observacao: 'Sem cebola' }]
    });
    expect(res.success).toBe(true);
  });

  it('ordena cardápio em ordem alfabética pelo sabor ignorando número e prefixo Broto', () => {
    const ordenados = ordenarProdutosAlfabeticamente([
      { id: 1, nome: '1 - Moda Da Casa', categoria: 'Pizzas Salgadas', preco: 69.99, estoque: 50, descricao: '', imagem: '' },
      { id: 7, nome: '7 - Aliche', categoria: 'Pizzas Salgadas', preco: 68.99, estoque: 50, descricao: '', imagem: '' },
      { id: 1003, nome: 'Broto 3 - Bacalhau', categoria: 'Broto', preco: 62.99, estoque: 50, descricao: '', imagem: '' }
    ]);
    expect(ordenados.map(p => p.nome)).toEqual(['7 - Aliche', 'Broto 3 - Bacalhau', '1 - Moda Da Casa']);
  });

  it('detecta bairro de Limeira no endereço para rotear loja', () => {
    expect(detectarBairroNoEndereco('Rua Dr. Trajano, 100 - Centro, Limeira', BAIRROS_LIMEIRA_PADRAO)).toBe('Centro');
    expect(detectarBairroNoEndereco('Av. Hipólito, 50 - Parque Hipólito', BAIRROS_LIMEIRA_PADRAO)).toBe('Parque Hipólito');
  });
});
