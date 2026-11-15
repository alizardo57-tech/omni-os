import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';
import { imprimirFechamentoOmni } from '@/lib/impressao';

const FechamentoSchema = z.object({
  imprimir: z.boolean().optional().default(true),
  zerarTurno: z.boolean().optional().default(false)
});

export async function POST(req: Request) {
  const parsed = FechamentoSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const db = lerOmniDb();
  const porPagamento: Record<string, number> = {};
  let totalGeral = 0;

  for (const v of db.vendas) {
    const forma = v.pagamento || 'Outros';
    porPagamento[forma] = Number(((porPagamento[forma] || 0) + v.total).toFixed(2));
    totalGeral = Number((totalGeral + v.total).toFixed(2));
  }

  if (parsed.data.imprimir) {
    imprimirFechamentoOmni(porPagamento, totalGeral, db.vendas.length);
  }

  if (parsed.data.zerarTurno) {
    db.vendas = [];
    salvarOmniDb(db);
  }

  return NextResponse.json({
    ok: true,
    qtdPedidos: db.vendas.length,
    porPagamento,
    totalGeral
  });
}
