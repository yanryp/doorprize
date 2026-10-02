import { useCallback, useEffect, useState } from 'react';
import { CalendarPlus, Gift, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SessionPanel } from '@/components/SessionPanel';
import { EmployeePanel } from '@/components/EmployeePanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AuditPanel } from '@/components/AuditPanel';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { errorMessage, formatDate, todayISO } from '@/lib/utils';
import type { SessionSummary } from '@/types';

interface AdminPageProps {
  onLogout: () => void;
}

export function AdminPage({ onLogout }: AdminPageProps) {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState(todayISO());
  const [newTitle, setNewTitle] = useState('Ibadah Oikumene');
  const [tab, setTab] = useState('peserta');

  const loadSessions = useCallback(async () => {
    try {
      const list = await api.sessions();
      setSessions(list);
      setSelectedId((current) => {
        if (current && list.some((s) => s.id === current)) return current;
        return list.find((s) => s.date === todayISO())?.id ?? list[0]?.id ?? null;
      });
    } catch (err) {
      toast({ title: 'Gagal memuat sesi', description: errorMessage(err), variant: 'destructive' });
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createSession = async () => {
    try {
      const created = await api.createSession(newDate, newTitle.trim() || 'Ibadah Oikumene');
      await loadSessions();
      setSelectedId(created.id);
      setTab('peserta');
      toast({ title: 'Sesi dibuat', description: formatDate(created.date) });
    } catch (err) {
      toast({ title: 'Gagal membuat sesi', description: errorMessage(err), variant: 'destructive' });
    }
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    onLogout();
  };

  const selected = sessions?.find((s) => s.id === selectedId) ?? null;
  const hasToday = sessions?.some((s) => s.date === todayISO()) ?? false;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Gift className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h1 className="font-semibold leading-tight">Doorprize Ibadah Oikumene</h1>
              <p className="text-xs text-muted-foreground">Panel Admin</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {sessions && sessions.length > 0 && (
              <select
                aria-label="Pilih sesi"
                className="h-9 rounded-md border bg-white px-3 text-sm"
                value={selectedId ?? ''}
                onChange={(e) => setSelectedId(Number(e.target.value))}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} · {s.title}
                    {s.draw_id ? ' (sudah diundi)' : ''}
                  </option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {sessions && !hasToday && (
          <Card className="flex flex-wrap items-end gap-4 border-dashed p-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-date">Tanggal ibadah</Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="min-w-[16rem] flex-1 space-y-1.5">
              <Label htmlFor="new-title">Nama acara</Label>
              <Input id="new-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <Button onClick={createSession} disabled={!newDate}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Buat Sesi
            </Button>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="peserta">Peserta &amp; Undian</TabsTrigger>
            <TabsTrigger value="pegawai">Data Pegawai (SDM)</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
            <TabsTrigger value="audit">Log Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="peserta" className="mt-4">
            {selected ? (
              <SessionPanel key={selected.id} sessionId={selected.id} onChanged={loadSessions} />
            ) : (
              <Card className="p-10 text-center text-muted-foreground">
                Belum ada sesi. Buat sesi untuk ibadah hari ini terlebih dahulu.
              </Card>
            )}
          </TabsContent>
          <TabsContent value="pegawai" className="mt-4">
            <EmployeePanel />
          </TabsContent>
          <TabsContent value="riwayat" className="mt-4">
            <HistoryPanel sessions={sessions ?? []} onChanged={loadSessions} />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            {tab === 'audit' && <AuditPanel />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
