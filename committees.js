import { nextId } from './storage.js';
import { addAudit } from './audit.js';

export function renderCommittees(ctx) {
  const { db, session } = ctx;
  const only = ctx.filters.committeeStatus || 'all';
  const rows = db.committees.filter((c) => (only === 'all' ? true : c.status === only));

  return `
    <div class="page-header"><div><h2>Комитеты</h2><div class="page-subtitle">Управление комитетами и участниками</div></div>
    ${ctx.isSecretary ? '<button class="primary" data-action="new-committee">+ Создать комитет</button>' : ''}</div>
    <div class="filters">
      <select data-action="filter-committee-status"><option value="all">Все</option><option value="active" ${only === 'active' ? 'selected' : ''}>Активные</option><option value="archived" ${only === 'archived' ? 'selected' : ''}>Архив</option></select>
    </div>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>Наименование</th><th>Статус</th><th>Создан</th><th>Изменен</th><th>Секретарь</th><th>Участники</th><th></th></tr></thead><tbody>
    ${rows.map((c) => `<tr><td>${c.id}</td><td>${c.name}</td><td><span class="badge ${c.status === 'active' ? 'success' : 'warning'}">${c.status}</span></td><td>${fmt(c.createdAt)}</td><td>${fmt(c.updatedAt)}</td><td>${userName(db, c.secretaryId)}</td><td>${c.members.map((m) => userName(db, m)).join(', ')}</td><td>${ctx.isSecretary ? `<button class="ghost" data-action="edit-committee" data-id="${c.id}">Изменить</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div>`;
}

export function saveCommittee(db, sessionUserId, payload) {
  const existing = db.committees.find((c) => c.id === payload.id);
  if (existing) {
    Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
    addAudit(db, sessionUserId, 'update', 'Изменение комитета', `committee:${existing.id}`);
  } else {
    db.committees.unshift({ ...payload, id: nextId('c'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    addAudit(db, sessionUserId, 'create', 'Создание комитета', 'committee:new');
  }
}

function userName(db, id) { return db.users.find((u) => u.id === id)?.name || '—'; }
function fmt(v) { return new Date(v).toLocaleString('ru-RU'); }
