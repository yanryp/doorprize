import { db } from './db';
import type { Participant } from '@/types';

export async function getParticipants(): Promise<Participant[]> {
  const result = await db.execute('SELECT * FROM participants ORDER BY created_at DESC');
  return result.rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    unit: row.unit as string
  }));
}

export async function addParticipant(participant: Participant): Promise<void> {
  await db.execute({
    sql: 'INSERT INTO participants (id, name, unit) VALUES (?, ?, ?)',
    args: [participant.id, participant.name, participant.unit]
  });
}

export async function importParticipants(participants: Participant[]): Promise<void> {
  const tx = db.transaction();
  try {
    for (const participant of participants) {
      await tx.execute({
        sql: 'INSERT OR REPLACE INTO participants (id, name, unit) VALUES (?, ?, ?)',
        args: [participant.id, participant.name, participant.unit]
      });
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function clearParticipants(): Promise<void> {
  await db.execute('DELETE FROM participants');
}