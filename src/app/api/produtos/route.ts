import { NextResponse } from 'next/server';
import { ProdutoCreateSchema } from '@/lib/schemas';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';
import { logger } from '@/lib/logger';

export async function GET() {
  const db = lerOmniDb();
  return NextResponse.json({ ok: true, produtos: db.produtos });
}

export async function POST(req: Request) {
  const parsed = ProdutoCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: parsed.error.flatten() }, { status: 400 });
  }
  const db = lerOmniDb();
  const nextId = db.produtos.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  const novo = { id: nextId, ...parsed.data };
  db.produtos.push(novo);
  salvarOmniDb(db);
  logger.info({ produtoId: novo.id }, 'Produto cadastrado no Omni-OS');
  return NextResponse.json({ ok: true, produto: novo }, { status: 201 });
}
