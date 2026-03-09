import { nextId } from './storage.js';

export function addNotification(db, text, kind = 'system') {
  db.notifications.unshift({ id: nextId('n'), text, kind, unread: true, createdAt: new Date().toISOString() });
}

export function markAllRead(db) {
  db.notifications.forEach((n) => {
    n.unread = false;
  });
}
