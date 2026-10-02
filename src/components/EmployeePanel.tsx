import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/utils';
import type { EmployeeImportResult, EmployeeSummary } from '@/types';

export function EmployeePanel() {
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);
  const [deactivateMissing, setDeactivateMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = () => api.employeeSummary().then(setSummary).catch(() => undefined);

  useEffect(() => {
    load();
  }, []);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (
      deactivateMissing &&
      !window.confirm('Pegawai yang tidak ada di file ini akan dinonaktifkan. Lanjutkan?')
    ) {
      return;
    }
    setBusy(true);
    try {
      setResult(await api.importEmployees(file, deactivateMissing));
      await load();
    } catch (err) {
      toast({ title: 'Impor gagal', description: errorMessage(err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-5 p-5">
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <h2 className="text-lg font-semibold">Master Pegawai dari SDM</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Opsional. Bila tersedia, peserta yang diimpor dengan NIP (atau nama yang unik) otomatis memakai nama &amp;
            unit resmi dari SDM, sehingga penulisan unit seragam dan pemenang minggu-minggu sebelumnya dapat dikenali.
            Format CSV: <code>nip,nama,unit</code>.
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-3xl font-semibold tabular-nums">{summary?.active ?? 0}</div>
          <div className="text-xs text-muted-foreground">
            pegawai aktif{summary && summary.total > summary.active && ` · ${summary.total - summary.active} nonaktif`}
          </div>
          {summary?.updated_at && (
            <div className="text-xs text-muted-foreground">diperbarui {summary.updated_at}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        <Button onClick={() => fileInput.current?.click()} disabled={busy}>
          <Upload className="mr-2 h-4 w-4" />
          Impor Master SDM (CSV)
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={deactivateMissing}
            onChange={(e) => setDeactivateMissing(e.target.checked)}
          />
          File ini daftar lengkap — nonaktifkan pegawai yang tidak tercantum
        </label>
      </div>

      {result && (
        <div className="rounded-md border bg-secondary/40 p-4 text-sm">
          <p>
            Baru: <b>{result.inserted}</b> · Diperbarui: <b>{result.updated}</b> · Dinonaktifkan:{' '}
            <b>{result.deactivated}</b> · Error: <b>{result.errors.length}</b>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-40 overflow-auto text-destructive">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
