import { nextId } from './storage.js';
import { addAudit } from './audit.js';

export function renderUsers(ctx) {
  const { db } = ctx;
  return `<div class="page-header"><div><h2>Пользователи и права</h2><div class="page-subtitle">Роли, комитеты, доступ и ЭЦП-права</div></div>${ctx.isSecretary ? '<button class="primary" data-action="new-user">+ Добавить пользователя</button>' : ''}</div>
  <div class="table-wrap"><table><thead><tr><th>ФИО</th><th>Должность</th><th>Роль</th><th>Комитеты</th><th>Email</th><th>Права</th><th>ЭЦП</th><th></th></tr></thead><tbody>
  ${db.users.map((u) => `<tr><td>${u.name}</td><td>${u.title}</td><td><span class="badge">${u.role}</span></td><td>${u.committees.map((c) => db.committees.find((x) => x.id === c)?.name).filter(Boolean).join(', ')}</td><td>${u.email}</td><td>${Object.entries(u.rights).filter(([,v]) => v).map(([k])=>k).join(', ')}</td><td>${u.ecp ? 'Да' : 'Нет'}</td><td>${ctx.isSecretary ? `<button class="ghost" data-action="edit-user" data-id="${u.id}">Редактировать</button>` : ''}</td></tr>`).join('')}
  </tbody></table></div>`;
}

export function saveUser(db, sessionUserId, payload) {
  const found = db.users.find((u) => u.id === payload.id);
  if (found) {
    Object.assign(found, payload);
    addAudit(db, sessionUserId, 'update', 'Изменение прав пользователя', `user:${found.id}`);
  } else {
    db.users.push({ ...payload, id: nextId('u') });
    addAudit(db, sessionUserId, 'create', 'Создание пользователя', 'user:new');
  }
}
