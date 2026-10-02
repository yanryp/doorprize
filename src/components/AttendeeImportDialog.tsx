import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PreviewResult, RowStatus } from '@/types';

const STATUS_BADGE: Record<RowStatus, { label: string; className: string }> = {
  master: { label: 'Cocok NIP', className: 'bg-emerald-100 text-emerald-800' },
  matched_name: { label: 'Cocok nama', className: 'bg-sky-100 text-sky-800' },
  ok: { label: 'Tanpa NIP', className: 'bg-slate-100 text-slate-700' },
  nip_unknown: { label: 'NIP tak dikenal', className: 'bg-amber-100 text-amber-800' },
  duplicate_file: { label: 'Duplikat', className: 'bg-rose-100 text-rose-800' },
  duplicate_session: { label: 'Sudah terdaftar', className: 'bg-rose-100 text-rose-800' },
};

interface AttendeeImportDialogProps {
  preview: PreviewResult | null;
  existingCount: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (mode: 'merge' | 'replace') => void;
}

export function AttendeeImportDialog({
  preview,
  existingCount,
  busy,
  onCancel,
  onConfirm,
}: AttendeeImportDialogProps) {
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');

  const counts = useMemo(() => {
    const result: Partial<Record<RowStatus, number>> = {};
    for (const row of preview?.rows ?? []) result[row.status] = (result[row.status] ?? 0) + 1;
    return result;
  }, [preview]);

  if (!preview) return null;

  // In replace mode, rows flagged as "already registered" will be imported again.
  const importable = preview.rows.filter(
    (r) => !r.skip || (mode === 'replace' && r.status === 'duplicate_session'),
  ).length;

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Preview impor: {preview.filename}</DialogTitle>
          <DialogDescription>
            {preview.rows.length} baris terbaca · {importable} akan disimpan
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).map(([status, n]) => {
            const badge = STATUS_BADGE[status as RowStatus];
            return (
              <Badge key={status} variant="outline" className={badge.className}>
                {badge.label}: {n}
              </Badge>
            );
          })}
        </div>

        {preview.errors.length > 0 && (
          <div className="max-h-24 overflow-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {preview.errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}

        <div className="max-h-[45vh] overflow-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-white">
              <TableRow>
                <TableHead className="w-16">Baris</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.map((row, i) => {
                const badge = STATUS_BADGE[row.status];
                return (
                  <TableRow key={`${row.line}-${i}`} className={row.skip ? 'opacity-50' : ''}>
                    <TableCell>{row.line}</TableCell>
                    <TableCell className="font-mono text-xs">{row.nip ?? '—'}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className} title={row.message}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {existingCount > 0 && (
          <fieldset className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} />
              Tambahkan ke {existingCount} peserta yang sudah ada
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} />
              Ganti seluruh daftar peserta sesi ini
            </label>
          </fieldset>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Batal
          </Button>
          <Button
            onClick={() => onConfirm(mode)}
            disabled={busy || importable === 0}
            variant={mode === 'replace' ? 'destructive' : 'default'}
          >
            {mode === 'replace' ? 'Ganti Daftar' : 'Simpan'} ({importable})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
