import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Participant } from '@/types';

interface CSVImportProps {
  onImport: (participants: Participant[], merge?: boolean) => void;
  onClear: () => void;
  participantCount: number;
}

export function CSVImport({ onImport, onClear, participantCount }: CSVImportProps) {
  const [previewData, setPreviewData] = useState<Participant[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergeData, setMergeData] = useState(true);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const [headers, ...rows] = text.split('\n');
        
        // Validate headers
        const expectedHeaders = ['nama', 'unit'].join(',').toLowerCase();
        if (headers.toLowerCase().trim() !== expectedHeaders) {
          setError('Format CSV tidak valid. Kolom harus: nama,unit');
          return;
        }

        const participants = rows
          .filter(row => row.trim())
          .map(row => {
            const [name, unit] = row.split(',').map(val => 
              val.replace(/^"|"$/g, '').trim()
            );
            if (!name || !unit) throw new Error('Data tidak lengkap');
            return { id: crypto.randomUUID(), name, unit };
          });

        setError(null);
        setPreviewData(participants);
        setShowPreview(true);
      } catch (error) {
        setError('Gagal membaca file CSV. Pastikan format sesuai template.');
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = 'nama,unit\nJohn Doe,IT\nJane Smith,HR';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-peserta-doorprize.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const confirmImport = () => {
    onImport(previewData, mergeData);
    setShowPreview(false);
    setPreviewData([]);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="flex items-center gap-2 lg:col-span-3"
        >
          <Download className="w-4 h-4" />
          Unduh Template CSV
        </Button>

        <div className="lg:col-span-6">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <Button
            onClick={() => document.getElementById('csv-upload')?.click()}
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2 justify-center"
          >
            <Upload className="w-4 h-4" />
            Impor Data Peserta (CSV)
          </Button>
        </div>

        {participantCount > 0 && (
          <Button
            onClick={onClear}
            variant="destructive"
            className="flex items-center gap-2 lg:col-span-3"
          >
            <AlertCircle className="w-4 h-4" />
            Hapus Semua Data
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview Data Peserta</DialogTitle>
            <DialogDescription>
              {previewData.length} peserta akan {mergeData ? 'ditambahkan' : 'menggantikan data lama'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="merge"
                checked={mergeData}
                onChange={(e) => setMergeData(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="merge">
                Gabungkan dengan data yang sudah ada
              </label>
            </div>

            <div className="space-y-2">
              {previewData.map((p) => (
                <div key={p.id} className="p-2 bg-secondary rounded-lg">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.unit}</div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Batal
            </Button>
            <Button onClick={confirmImport}>
              {mergeData ? 'Gabungkan' : 'Ganti'} Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}