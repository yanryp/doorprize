export interface Attendee {
  id: number;
  nip: string | null;
  name: string;
  unit: string;
  imported_at: string;
}

export interface SessionSummary {
  id: number;
  date: string;
  title: string;
  created_at: string;
  attendee_count: number;
  draw_id: number | null;
  winner_count: number | null;
  drawn_at: string | null;
}

export interface SessionDetail {
  id: number;
  date: string;
  title: string;
  created_at: string;
  draw_id: number | null;
  attendees: Attendee[];
}

export type RowStatus =
  | 'ok'
  | 'master'
  | 'matched_name'
  | 'nip_unknown'
  | 'duplicate_file'
  | 'duplicate_session';

export interface PreviewRow {
  line: number | null;
  nip: string | null;
  name: string;
  unit: string;
  status: RowStatus;
  message: string;
  skip: boolean;
}

export interface PreviewResult {
  filename: string;
  rows: PreviewRow[];
  errors: string[];
}

export interface ImportResult {
  mode: 'merge' | 'replace';
  inserted: number;
  skipped: number;
  removed: number;
  attendees: Attendee[];
}

export type WinnerStatus = 'pending' | 'claimed' | 'forfeited';

export interface Winner {
  rank: number;
  attendee_id: number;
  nip: string | null;
  name: string;
  unit: string;
  status: WinnerStatus;
  status_at: string | null;
}

export interface Draw {
  id: number;
  session_id: number;
  winner_count: number;
  exclude_recent_weeks: number;
  seed: string;
  eligible_hash: string;
  eligible_count: number;
  attendee_count: number;
  excluded_count: number;
  created_at: string;
  winners: Winner[];
}

export interface EmployeeSummary {
  total: number;
  active: number;
  updated_at: string | null;
}

export interface EmployeeImportResult {
  inserted: number;
  updated: number;
  deactivated: number;
  errors: string[];
}

export interface AuditEntry {
  id: number;
  ts: string;
  actor: string;
  client_ip: string | null;
  action: string;
  detail: Record<string, unknown>;
}
