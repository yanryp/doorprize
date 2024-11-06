import { Trophy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WinnerSelectionProps {
  participantsCount: number;
  prizeCount: number;
  setPrizeCount: (count: number) => void;
  onSelectWinners: () => void;
  isSelecting: boolean;
  showMode: boolean;
  adminControls?: boolean;
}

export function WinnerSelection({
  participantsCount,
  prizeCount,
  setPrizeCount,
  adminControls = false,
}: WinnerSelectionProps) {
  const prizeOptions = Array.from({ length: Math.min(10, participantsCount || 10) }, (_, i) => i + 1);

  if (adminControls) {
    return (
      <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <div className="font-medium text-lg">Jumlah Pemenang:</div>
        <Select
          value={prizeCount.toString()}
          onValueChange={(value) => setPrizeCount(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Jumlah" />
          </SelectTrigger>
          <SelectContent>
            {prizeOptions.map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} Pemenang
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
}