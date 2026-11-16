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
  camilaWebhookUrl: z.string().optional()
});

function montarMensagemFechamento(
  nomeEmpresa: string,
  loja: string,
  qtdPedidos: number,
  porPagamento: Record<string, number>,
  totalGeral: number,
  operador: string
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
  linhas.push(`--------------------------------`, `*TOTAL DO CAIXA: R$ ${totalGeral.toFixed(2)}*`);
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

  const whatsappDono = (db.empresa.whatsappDono || '').replace(/\D/g, '');
  const webhookUrl = (db.empresa.camilaWebhookUrl || process.env.CAMILA_WEBHOOK_URL || '').trim();
  const mensagemWhatsapp = montarMensagemFechamento(
    db.empresa.nome || 'Bella Pizza',
    parsed.data.loja,
    vendasAlvo.length,
    porPagamento,
    totalGeral,
    db.empresa.operador || 'Bella Pizza'
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
