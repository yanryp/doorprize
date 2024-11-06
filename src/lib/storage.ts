import type { Participant } from '@/types';

const STORAGE_KEY = 'doorprize_participants';

export function getParticipants(): Participant[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveParticipants(participants: Participant[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
}

export function clearParticipants(): void {
  localStorage.removeItem(STORAGE_KEY);
}