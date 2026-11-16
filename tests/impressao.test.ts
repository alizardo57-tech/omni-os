import { describe, expect, it } from 'vitest';
import { formatarVia } from '@/lib/impressao';

describe('Impressão Bematech 80mm', () => {
  it('separa sabores 1/2 a 1/2 e borda sem cortar na largura de 32 colunas', () => {
    const linhas = formatarVia(
      {
        id: 'PED-999',
        criadoEm: '2026-11-15T00:00:00.000Z',
        clienteNome: 'João',
        clienteTelefone: '11999999999',
        modalidade: 'entrega',
        pagamento: 'PIX',
        endereco: 'Rua das Flores, 123',
        status: 'preparando',
        total: 74.99,
        itens: [
          {
            produtoId: 32,
            nome: '1/2 33 - Calabresa Especial + 1/2 32 - Portuguesa + Borda de Chocolate Ao Leite',
            qtd: 1,
            precoUnit: 74.99
          }
        ]
      },
      'VIA 1 - COZINHA'
    );

    const texto = linhas.join('\n');
    expect(texto).toContain('Calabresa Especial');
    expect(texto).toContain('+ 1/2 32 - Portuguesa');
    expect(texto).toContain('+ Borda de Chocolate');
    for (const l of linhas) {
      expect(l.length).toBeLessThanOrEqual(34);
    }
  });

  it('imprime loja, bairro, observação da pizza, taxa de entrega, desconto e troco automático', () => {
    const linhas = formatarVia(
      {
        id: 'OS-10500',
        criadoEm: '2026-11-16T14:00:00.000Z',
        clienteNome: 'Maria',
        clienteTelefone: '19988887777',
        modalidade: 'entrega',
        pagamento: 'Dinheiro',
        endereco: 'Av. Brasil, 500',
        bairro: 'Centro',
        loja: 'Loja 1',
        observacao: 'Tocar campainha',
        status: 'preparando',
        subtotal: 70,
        taxaEntrega: 8,
        desconto: 5,
        total: 73,
        valorPago: 100,
        troco: 27,
        itens: [
          {
            produtoId: 1007,
            nome: 'Broto 7 - Aliche + Bacon',
            qtd: 1,
            precoUnit: 48.99,
            observacao: 'Sem cebola e bem assada'
          }
        ]
      },
      'COMANDA DE PEDIDO'
    );

    const texto = linhas.join('\n');
    expect(texto).toContain('LOJA:    Loja 1');
    expect(texto).toContain('BAIRRO:  Centro');
    expect(texto).toContain('+ Bacon');
    expect(texto).toContain('OBS: Sem cebola e bem assada');
    expect(texto).toContain('OBS PEDIDO: Tocar campainha');
    expect(texto).toContain('TAXA ENT: R$ 8.00');
    expect(texto).toContain('DESCONTO: -R$ 5.00');
    expect(texto).toContain('TOTAL:    R$ 73.00');
    expect(texto).toContain('PAGO:     R$ 100.00');
    expect(texto).toContain('TROCO:    R$ 27.00');
    for (const l of linhas) {
      expect(l.length).toBeLessThanOrEqual(34);
    }
  });
});
