import { useState, useEffect } from 'react';
import type { Participant } from '@/types';
import { toast } from '@/hooks/use-toast';
import * as storage from '@/lib/storage';

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = () => {
    try {
      const data = storage.getParticipants();
      setParticipants(data);
    } catch (error) {
      console.error('Failed to load participants:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data peserta.',
        variant: 'destructive',
      });
    }
  };

  const addParticipant = (name: string, unit: string) => {
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      name,
      unit
    };

    try {
      const updatedParticipants = [...participants, newParticipant];
      storage.saveParticipants(updatedParticipants);
      setParticipants(updatedParticipants);
      toast({
        title: 'Berhasil',
        description: 'Anda telah terdaftar untuk doorprize!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mendaftar. Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const importParticipants = (newParticipants: Participant[], merge = true) => {
    try {
      const updatedParticipants = merge 
        ? [...participants, ...newParticipants]
        : newParticipants;
      
      storage.saveParticipants(updatedParticipants);
      setParticipants(updatedParticipants);
      
      toast({
        title: 'Berhasil',
        description: `${newParticipants.length} peserta telah ${merge ? 'ditambahkan' : 'diimpor'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengimpor data peserta.',
        variant: 'destructive',
      });
    }
  };

  const clearParticipants = () => {
    try {
      storage.clearParticipants();
      setParticipants([]);
      toast({
        title: 'Data Dihapus',
        description: 'Semua data peserta telah dihapus.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus data peserta.',
        variant: 'destructive',
      });
    }
  };

  return {
    participants,
    addParticipant,
    importParticipants,
    clearParticipants,
  };
}