import { ROLES } from './data.js';

const SESSION_KEY = 'ddc-board-session';

export function loadSession(users) {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) return JSON.parse(raw);
  const secretary = users.find((u) => u.role === ROLES.SECRETARY);
  const session = { role: ROLES.SECRETARY, userId: secretary?.id };
  saveSession(session);
  return session;
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getCurrentUser(db, session) {
  return db.users.find((u) => u.id === session.userId) || db.users[0];
}

export function isSecretary(session) {
  return session.role === ROLES.SECRETARY;
}
