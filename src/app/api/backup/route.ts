import { NextResponse } from 'next/server';
import { gerarBackupExterno, getBackupDir, listarBackupsExternos } from '@/lib/backup';

export async function GET() {
  return NextResponse.json({
    ok: true,
    pasta: getBackupDir(),
    backups: listarBackupsExternos()
  });
}

export async function POST() {
  const res = gerarBackupExterno('manual');
  return NextResponse.json(
    {
      ...res,
      backups: listarBackupsExternos()
    },
    { status: res.ok ? 201 : 400 }
  );
}
