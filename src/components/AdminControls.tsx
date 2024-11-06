import { Button } from '@/components/ui/button';
import { Download, Upload, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as api from '@/lib/api';

interface AdminControlsProps {
  onReload: () => Promise<void>;
}

export function AdminControls({ onReload }: AdminControlsProps) {
  const handleExportBackup = async () => {
    try {
      const backup = await api.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doorprize-backup-${backup.timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Backup Berhasil',
        description: 'Data telah berhasil di-export.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengexport data.',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const backup = JSON.parse(e.target?.result as string);
        await api.restoreBackup(backup);
        await onReload();
        
        toast({
          title: 'Restore Berhasil',
          description: 'Data telah berhasil di-restore.',
        });
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal merestore data.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <Button
        onClick={handleExportBackup}
        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export Database
      </Button>

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".json"
          onChange={handleRestoreBackup}
          className="hidden"
          id="backup-upload"
        />
        <Button
          onClick={() => document.getElementById('backup-upload')?.click()}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <Database className="w-4 h-4" />
          Restore Database
        </Button>
      </div>
    </div>
  );
}