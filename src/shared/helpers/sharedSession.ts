import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { LoginResponse } from '../../api/models/auth';

export const API_BASE_URL = 'http://127.0.0.1:3001';

/** Sessions created once by global-setup.ts. The file lives in /playwright/.auth/, which .gitignore already excludes. */
export interface SharedSessions {
  customer: LoginResponse;
  adminAccessToken: string;
}

export const SHARED_SESSIONS_FILE = resolve(__dirname, '..', '..', '..', 'playwright', '.auth', 'shared-sessions.json');

export function saveSharedSessions(sessions: SharedSessions): void {
  mkdirSync(dirname(SHARED_SESSIONS_FILE), { recursive: true });
  writeFileSync(SHARED_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export function loadSharedSessions(): SharedSessions {
  try {
    return JSON.parse(readFileSync(SHARED_SESSIONS_FILE, 'utf-8')) as SharedSessions;
  } catch {
    throw new Error(`Shared sessions not found at ${SHARED_SESSIONS_FILE}. Is globalSetup configured?`);
  }
}
