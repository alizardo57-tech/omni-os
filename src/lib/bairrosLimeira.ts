export type LojaId = 'Loja 1' | 'Loja 2';

export const BAIRROS_LIMEIRA_PADRAO: Record<string, LojaId> = {
  'Centro': 'Loja 1',
  'Vila Cidade Jardim': 'Loja 1',
  'Vila Claudia': 'Loja 1',
  'Vila Cristovam': 'Loja 1',
  'Vila Queiroz': 'Loja 1',
  'Jardim Paulista': 'Loja 1',
  'Jardim Glória': 'Loja 1',
  'Jardim São Paulo': 'Loja 1',
  'Jardim Piratininga': 'Loja 1',
  'Jardim Nova Itália': 'Loja 1',
  'Jardim Mercedes': 'Loja 1',
  'Jardim Elite': 'Loja 1',
  'Jardim Montezuma': 'Loja 1',
  'Jardim Primavera': 'Loja 1',
  'Jardim Bandeirantes': 'Loja 1',
  'Jardim Morro Azul': 'Loja 1',
  'Jardim Esteves': 'Loja 1',
  'Jardim São Manoel': 'Loja 1',
  'Jardim Boa Vista': 'Loja 1',
  'Jardim Ipiranga': 'Loja 1',
  'Parque Hipólito': 'Loja 2',
  'Jardim Santa Eulália': 'Loja 2',
  'Jardim Nossa Senhora das Dores': 'Loja 2',
  'Parque Abílio Pedro': 'Loja 2',
  'Jardim Ernesto Kuhl': 'Loja 2',
  'Jardim Olga Veroni': 'Loja 2',
  'Jardim Lagoa Nova': 'Loja 2',
  'Jardim Santo André': 'Loja 2',
  'Jardim Residencial Graminha': 'Loja 2',
  'Parque das Nações': 'Loja 2',
  'Jardim Campo Verde': 'Loja 2',
  'Jardim Aeroporto': 'Loja 2',
  'Parque Egisto Ragazzo': 'Loja 2',
  'Jardim Manacás': 'Loja 2',
  'Residencial Belinha Ometto': 'Loja 2',
  'Residencial Roland': 'Loja 2',
  'Jardim Morro Branco': 'Loja 2',
  'Jardim Alvorada': 'Loja 2',
  'Jardim Planalto': 'Loja 2',
  'Jardim Santa Bárbara': 'Loja 2',
  'Jardim Nova Suíça': 'Loja 2',
  'Jardim Vista Alegre': 'Loja 2',
  'Parque Novo Mundo': 'Loja 2',
  'Jardim Caieiras': 'Loja 2'
};

function normalizarTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Tenta identificar automaticamente um bairro de Limeira dentro do texto do endereço.
 */
export function detectarBairroNoEndereco(
  endereco: string,
  bairrosLoja: Record<string, LojaId>
): string | null {
  if (!endereco.trim()) return null;
  const normEnd = normalizarTexto(endereco);
  const nomes = Object.keys(bairrosLoja).sort((a, b) => b.length - a.length);
  for (const bairro of nomes) {
    if (normEnd.includes(normalizarTexto(bairro))) {
      return bairro;
    }
  }
  return null;
}
