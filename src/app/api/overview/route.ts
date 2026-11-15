import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';

export async function GET() {
  const db = lerOmniDb();
  const receitaVendas = db.vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalEstoque = db.produtos.reduce((acc, p) => acc + Number(p.estoque || 0), 0);
  return NextResponse.json({
    ok: true,
    empresa: db.empresa,
    produtos: db.produtos,
    clientes: db.clientes,
    vendas: db.vendas,
    kpis: {
      vendasMes: receitaVendas,
      produtosEstoque: totalEstoque,
      receitaTotal: receitaVendas,
      clientesAtivos: db.clientes.length
    }
  });
}

const ConfigTempoSchema = z.object({
  tempoPreparoMin: z.number().int().min(5).max(180)
});

export async function PATCH(req: Request) {
  const parsed = ConfigTempoSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const db = lerOmniDb();
  db.empresa.tempoPreparoMin = parsed.data.tempoPreparoMin;
  salvarOmniDb(db);
  return NextResponse.json({ ok: true, tempoPreparoMin: db.empresa.tempoPreparoMin });
}
