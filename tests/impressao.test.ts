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
});
