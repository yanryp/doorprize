import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/utils';
import type { AuditEntry } from '@/types';

const ACTION_LABEL: Record<string, string> = {
  login: 'Login',
  login_failed: 'Login gagal',
  logout: 'Logout',
  password_set: 'Password diatur',
  session_create: 'Buat sesi',
  employees_import: 'Impor master SDM',
  attendees_import: 'Impor peserta',
  attendee_delete: 'Hapus peserta',
  attendees_clear: 'Hapus semua peserta',
  draw: 'Undian',
  winner_status: 'Status pemenang',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  claimed: 'Diambil',
  forfeited: 'Hangus',
};

function summarize(entry: AuditEntry): string {
  const d = entry.detail;
  switch (entry.action) {
    case 'draw':
      return `Sesi ${d.date}: ${d.winner_count} pemenang dari ${d.eligible_count} peserta`;
    case 'winner_status':
      return `#${d.rank} ${d.name}: ${STATUS_LABEL[String(d.from)]} → ${STATUS_LABEL[String(d.to)]}`;
    case 'attendees_import':
      return `${d.filename ?? ''} · ${d.mode} · +${d.inserted}, dilewati ${d.skipped}, dihapus ${d.removed}`;
    case 'attendee_delete':
      return `${d.name} (${d.unit})`;
    case 'employees_import':
      return `${d.filename ?? ''} · baru ${d.inserted}, update ${d.updated}, nonaktif ${d.deactivated}`;
    case 'session_create':
      return `${d.date} · ${d.title}`;
    default:
      return Object.keys(d).length ? JSON.stringify(d) : '';
  }
}

export function AuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    api
      .audit(300)
      .then(setEntries)
      .catch((err) => toast({ title: 'Gagal memuat log', description: errorMessage(err), variant: 'destructive' }));
  }, []);

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg font-semibold">Log Audit</h2>
      <div className="max-h-[36rem] overflow-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead className="w-44">Waktu</TableHead>
              <TableHead className="w-44">Aksi</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap font-mono text-xs">{e.ts}</TableCell>
                <TableCell>{ACTION_LABEL[e.action] ?? e.action}</TableCell>
                <TableCell className="text-sm">{summarize(e)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
