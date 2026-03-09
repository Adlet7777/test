import { nextId } from './storage.js';
import { addAudit } from './audit.js';
import { addNotification } from './notifications.js';

export function renderMaterials(ctx) {
  const { db } = ctx;
  const q = (ctx.filters.docQuery || '').toLowerCase();
  const t = ctx.filters.docType || 'all';
  const rows = db.documents.filter((d) => (t === 'all' || d.type === t) && d.name.toLowerCase().includes(q));

  return `<div class="page-header"><div><h2>Материалы</h2><div class="page-subtitle">Документы, версии и mock-preview</div></div>${ctx.isSecretary ? '<button class="primary" data-action="new-document">+ Загрузить материал</button>' : ''}</div>
  <div class="filters"><input placeholder="Поиск по названию" value="${ctx.filters.docQuery || ''}" data-action="filter-doc-query"/><select data-action="filter-doc-type"><option value="all">Все типы</option>${ctx.documentTypes.map((dt) => `<option value="${dt}" ${t === dt ? 'selected' : ''}>${dt}</option>`).join('')}</select></div>
  <div class="table-wrap"><table><thead><tr><th>ID</th><th>Название</th><th>Тип</th><th>Версия</th><th>Загружен</th><th>Автор</th><th></th></tr></thead><tbody>${rows.map((d) => `<tr><td>${d.id}</td><td>${d.name}</td><td>${d.type}</td><td>v${d.version}</td><td>${fmt(d.uploadedAt)}</td><td>${name(db, d.authorId)}</td><td class="row-actions"><button class="ghost" data-action="preview-doc" data-id="${d.id}">Открыть</button><button class="ghost" data-action="download-doc" data-id="${d.id}">Скачать</button><button class="ghost" data-action="versions-doc" data-id="${d.id}">Версии</button>${ctx.isSecretary ? `<button class="ghost" data-action="replace-doc" data-id="${d.id}">Заменить</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
}

export function replaceDocument(db, userId, documentId, comment) {
  const d = db.documents.find((x) => x.id === documentId);
  if (!d) return;
  d.version += 1;
  d.comment = comment;
  d.uploadedAt = new Date().toISOString();
  db.documentVersions.unshift({ id: nextId('dv'), documentId, version: d.version, label: `v${d.version}`, comment, uploadedAt: d.uploadedAt, authorId: userId });
  addAudit(db, userId, 'update', 'Замена документа / новая версия', `document:${documentId}`);
  addNotification(db, `Новая версия документа: ${d.name} (v${d.version})`, 'document');
}

function name(db, id) { return db.users.find((u) => u.id === id)?.name || '—'; }
function fmt(v) { return new Date(v).toLocaleString('ru-RU'); }
