import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WinnerTable } from '@/components/WinnerTable';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/utils';
import type { Draw, SessionSummary } from '@/types';

interface HistoryPanelProps {
  sessions: SessionSummary[];
  onChanged: () => void;
}

export function HistoryPanel({ sessions, onChanged }: HistoryPanelProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [draw, setDraw] = useState<Draw | null>(null);

  useEffect(() => {
    if (selected === null) return;
    setDraw(null);
    api
      .draw(selected)
      .then(setDraw)
      .catch((err) => toast({ title: 'Gagal memuat undian', description: errorMessage(err), variant: 'destructive' }));
  }, [selected]);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold">Riwayat Sesi</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada sesi.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Acara</TableHead>
                  <TableHead className="text-right">Peserta</TableHead>
                  <TableHead className="text-right">Pemenang</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow
                    key={s.id}
                    className={`${s.draw_id ? 'cursor-pointer' : ''} ${selected === s.id ? 'bg-secondary' : ''}`}
                    onClick={() => s.draw_id && setSelected(s.id)}
                  >
                    <TableCell className="font-medium">{s.date}</TableCell>
                    <TableCell>{s.title}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.attendee_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.winner_count ?? '—'}</TableCell>
                    <TableCell>
                      {s.draw_id ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                          Sudah diundi
                        </Badge>
                      ) : (
                        <Badge variant="outline">Belum diundi</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {draw && (
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">
            Pemenang {sessions.find((s) => s.id === draw.session_id)?.date}
          </h3>
          <WinnerTable draw={draw} onChange={(d) => { setDraw(d); onChanged(); }} />
        </Card>
      )}
    </div>
  );
}
