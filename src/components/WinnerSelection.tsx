import { Trophy } from 'lucide-react';
import { Input } from './ui/input';

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
  function formatTotalWinnerNewValue(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = parseInt(e.target.value);

    // don't change the value if the input is:
    // - more than the total number of participants
    // - less than 1 (meaning 0 or negative numbers)
    if (
      (newValue > participantsCount) ||
      (newValue < 1)
    ) return;

    setPrizeCount(newValue);
  }

  if (adminControls) {
    return (
      <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <div className="font-medium text-lg">Jumlah Pemenang:</div>
        <Input
          value={prizeCount}
          onChange={formatTotalWinnerNewValue}
          type='number'
          min={0}
          max={participantsCount}
        />
      </div>
    );
  }

  return null;
}