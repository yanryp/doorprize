import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Participant } from '@/types';

interface ParticipantFormProps {
  onAddParticipant: (name: string, unit: string) => void;
  participants: Participant[];
}

export function ParticipantForm({ onAddParticipant, participants }: ParticipantFormProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !unit) {
      toast({
        title: 'Error',
        description: 'Tolong isi semua kolom yang tersedia',
        variant: 'destructive',
      });
      return;
    }

    const participantList = Array.isArray(participants) ? participants : [];
    
    const isDuplicate = participantList.some(
      (p) => p.name.toLowerCase() === name.toLowerCase() && 
             p.unit.toLowerCase() === unit.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: 'Error',
        description: 'Anda sudah terdaftar untuk doorprize!',
        variant: 'destructive',
      });
      return;
    }

    onAddParticipant(name, unit);
    setName('');
    setUnit('');
  };

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-lg border-none">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 md:w-6 md:h-6" />
        Daftar untuk Ikut
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-base md:text-lg">Nama Lengkap</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/20 h-12 text-lg md:text-xl mt-1"
            placeholder="Masukkan nama lengkap"
          />
        </div>
        <div>
          <Label htmlFor="unit" className="text-base md:text-lg">Unit Kerja</Label>
          <Input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="bg-white/20 h-12 text-lg md:text-xl mt-1"
            placeholder="Masukkan unit kerja"
          />
        </div>
        <Button 
          type="submit"
          className="w-full h-14 text-lg md:text-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          Ikut Doorprize
        </Button>
      </form>
    </Card>
  );
}