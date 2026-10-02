import type {
  Attendee,
  AuditEntry,
  Draw,
  EmployeeImportResult,
  EmployeeSummary,
  ImportResult,
  PreviewResult,
  PreviewRow,
  SessionDetail,
  SessionSummary,
  WinnerStatus,
} from '@/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Fired on any 401 so the app can drop back to the login screen. */
export const UNAUTHORIZED_EVENT = 'doorprize:unauthorized';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'Server tidak dapat dihubungi. Pastikan start.bat masih berjalan.');
  }
  if (!res.ok) {
    let message = `Kesalahan ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') message = body.detail;
      else if (Array.isArray(body.detail)) message = body.detail.map((d: { msg: string }) => d.msg).join('; ');
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

function fileForm(file: File, extra: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.append('file', file);
  for (const [key, value] of Object.entries(extra)) form.append(key, value);
  return form;
}

export const api = {
  me: () => request<{ authenticated: boolean; password_set: boolean }>('/api/auth/me'),
  login: (password: string) =>
    request<{ authenticated: boolean }>('/api/auth/login', { method: 'POST', body: json({ password }) }),
  logout: () => request<{ authenticated: boolean }>('/api/auth/logout', { method: 'POST' }),

  employeeSummary: () => request<EmployeeSummary>('/api/employees/summary'),
  importEmployees: (file: File, deactivateMissing: boolean) =>
    request<EmployeeImportResult>('/api/employees/import', {
      method: 'POST',
      body: fileForm(file, { deactivate_missing: String(deactivateMissing) }),
    }),

  sessions: () => request<SessionSummary[]>('/api/sessions'),
  createSession: (date: string, title: string) =>
    request<SessionSummary>('/api/sessions', { method: 'POST', body: json({ date, title }) }),
  session: (id: number) => request<SessionDetail>(`/api/sessions/${id}`),
  previewAttendees: (id: number, file: File) =>
    request<PreviewResult>(`/api/sessions/${id}/attendees/preview`, {
      method: 'POST',
      body: fileForm(file),
    }),
  importAttendees: (id: number, rows: PreviewRow[], mode: 'merge' | 'replace', filename: string) =>
    request<ImportResult>(`/api/sessions/${id}/attendees/import`, {
      method: 'POST',
      body: json({
        mode,
        filename,
        rows: rows.map(({ line, nip, name, unit }) => ({ line, nip, name, unit })),
      }),
    }),
  deleteAttendee: (sessionId: number, attendeeId: number) =>
    request<{ attendees: Attendee[] }>(`/api/sessions/${sessionId}/attendees/${attendeeId}`, {
      method: 'DELETE',
    }),
  clearAttendees: (sessionId: number) =>
    request<{ attendees: Attendee[] }>(`/api/sessions/${sessionId}/attendees`, { method: 'DELETE' }),

  draw: (sessionId: number) => request<Draw>(`/api/sessions/${sessionId}/draw`),
  eligibleCount: (sessionId: number, excludeWeeks: number) =>
    request<{ attendee_count: number; eligible_count: number }>(
      `/api/sessions/${sessionId}/draw/eligible-count?exclude_recent_weeks=${excludeWeeks}`,
    ),
  runDraw: (sessionId: number, winnerCount: number, excludeWeeks: number) =>
    request<Draw>(`/api/sessions/${sessionId}/draw`, {
      method: 'POST',
      body: json({ winner_count: winnerCount, exclude_recent_weeks: excludeWeeks }),
    }),
  setWinnerStatus: (drawId: number, rank: number, status: WinnerStatus) =>
    request<Draw>(`/api/draws/${drawId}/winners/${rank}`, { method: 'PATCH', body: json({ status }) }),
  verifyDraw: (drawId: number) =>
    request<{ valid: boolean; hash_ok: boolean; winners_match: boolean }>(`/api/draws/${drawId}/verify`),
  exportUrl: (drawId: number) => `/api/draws/${drawId}/export.csv`,

  audit: (limit = 200) => request<AuditEntry[]>(`/api/audit?limit=${limit}`),
};
