import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';
import { imprimirFechamentoOmni } from '@/lib/impressao';
import { gerarBackupExterno } from '@/lib/backup';
import { logger } from '@/lib/logger';

const FechamentoSchema = z.object({
  imprimir: z.boolean().optional().default(true),
  zerarTurno: z.boolean().optional().default(false),
  loja: z.enum(['Todas', 'Loja 1', 'Loja 2']).optional().default('Todas'),
  enviarWhatsapp: z.boolean().optional().default(false),
  whatsappDono: z.string().optional(),
  camilaWebhookUrl: z.string().optional(),
  valorContadoGaveta: z.number().nonnegative().optional()
});

function montarMensagemFechamento(
  nomeEmpresa: string,
  loja: string,
  qtdPedidos: number,
  porPagamento: Record<string, number>,
  totalGeral: number,
  operador: string,
  entradasAvulsas: number,
  saidasCaixa: number,
  fantasmas: { id: string; total: number; statusAntesExclusao: string; excluidoPor: string; clienteNome: string }[],
  fundoTroco = 0,
  dinheiroEsperado = 0,
  valorContadoGaveta?: number
): string {
  const linhas = [
    `*FECHAMENTO DE CAIXA - ${nomeEmpresa.toUpperCase()}*`,
    `Data: ${new Date().toLocaleString('pt-BR')}`,
    `Unidade: ${loja === 'Todas' ? 'Todas as Lojas' : loja}`,
    `Operador: ${operador}`,
    `Pedidos no turno: ${qtdPedidos}`,
    `--------------------------------`
  ];
  for (const [forma, valor] of Object.entries(porPagamento)) {
    linhas.push(`${forma}: R$ ${valor.toFixed(2)}`);
  }
  if (entradasAvulsas > 0 || saidasCaixa > 0 || fundoTroco > 0) {
    linhas.push(`--------------------------------`);
    if (fundoTroco > 0) linhas.push(`Fundo de Troco (Abertura): R$ ${fundoTroco.toFixed(2)}`);
    if (entradasAvulsas > 0) linhas.push(`Reforco/Entradas: +R$ ${entradasAvulsas.toFixed(2)}`);
    if (saidasCaixa > 0) linhas.push(`Despesas/Sangrias: -R$ ${saidasCaixa.toFixed(2)}`);
  }
  const saldoLiquido = totalGeral + entradasAvulsas - saidasCaixa;
  linhas.push(
    `--------------------------------`,
    `*TOTAL VENDAS: R$ ${totalGeral.toFixed(2)}*`,
    `*SALDO LIQUIDO: R$ ${saldoLiquido.toFixed(2)}*`
  );
  if (valorContadoGaveta !== undefined) {
    const dif = Number((valorContadoGaveta - dinheiroEsperado).toFixed(2));
    linhas.push(
      `Dinheiro Esperado Gaveta: R$ ${dinheiroEsperado.toFixed(2)}`,
      `Dinheiro Contado Gaveta: R$ ${valorContadoGaveta.toFixed(2)}`,
      `Diferenca Gaveta: ${dif >= 0 ? '+' : ''}R$ ${dif.toFixed(2)}`
    );
  }
  if (fantasmas.length > 0) {
    const totalFantasmas = fantasmas.reduce((s, f) => s + Number(f.total || 0), 0);
    linhas.push(
      `--------------------------------`,
      `*AUDITORIA INTERNA (EXCLUIDOS): ${fantasmas.length} (R$ ${totalFantasmas.toFixed(2)})*`
    );
    for (const f of fantasmas.slice(0, 15)) {
      linhas.push(`- ${f.id} | ${f.clienteNome} | R$ ${f.total.toFixed(2)} | Status: ${f.statusAntesExclusao} | Por: ${f.excluidoPor}`);
    }
  }
  return linhas.join('\n');
}

export async function POST(req: Request) {
  const parsed = FechamentoSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const db = lerOmniDb();

  if (parsed.data.whatsappDono !== undefined) {
    db.empresa.whatsappDono = parsed.data.whatsappDono.replace(/\D/g, '');
  }
  if (parsed.data.camilaWebhookUrl !== undefined) {
    db.empresa.camilaWebhookUrl = parsed.data.camilaWebhookUrl.trim();
  }

  const vendasAlvo =
    parsed.data.loja === 'Todas'
      ? db.vendas
      : db.vendas.filter(v => (v.loja || 'Loja 1') === parsed.data.loja);

  const porPagamento: Record<string, number> = {};
  let totalGeral = 0;

  for (const v of vendasAlvo) {
    const forma = v.pagamento || 'Outros';
    porPagamento[forma] = Number(((porPagamento[forma] || 0) + v.total).toFixed(2));
    totalGeral = Number((totalGeral + v.total).toFixed(2));
  }

  if (parsed.data.imprimir) {
    imprimirFechamentoOmni(porPagamento, totalGeral, vendasAlvo.length, db.empresa.nome);
  }

  const movs = (db.movimentacoesFinanceiras || []).filter(
    m => parsed.data.loja === 'Todas' || (m.loja || 'Loja 1') === parsed.data.loja
  );
  const entradasAvulsas = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
  const saidasCaixa = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);
  const fantasmasAlvo = (db.comandasFantasmas || []).filter(
    f => parsed.data.loja === 'Todas' || (f.loja || 'Loja 1') === parsed.data.loja
  );

  const fundoTroco = Number(db.caixaAbertura?.fundoTroco || 0);
  const vendasDinheiro = porPagamento['Dinheiro'] || 0;
  const entradasDinheiro = movs
    .filter(m => m.tipo === 'entrada' && (m.pagamento || 'Dinheiro') === 'Dinheiro')
    .reduce((s, m) => s + m.valor, 0);
  const saidasDinheiro = movs
    .filter(m => m.tipo === 'saida' && (m.pagamento || 'Dinheiro') === 'Dinheiro')
    .reduce((s, m) => s + m.valor, 0);
  const dinheiroEsperado = Number((fundoTroco + vendasDinheiro + entradasDinheiro - saidasDinheiro).toFixed(2));

  const whatsappDono = (db.empresa.whatsappDono || '').replace(/\D/g, '');
  const webhookUrl = (db.empresa.camilaWebhookUrl || process.env.CAMILA_WEBHOOK_URL || '').trim();
  const mensagemWhatsapp = montarMensagemFechamento(
    db.empresa.nome || 'Bella Pizza',
    parsed.data.loja,
    vendasAlvo.length,
    porPagamento,
    totalGeral,
    db.empresa.operador || 'Bella Pizza',
    entradasAvulsas,
    saidasCaixa,
    fantasmasAlvo,
    fundoTroco,
    dinheiroEsperado,
    parsed.data.valorContadoGaveta
  );

  let camilaEnviado = false;
  let camilaErro = '';

  if (parsed.data.enviarWhatsapp && webhookUrl && whatsappDono) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem: 'omni-os-fechamento',
          agente: 'Camila',
          telefone: whatsappDono.startsWith('55') ? whatsappDono : `55${whatsappDono}`,
          mensagem: mensagemWhatsapp,
          loja: parsed.data.loja,
          qtdPedidos: vendasAlvo.length,
          porPagamento,
          totalGeral
        })
      });
      if (resp.ok) {
        camilaEnviado = true;
      } else {
        camilaErro = `Webhook retornou HTTP ${resp.status}`;
      }
    } catch (err) {
      camilaErro = err instanceof Error ? err.message : 'Erro ao conectar na Camila';
      logger.warn({ err: camilaErro }, 'Falha ao enviar fechamento via Camila');
    }
  }

  const backup = gerarBackupExterno('fechamento');

  if (parsed.data.zerarTurno) {
    if (parsed.data.loja === 'Todas') {
      db.vendas = [];
    } else {
      db.vendas = db.vendas.filter(v => (v.loja || 'Loja 1') !== parsed.data.loja);
    }
  }

  salvarOmniDb(db);

  const telParaLink = whatsappDono ? (whatsappDono.startsWith('55') ? whatsappDono : `55${whatsappDono}`) : '';
  const whatsappUrl = telParaLink
    ? `https://wa.me/${telParaLink}?text=${encodeURIComponent(mensagemWhatsapp)}`
    : '';

  return NextResponse.json({
    ok: true,
    qtdPedidos: vendasAlvo.length,
    porPagamento,
    totalGeral,
    camilaEnviado,
    camilaErro,
    whatsappUrl,
    mensagemWhatsapp,
    backupOk: backup.ok,
    backupCaminho: backup.caminho,
    backupPasta: backup.pasta
  });
}
