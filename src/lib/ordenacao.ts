import type { Produto } from './schemas';

/**
 * Normaliza o nome do produto removendo prefixos de tamanho ("Broto ") e numeração ("12 - ")
 * para garantir ordenação alfabética real pelo nome do sabor/item.
 */
export function nomeParaOrdenacao(nome: string): string {
  return nome
    .replace(/^Broto\s+/i, '')
    .replace(/^\d+\s*-\s*/, '')
    .trim();
}

/**
 * Ordena produtos em ordem alfabética (pt-BR), usando o nome completo como desempate.
 */
export function ordenarProdutosAlfabeticamente(produtos: Produto[]): Produto[] {
  return [...produtos].sort((a, b) => {
    const cmp = nomeParaOrdenacao(a.nome).localeCompare(nomeParaOrdenacao(b.nome), 'pt-BR', {
      sensitivity: 'base'
    });
    return cmp !== 0 ? cmp : a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  });
}
