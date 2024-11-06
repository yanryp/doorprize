import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Participant } from '@/types';

interface ExportButtonProps {
  winners: Participant[];
}

export function ExportButton({ winners }: ExportButtonProps) {
  if (winners.length === 0) return null;

  const exportWinners = () => {
    const data = winners.map((w, i) => `${i + 1}. ${w.name} (${w.unit})`).join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daftar-pemenang-doorprize.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 flex justify-center"
    >
      <Button
        onClick={exportWinners}
        className="bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Unduh Daftar Pemenang
      </Button>
    </motion.div>
  );
}