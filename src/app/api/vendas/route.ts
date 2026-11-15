import { NextResponse } from 'next/server';
import { z } from 'zod';
import { VendaCreateSchema } from '@/lib/schemas';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';
import { imprimirComandaOmni } from '@/lib/impressao';

export async function GET() {
  const db = lerOmniDb();
  return NextResponse.json({ ok: true, vendas: db.vendas });
}

export async function POST(req: Request) {
  const parsed = VendaCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: parsed.error.flatten() }, { status: 400 });
  }
  const db = lerOmniDb();
  for (const item of parsed.data.itens) {
    const prod = db.produtos.find(p => p.id === item.produtoId);
    if (prod) prod.estoque = Math.max(0, prod.estoque - item.qtd);
  }
  const total = parsed.data.itens.reduce((s, i) => s + i.qtd * i.precoUnit, 0);
  const venda = {
    id: `OS-${10473 + db.vendas.length}`,
    criadoEm: new Date().toISOString(),
    ...parsed.data,
    total: Number(total.toFixed(2)),
    status: 'preparando' as const
  };
  db.vendas.unshift(venda);
  salvarOmniDb(db);
  imprimirComandaOmni(venda);
  return NextResponse.json({ ok: true, venda }, { status: 201 });
}

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['preparando', 'pronto', 'entregue']).optional(),
  reimprimir: z.boolean().optional()
});

export async function PATCH(req: Request) {
  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const db = lerOmniDb();
  const v = db.vendas.find(x => x.id === parsed.data.id);
  if (!v) return NextResponse.json({ ok: false }, { status: 404 });
  if (parsed.data.status) {
    v.status = parsed.data.status;
    salvarOmniDb(db);
  }
  if (parsed.data.reimprimir) imprimirComandaOmni(v, true);
  return NextResponse.json({ ok: true, venda: v });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = lerOmniDb();
  if (id) {
    const v = db.vendas.find(x => x.id === id);
    if (v) v.ocultoCozinha = true;
  } else {
    for (const v of db.vendas) {
      if (v.status === 'entregue' || v.status === 'pronto') v.ocultoCozinha = true;
    }
  }
  salvarOmniDb(db);
  return NextResponse.json({ ok: true });
}
