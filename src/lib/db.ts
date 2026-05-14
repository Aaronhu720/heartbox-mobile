import initSqlJs, { type Database } from 'sql.js';

let db: Database | null = null;
const DB_KEY = 'halfdiary-db';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      pin_hash TEXT NOT NULL,
      email TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS privacy_lock (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diary_entry (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood_tag TEXT NOT NULL,
      mood_score INTEGER NOT NULL,
      wants_to_contact INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheduled_letter (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      diary_entry_id TEXT UNIQUE NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_email TEXT DEFAULT '',
      recipient_phone TEXT,
      delivery_method TEXT DEFAULT 'email',
      scheduled_at TEXT NOT NULL,
      require_confirmation INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft',
      sent_at TEXT,
      cancelled_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS future_self_letter (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      diary_entry_id TEXT UNIQUE NOT NULL,
      unlock_at TEXT NOT NULL,
      is_unlocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(DB_KEY, base64);
}

// ============ Auth ============

export async function hasUser(): Promise<boolean> {
  const d = await getDb();
  const result = d.exec('SELECT COUNT(*) as c FROM user');
  return result.length > 0 && result[0].values[0][0] as number > 0;
}

export async function createUser(pin: string, email: string = ''): Promise<string> {
  const d = await getDb();
  const id = generateId();
  const pinHash = await hashPin(pin);
  d.run('INSERT INTO user (id, pin_hash, email) VALUES (?, ?, ?)', [id, pinHash, email]);
  saveDb();
  return id;
}

export async function verifyPin(pin: string): Promise<string | null> {
  const d = await getDb();
  const result = d.exec('SELECT id, pin_hash FROM user LIMIT 1');
  if (result.length === 0 || result[0].values.length === 0) return null;
  const [id, pinHash] = result[0].values[0] as [string, string];
  const valid = await checkPin(pin, pinHash);
  return valid ? id : null;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'halfdiary-salt-2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPin(pin: string, hash: string): Promise<boolean> {
  const computed = await hashPin(pin);
  return computed === hash;
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const userId = await verifyPin(currentPin);
  if (!userId) return false;
  const d = await getDb();
  const newHash = await hashPin(newPin);
  d.run('UPDATE user SET pin_hash = ? WHERE id = ?', [newHash, userId]);
  saveDb();
  return true;
}

export async function getUserEmail(): Promise<string> {
  const d = await getDb();
  const result = d.exec('SELECT email FROM user LIMIT 1');
  if (result.length === 0 || result[0].values.length === 0) return '';
  return (result[0].values[0][0] as string) || '';
}

// ============ Privacy Lock ============

export async function hasPrivacyLock(userId: string): Promise<boolean> {
  const d = await getDb();
  const result = d.exec('SELECT COUNT(*) FROM privacy_lock WHERE user_id = ?', [userId]);
  return result.length > 0 && (result[0].values[0][0] as number) > 0;
}

export async function setPrivacyLock(userId: string, password: string): Promise<void> {
  const d = await getDb();
  const hash = await hashPin(password);
  const existing = d.exec('SELECT id FROM privacy_lock WHERE user_id = ?', [userId]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    d.run('UPDATE privacy_lock SET password_hash = ?, updated_at = datetime("now") WHERE user_id = ?', [hash, userId]);
  } else {
    d.run('INSERT INTO privacy_lock (id, user_id, password_hash) VALUES (?, ?, ?)', [generateId(), userId, hash]);
  }
  saveDb();
}

export async function verifyPrivacyLock(userId: string, password: string): Promise<boolean> {
  const d = await getDb();
  const result = d.exec('SELECT password_hash FROM privacy_lock WHERE user_id = ?', [userId]);
  if (result.length === 0 || result[0].values.length === 0) return false;
  return checkPin(password, result[0].values[0][0] as string);
}

// ============ Diary Entries ============

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  moodTag: string;
  moodScore: number;
  wantsToContact: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getEntries(userId: string, opts?: {
  limit?: number;
  page?: number;
  month?: string;
}): Promise<{ entries: DiaryEntry[]; total: number }> {
  const d = await getDb();
  const limit = opts?.limit || 20;
  const page = opts?.page || 1;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE user_id = ?';
  const params: (string | number)[] = [userId];

  if (opts?.month) {
    whereClause += ' AND strftime("%Y-%m", created_at) = ?';
    params.push(opts.month);
  }

  const countResult = d.exec(`SELECT COUNT(*) FROM diary_entry ${whereClause}`, params);
  const total = countResult.length > 0 ? countResult[0].values[0][0] as number : 0;

  const result = d.exec(
    `SELECT * FROM diary_entry ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const entries: DiaryEntry[] = result.length > 0 ? result[0].values.map(row => ({
    id: row[0] as string,
    userId: row[1] as string,
    title: row[2] as string,
    content: row[3] as string,
    moodTag: row[4] as string,
    moodScore: row[5] as number,
    wantsToContact: !!(row[6] as number),
    isLocked: !!(row[7] as number),
    createdAt: row[8] as string,
    updatedAt: row[9] as string,
  })) : [];

  return { entries, total };
}

export async function getEntry(userId: string, id: string): Promise<DiaryEntry | null> {
  const d = await getDb();
  const result = d.exec('SELECT * FROM diary_entry WHERE id = ? AND user_id = ?', [id, userId]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0] as string,
    userId: row[1] as string,
    title: row[2] as string,
    content: row[3] as string,
    moodTag: row[4] as string,
    moodScore: row[5] as number,
    wantsToContact: !!(row[6] as number),
    isLocked: !!(row[7] as number),
    createdAt: row[8] as string,
    updatedAt: row[9] as string,
  };
}

export async function createEntry(userId: string, data: {
  title: string;
  content: string;
  moodTag: string;
  moodScore: number;
  wantsToContact: boolean;
}): Promise<DiaryEntry> {
  const d = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  d.run(
    'INSERT INTO diary_entry (id, user_id, title, content, mood_tag, mood_score, wants_to_contact, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, data.title, data.content, data.moodTag, Math.min(10, Math.max(1, data.moodScore)), data.wantsToContact ? 1 : 0, now, now]
  );
  saveDb();
  return { id, userId, ...data, isLocked: false, createdAt: now, updatedAt: now };
}

export async function updateEntry(userId: string, id: string, data: Partial<{
  title: string;
  content: string;
  moodTag: string;
  moodScore: number;
  wantsToContact: boolean;
}>): Promise<boolean> {
  const d = await getDb();
  const existing = await getEntry(userId, id);
  if (!existing || existing.isLocked) return false;

  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (data.title !== undefined) { sets.push('title = ?'); params.push(data.title); }
  if (data.content !== undefined) { sets.push('content = ?'); params.push(data.content); }
  if (data.moodTag !== undefined) { sets.push('mood_tag = ?'); params.push(data.moodTag); }
  if (data.moodScore !== undefined) { sets.push('mood_score = ?'); params.push(data.moodScore); }
  if (data.wantsToContact !== undefined) { sets.push('wants_to_contact = ?'); params.push(data.wantsToContact ? 1 : 0); }

  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id, userId);

  d.run(`UPDATE diary_entry SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, params);
  saveDb();
  return true;
}

export async function deleteEntry(userId: string, id: string): Promise<boolean> {
  const d = await getDb();
  d.run('DELETE FROM scheduled_letter WHERE diary_entry_id = ? AND user_id = ?', [id, userId]);
  d.run('DELETE FROM future_self_letter WHERE diary_entry_id = ? AND user_id = ?', [id, userId]);
  d.run('DELETE FROM diary_entry WHERE id = ? AND user_id = ?', [id, userId]);
  saveDb();
  return true;
}

// ============ Scheduled Letters ============

export interface ScheduledLetter {
  id: string;
  userId: string;
  diaryEntryId: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string | null;
  deliveryMethod: string;
  scheduledAt: string;
  requireConfirmation: boolean;
  status: string;
  sentAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  diaryEntry?: { id: string; title: string; moodTag: string; createdAt: string };
}

export async function getLetters(userId: string, status?: string): Promise<ScheduledLetter[]> {
  const d = await getDb();
  let query = `SELECT sl.*, de.title as entry_title, de.mood_tag as entry_mood_tag, de.created_at as entry_created_at
    FROM scheduled_letter sl
    LEFT JOIN diary_entry de ON sl.diary_entry_id = de.id
    WHERE sl.user_id = ?`;
  const params: string[] = [userId];

  if (status) {
    query += ' AND sl.status = ?';
    params.push(status);
  }
  query += ' ORDER BY sl.scheduled_at ASC';

  const result = d.exec(query, params);
  if (result.length === 0) return [];

  return result[0].values.map(row => ({
    id: row[0] as string,
    userId: row[1] as string,
    diaryEntryId: row[2] as string,
    recipientName: row[3] as string,
    recipientEmail: row[4] as string,
    recipientPhone: row[5] as string | null,
    deliveryMethod: row[6] as string,
    scheduledAt: row[7] as string,
    requireConfirmation: !!(row[8] as number),
    status: row[9] as string,
    sentAt: row[10] as string | null,
    cancelledAt: row[11] as string | null,
    createdAt: row[12] as string,
    diaryEntry: {
      id: row[2] as string,
      title: row[14] as string,
      moodTag: row[15] as string,
      createdAt: row[16] as string,
    },
  }));
}

export async function createLetter(userId: string, data: {
  diaryEntryId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  deliveryMethod?: string;
  scheduledAt: string;
}): Promise<string> {
  const d = await getDb();
  const id = generateId();
  d.run(
    `INSERT INTO scheduled_letter (id, user_id, diary_entry_id, recipient_name, recipient_email, recipient_phone, delivery_method, scheduled_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'locked')`,
    [id, userId, data.diaryEntryId, data.recipientName, data.recipientEmail || '', data.recipientPhone || null, data.deliveryMethod || 'email', data.scheduledAt]
  );
  d.run('UPDATE diary_entry SET is_locked = 1 WHERE id = ?', [data.diaryEntryId]);
  saveDb();
  return id;
}

export async function cancelLetter(userId: string, letterId: string): Promise<void> {
  const d = await getDb();
  d.run('UPDATE scheduled_letter SET status = "cancelled", cancelled_at = datetime("now") WHERE id = ? AND user_id = ?', [letterId, userId]);
  saveDb();
}

export async function confirmLetter(userId: string, letterId: string): Promise<void> {
  const d = await getDb();
  d.run('UPDATE scheduled_letter SET status = "sent", sent_at = datetime("now") WHERE id = ? AND user_id = ?', [letterId, userId]);
  saveDb();
}

// ============ Future Self Letters ============

export interface FutureSelfLetter {
  id: string;
  userId: string;
  diaryEntryId: string;
  unlockAt: string;
  isUnlocked: boolean;
  createdAt: string;
  diaryEntry?: { id: string; title: string; moodTag: string; createdAt: string };
}

export async function getFutureLetters(userId: string): Promise<FutureSelfLetter[]> {
  const d = await getDb();
  const result = d.exec(
    `SELECT fl.*, de.title as entry_title, de.mood_tag as entry_mood_tag, de.created_at as entry_created_at
     FROM future_self_letter fl
     LEFT JOIN diary_entry de ON fl.diary_entry_id = de.id
     WHERE fl.user_id = ?
     ORDER BY fl.unlock_at ASC`,
    [userId]
  );
  if (result.length === 0) return [];

  return result[0].values.map(row => ({
    id: row[0] as string,
    userId: row[1] as string,
    diaryEntryId: row[2] as string,
    unlockAt: row[3] as string,
    isUnlocked: !!(row[4] as number),
    createdAt: row[5] as string,
    diaryEntry: {
      id: row[2] as string,
      title: row[6] as string,
      moodTag: row[7] as string,
      createdAt: row[8] as string,
    },
  }));
}

export async function createFutureLetter(userId: string, diaryEntryId: string, unlockAt: string): Promise<string> {
  const d = await getDb();
  const id = generateId();
  d.run(
    'INSERT INTO future_self_letter (id, user_id, diary_entry_id, unlock_at) VALUES (?, ?, ?, ?)',
    [id, userId, diaryEntryId, unlockAt]
  );
  saveDb();
  return id;
}

export async function getEntryWithLetters(userId: string, entryId: string): Promise<{
  entry: DiaryEntry;
  scheduledLetter?: ScheduledLetter;
  futureSelfLetter?: FutureSelfLetter;
  isTimeLocked?: boolean;
} | null> {
  const entry = await getEntry(userId, entryId);
  if (!entry) return null;

  const d = await getDb();

  const slResult = d.exec('SELECT * FROM scheduled_letter WHERE diary_entry_id = ?', [entryId]);
  let scheduledLetter: ScheduledLetter | undefined;
  if (slResult.length > 0 && slResult[0].values.length > 0) {
    const row = slResult[0].values[0];
    scheduledLetter = {
      id: row[0] as string, userId: row[1] as string, diaryEntryId: row[2] as string,
      recipientName: row[3] as string, recipientEmail: row[4] as string,
      recipientPhone: row[5] as string | null, deliveryMethod: row[6] as string,
      scheduledAt: row[7] as string, requireConfirmation: !!(row[8] as number),
      status: row[9] as string, sentAt: row[10] as string | null,
      cancelledAt: row[11] as string | null, createdAt: row[12] as string,
    };
  }

  const flResult = d.exec('SELECT * FROM future_self_letter WHERE diary_entry_id = ?', [entryId]);
  let futureSelfLetter: FutureSelfLetter | undefined;
  let isTimeLocked = false;
  if (flResult.length > 0 && flResult[0].values.length > 0) {
    const row = flResult[0].values[0];
    const unlockAt = row[3] as string;
    const unlocked = !!(row[4] as number);
    futureSelfLetter = {
      id: row[0] as string, userId: row[1] as string, diaryEntryId: row[2] as string,
      unlockAt, isUnlocked: unlocked, createdAt: row[5] as string,
    };

    if (!unlocked && new Date() < new Date(unlockAt)) {
      isTimeLocked = true;
    } else if (!unlocked) {
      d.run('UPDATE future_self_letter SET is_unlocked = 1 WHERE id = ?', [row[0]]);
      saveDb();
      futureSelfLetter.isUnlocked = true;
    }
  }

  return { entry, scheduledLetter, futureSelfLetter, isTimeLocked };
}

// ============ Trends ============

export interface TrendData {
  date: string;
  avgScore: number;
  wantsContact: number;
  entryCount: number;
}

export async function getTrends(userId: string, days: number): Promise<{
  trends: TrendData[];
  summary: { totalEntries: number; totalWantsContact: number; avgScore: number; days: number };
}> {
  const d = await getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = d.exec(
    `SELECT date(created_at) as day, AVG(mood_score) as avg_score, SUM(wants_to_contact) as wants_contact, COUNT(*) as cnt
     FROM diary_entry
     WHERE user_id = ? AND created_at >= ?
     GROUP BY date(created_at)
     ORDER BY day ASC`,
    [userId, since.toISOString()]
  );

  const trends: TrendData[] = result.length > 0 ? result[0].values.map(row => ({
    date: row[0] as string,
    avgScore: Math.round((row[1] as number) * 10) / 10,
    wantsContact: row[2] as number,
    entryCount: row[3] as number,
  })) : [];

  const totalEntries = trends.reduce((s, t) => s + t.entryCount, 0);
  const totalWantsContact = trends.reduce((s, t) => s + t.wantsContact, 0);
  const avgScore = totalEntries > 0
    ? Math.round(trends.reduce((s, t) => s + t.avgScore * t.entryCount, 0) / totalEntries * 10) / 10
    : 0;

  return { trends, summary: { totalEntries, totalWantsContact, avgScore, days } };
}

// ============ Export / Delete ============

export async function exportAllData(userId: string): Promise<string> {
  const { entries } = await getEntries(userId, { limit: 10000 });
  const letters = await getLetters(userId);
  const futureLetters = await getFutureLetters(userId);
  return JSON.stringify({ entries, letters, futureLetters, exportedAt: new Date().toISOString() }, null, 2);
}

export async function deleteAccount(): Promise<void> {
  const d = await getDb();
  d.run('DELETE FROM future_self_letter');
  d.run('DELETE FROM scheduled_letter');
  d.run('DELETE FROM diary_entry');
  d.run('DELETE FROM privacy_lock');
  d.run('DELETE FROM user');
  saveDb();
}
