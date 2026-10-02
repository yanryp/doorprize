import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, Lock, MonitorPlay, Search, Trash2, Upload, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AttendeeImportDialog } from '@/components/AttendeeImportDialog';
import { WinnerTable } from '@/components/WinnerTable';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { errorMessage, formatDate } from '@/lib/utils';
import type { Draw, PreviewResult, SessionDetail } from '@/types';

interface SessionPanelProps {
  sessionId: number;
  onChanged: () => void;
}

const TEMPLATE = 'nip,nama,unit\n12345,Budi Santoso,Divisi TI\n,Tamu Tanpa NIP,Outsourcing\n';

export function SessionPanel({ sessionId, onChanged }: SessionPanelProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const detail = await api.session(sessionId);
      setSession(detail);
      setDraw(detail.draw_id ? await api.draw(sessionId) : null);
    } catch (err) {
      toast({ title: 'Gagal memuat sesi', description: errorMessage(err), variant: 'destructive' });
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    // Pick up a draw started from the projector window.
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const unitStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of session?.attendees ?? []) counts.set(a.unit, (counts.get(a.unit) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [session]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = session?.attendees ?? [];
    if (!q) return list;
    return list.filter(
      (a) => a.name.toLowerCase().includes(q) || a.unit.toLowerCase().includes(q) || a.nip?.includes(q),
    );
  }, [session, query]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      setPreview(await api.previewAttendees(sessionId, file));
    } catch (err) {
      toast({ title: 'File tidak dapat dibaca', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const confirmImport = async (mode: 'merge' | 'replace') => {
    if (!preview) return;
    setBusy(true);
    try {
      const result = await api.importAttendees(sessionId, preview.rows, mode, preview.filename);
      setSession((s) => (s ? { ...s, attendees: result.attendees } : s));
      setPreview(null);
      onChanged();
      toast({
        title: 'Impor berhasil',
        description: `${result.inserted} peserta disimpan${result.skipped ? `, ${result.skipped} dilewati` : ''}.`,
      });
    } catch (err) {
      toast({ title: 'Impor gagal', description: errorMessage(err), variant: 'destructive' });
      if (err instanceof ApiError && err.status === 409) load();
    } finally {
      setBusy(false);
    }
  };

  const removeAttendee = async (id: number, name: string) => {
    if (!window.confirm(`Hapus ${name} dari daftar peserta?`)) return;
    try {
      const result = await api.deleteAttendee(sessionId, id);
      setSession((s) => (s ? { ...s, attendees: result.attendees } : s));
      onChanged();
    } catch (err) {
      toast({ title: 'Gagal menghapus', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Hapus SEMUA peserta sesi ini?')) return;
    try {
      await api.clearAttendees(sessionId);
      setSession((s) => (s ? { ...s, attendees: [] } : s));
      onChanged();
    } catch (err) {
      toast({ title: 'Gagal menghapus', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(['﻿' + TEMPLATE], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-peserta.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openProjector = () => {
    window.open(`${window.location.pathname}#/display/${sessionId}`, 'doorprize-projector', 'popup');
  };

  if (!session) return null;
  const locked = draw !== null;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">{session.title}</h2>
            <p className="text-sm text-muted-foreground">{formatDate(session.date)}</p>
          </div>
          <div className="ml-6 flex items-center gap-2 text-2xl font-semibold">
            <Users className="h-6 w-6 text-primary" />
            {session.attendees.length}
            <span className="text-sm font-normal text-muted-foreground">peserta</span>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {!locked && (
              <>
                <Button variant="outline" onClick={downloadTemplate}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Template CSV
                </Button>
                <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
                <Button onClick={() => fileInput.current?.click()} disabled={busy}>
                  <Upload className="mr-2 h-4 w-4" />
                  Impor Peserta (CSV)
                </Button>
              </>
            )}
            <Button
              onClick={openProjector}
              disabled={session.attendees.length === 0 && !locked}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <MonitorPlay className="mr-2 h-4 w-4" />
              Buka Layar Proyektor
            </Button>
          </div>
        </div>
        {locked && (
          <Alert className="mt-4 border-amber-300 bg-amber-50">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Undian sesi ini sudah dilakukan. Daftar peserta terkunci dan tidak dapat diubah.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {draw && (
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Hasil Undian</h3>
          <WinnerTable draw={draw} onChange={(d) => { setDraw(d); onChanged(); }} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <h3 className="font-semibold">Daftar Peserta</h3>
            <div className="relative ml-auto w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIP, unit…"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {!locked && session.attendees.length > 0 && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={clearAll}>
                Hapus semua
              </Button>
            )}
          </div>
          {session.attendees.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              Belum ada peserta. Impor file CSV daftar hadir (kolom: <code>nama,unit</code> atau{' '}
              <code>nip,nama,unit</code>).
            </p>
          ) : (
            <div className="max-h-[32rem] overflow-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Unit</TableHead>
                    {!locked && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="font-mono text-xs">{a.nip ?? '—'}</TableCell>
                      <TableCell>{a.unit}</TableCell>
                      {!locked && (
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Hapus ${a.name}`}
                            onClick={() => removeAttendee(a.id, a.name)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Per Unit</h3>
          {unitStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="max-h-[32rem] space-y-2 overflow-auto text-sm">
              {unitStats.map(([unit, n]) => (
                <li key={unit}>
                  <div className="flex justify-between">
                    <span className="truncate pr-2">{unit}</span>
                    <span className="font-medium tabular-nums">{n}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-secondary">
                    <div
                      className="h-1.5 rounded bg-primary"
                      style={{ width: `${(n / session.attendees.length) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AttendeeImportDialog
        key={preview?.filename ?? 'none'}
        preview={preview}
        existingCount={session.attendees.length}
        busy={busy}
        onCancel={() => setPreview(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}
