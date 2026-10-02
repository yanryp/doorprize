import { useState } from 'react';
import { CheckCircle2, Download, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/utils';
import type { Draw, WinnerStatus } from '@/types';

const STATUS: Record<WinnerStatus, { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-slate-100 text-slate-700' },
  claimed: { label: 'Diambil', className: 'bg-emerald-100 text-emerald-800' },
  forfeited: { label: 'Hangus', className: 'bg-rose-100 text-rose-800' },
};

interface WinnerTableProps {
  draw: Draw;
  onChange: (draw: Draw) => void;
}

export function WinnerTable({ draw, onChange }: WinnerTableProps) {
  const [busyRank, setBusyRank] = useState<number | null>(null);

  const setStatus = async (rank: number, status: WinnerStatus) => {
    setBusyRank(rank);
    try {
      onChange(await api.setWinnerStatus(draw.id, rank, status));
    } catch (err) {
      toast({ title: 'Gagal mengubah status', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setBusyRank(null);
    }
  };

  const verify = async () => {
    try {
      const result = await api.verifyDraw(draw.id);
      toast(
        result.valid
          ? { title: 'Undian terverifikasi', description: 'Hasil cocok dengan daftar peserta & seed tersimpan.' }
          : { title: 'Verifikasi GAGAL', description: 'Data undian tidak konsisten.', variant: 'destructive' },
      );
    } catch (err) {
      toast({ title: 'Gagal verifikasi', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const claimed = draw.winners.filter((w) => w.status === 'claimed').length;
  const forfeited = draw.winners.filter((w) => w.status === 'forfeited').length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>Diundi: {draw.created_at}</span>
        <span>
          Peserta: {draw.attendee_count}
          {draw.excluded_count > 0 && ` (${draw.excluded_count} dikecualikan, pemenang ${draw.exclude_recent_weeks} minggu terakhir)`}
        </span>
        <span>
          Diambil {claimed} · Hangus {forfeited} · Menunggu {draw.winners.length - claimed - forfeited}
        </span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={verify}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verifikasi
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={api.exportUrl(draw.id)}>
              <Download className="mr-2 h-4 w-4" />
              Unduh CSV
            </a>
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draw.winners.map((w) => (
              <TableRow key={w.rank}>
                <TableCell>{w.rank}</TableCell>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell className="font-mono text-xs">{w.nip ?? '—'}</TableCell>
                <TableCell>{w.unit}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS[w.status].className}>
                    {STATUS[w.status].label}
                  </Badge>
                  {w.status_at && <span className="ml-2 text-xs text-muted-foreground">{w.status_at}</span>}
                </TableCell>
                <TableCell className="space-x-1 text-right">
                  {w.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        disabled={busyRank === w.rank}
                        onClick={() => setStatus(w.rank, 'claimed')}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Diambil
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        disabled={busyRank === w.rank}
                        onClick={() => setStatus(w.rank, 'forfeited')}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Hangus
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyRank === w.rank}
                      onClick={() => setStatus(w.rank, 'pending')}
                      title="Koreksi status (tercatat di log audit)"
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Koreksi
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
