import { nextId } from './storage.js';

export function addAudit(db, userId, type, action, object, result = 'ok') {
  db.auditLogs.unshift({
    id: nextId('log'),
    createdAt: new Date().toISOString(),
    userId,
    type,
    action,
    object,
    result,
    ip: '10.0.0.7',
    sessionId: nextId('sess'),
  });
}
