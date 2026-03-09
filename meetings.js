import { nextId } from './storage.js';
import { addAudit } from './audit.js';

const statusOrder = ['draft', 'approval', 'published', 'voting_open', 'voting_closed', 'closed', 'archive'];

export function renderMeetings(ctx) {
  const { db } = ctx;
  const s = ctx.filters.meetingStatus || 'all';
  const committee = ctx.filters.meetingCommittee || 'all';
  const rows = db.meetings.filter((m) => (s === 'all' || m.status === s) && (committee === 'all' || m.committeeId === committee));

  return `<div class="page-header"><div><h2>Заседания</h2><div class="page-subtitle">Планирование, публикация, сопровождение</div></div>${ctx.isSecretary ? '<button class="primary" data-action="new-meeting">+ Создать заседание</button>' : ''}</div>
  <div class="filters"><select data-action="filter-meeting-status"><option value="all">Все статусы</option>${statusOrder.map((x) => `<option value="${x}" ${s === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
  <select data-action="filter-meeting-committee"><option value="all">Все комитеты</option>${db.committees.map((c) => `<option value="${c.id}" ${committee === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
  <div class="grid cards-3">${rows.map((m) => card(db, m, ctx)).join('')}</div>`;
}

export function saveMeeting(db, userId, payload) {
  const found = db.meetings.find((m) => m.id === payload.id);
  if (found) {
    Object.assign(found, payload);
    addAudit(db, userId, 'update', 'Изменение заседания', `meeting:${found.id}`);
  } else {
    db.meetings.unshift({ ...payload, id: nextId('m'), agenda: [], participants: payload.participants || [], materials: [], votingIds: [], protocolIds: [] });
    addAudit(db, userId, 'create', 'Создание заседания', 'meeting:new');
  }
}

export function setMeetingStatus(db, userId, id, status) {
  const m = db.meetings.find((x) => x.id === id);
  if (!m) return;
  m.status = status;
  addAudit(db, userId, 'update', `Статус заседания: ${status}`, `meeting:${id}`);
}

function card(db, m, ctx) {
  const agenda = db.agendaItems.filter((a) => a.meetingId === m.id);
  return `<article class="card">
  <div style="display:flex;justify-content:space-between;gap:8px"><strong>${m.name}</strong><span class="badge">${m.status}</span></div>
  <div class="muted">${new Date(m.dateTime).toLocaleString('ru-RU')} • ${m.format}</div>
  <div class="muted">${m.type === 'board' ? 'Совет директоров' : committeeName(db, m.committeeId)}</div>
  <div class="timeline" style="margin-top:10px"><div class="event">Повестка: ${agenda.length} пункт(ов)</div><div class="event">Участники: ${m.participants.length}</div></div>
  <div class="row-actions"><button class="ghost" data-action="open-meeting" data-id="${m.id}">Открыть карточку</button>${ctx.isSecretary ? statusBtns(m) : ''}</div>
  </article>`;
}

function statusBtns(m) {
  if (m.status === 'draft') return `<button class="ghost" data-action="status-meeting" data-id="${m.id}" data-status="published">Публиковать</button>`;
  if (m.status === 'published') return `<button class="ghost" data-action="status-meeting" data-id="${m.id}" data-status="voting_open">Открыть голосование</button>`;
  if (m.status === 'voting_open') return `<button class="ghost" data-action="status-meeting" data-id="${m.id}" data-status="voting_closed">Закрыть голосование</button>`;
  return '';
}

function committeeName(db, id) { return db.committees.find((c) => c.id === id)?.name || 'Совет директоров'; }
