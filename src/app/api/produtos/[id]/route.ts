import { NextResponse } from 'next/server';
import { ProdutoUpdateSchema } from '@/lib/schemas';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = ProdutoUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: parsed.error.flatten() }, { status: 400 });
  }
  const db = lerOmniDb();
  const prod = db.produtos.find(p => p.id === Number(id));
  if (!prod) {
    return NextResponse.json({ ok: false, erro: 'Produto não encontrado' }, { status: 404 });
  }
  Object.assign(prod, parsed.data);
  salvarOmniDb(db);
  return NextResponse.json({ ok: true, produto: prod });
}
