import { NextResponse } from 'next/server';
import { gerarBackupExterno } from '@/lib/backup';
import { lerOmniDb } from '@/lib/store';
import { logger } from '@/lib/logger';

async function verificarEAlertar() {
  const db = lerOmniDb();
  const qtdPedidos = db.vendas.length;
  const totalGeral = db.vendas.reduce((s, v) => s + Number(v.total || 0), 0);

  if (qtdPedidos === 0) {
    return {
      ok: true,
      pendente: false,
      qtdPedidos: 0,
      totalGeral: 0,
      camilaEnviado: false,
      mensagem: 'Caixa já está fechado/zerado.'
    };
  }

  const backup = gerarBackupExterno('alerta-sem-fechamento');
  const whatsappDono = (db.empresa.whatsappDono || '').replace(/\D/g, '');
  const webhookUrl = (db.empresa.camilaWebhookUrl || process.env.CAMILA_WEBHOOK_URL || '').trim();

  const mensagem = [
    `⚠️ *ALERTA: FECHAMENTO NÃO REALIZADO (${db.empresa.nome})*`,
    `Data: ${new Date().toLocaleString('pt-BR')}`,
    `O caixa do dia ainda não foi encerrado.`,
    `Pedidos em aberto: ${qtdPedidos}`,
    `Total acumulado: *R$ ${totalGeral.toFixed(2)}*`,
    backup.ok ? `Backup automático salvo fora do sistema.` : ''
  ]
    .filter(Boolean)
    .join('\n');

  let camilaEnviado = false;
  let camilaErro = '';
  if (webhookUrl && whatsappDono) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem: 'omni-os-alerta-fechamento',
          agente: 'Camila',
          telefone: whatsappDono.startsWith('55') ? whatsappDono : `55${whatsappDono}`,
          mensagem,
          qtdPedidos,
          totalGeral
        })
      });
      if (resp.ok) camilaEnviado = true;
      else camilaErro = `HTTP ${resp.status}`;
    } catch (err) {
      camilaErro = err instanceof Error ? err.message : 'Erro ao conectar na Camila';
      logger.warn({ err: camilaErro }, 'Falha no alerta de fechamento via Camila');
    }
  }

  return {
    ok: true,
    pendente: true,
    qtdPedidos,
    totalGeral: Number(totalGeral.toFixed(2)),
    backupCaminho: backup.caminho,
    camilaEnviado,
    camilaErro,
    mensagem
  };
}

export async function GET() {
  return NextResponse.json(await verificarEAlertar());
}

export async function POST() {
  return NextResponse.json(await verificarEAlertar());
}
