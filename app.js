import { navItems, ROLES, documentTypes, createDemoData } from './data.js';
import { loadDB, saveDB, resetDB } from './storage.js';
import { loadSession, saveSession, getCurrentUser, isSecretary } from './auth.js';
import { addAudit } from './audit.js';
import { markAllRead, addNotification } from './notifications.js';
import { renderDashboard, renderProtocols, renderAudit, renderNotificationsPage, renderSettings, renderMeetingDetails } from './ui.js';
import { renderCommittees, saveCommittee } from './committees.js';
import { renderMeetings, saveMeeting, setMeetingStatus } from './meetings.js';
import { renderMaterials, replaceDocument } from './documents.js';
import { renderVoting, castVote, signVote } from './voting.js';
import { renderUsers, saveUser } from './users.js';

const state = {
  db: loadDB(),
  session: null,
  route: 'dashboard',
  filters: {},
  meetingTab: 'overview',
  selectedMeetingId: null,
  voteChoiceDrafts: {},
  voteCommentDrafts: {},
};
state.session = loadSession(state.db.users);

const el = {
  nav: document.getElementById('side-nav'),
  content: document.getElementById('app-content'),
  roleSelect: document.getElementById('role-select'),
  userSelect: document.getElementById('user-select'),
  notifBtn: document.getElementById('notifications-btn'),
  notifDropdown: document.getElementById('notification-dropdown'),
  notifCount: document.getElementById('notif-count'),
  modalRoot: document.getElementById('modal-root'),
  gSearch: document.getElementById('global-search'),
  gResults: document.getElementById('global-search-results'),
};

init();

function init() {
  renderRoleControls();
  bindBaseEvents();
  addAudit(state.db, state.session.userId, 'login', 'Вход в систему', 'session');
  persist();
  render();
}

function ctx() {
  const user = getCurrentUser(state.db, state.session);
  return { db: state.db, session: state.session, user, isSecretary: isSecretary(state.session), filters: state.filters, meetingTab: state.meetingTab, documentTypes };
}

function render() {
  renderNav();
  renderNotificationsBell();
  const c = ctx();
  if (state.route === 'meeting-details') el.content.innerHTML = renderMeetingDetails(c, state.selectedMeetingId);
  else if (state.route === 'dashboard') el.content.innerHTML = renderDashboard(c);
  else if (state.route === 'committees') el.content.innerHTML = renderCommittees(c);
  else if (state.route === 'meetings') el.content.innerHTML = renderMeetings(c);
  else if (state.route === 'materials') el.content.innerHTML = renderMaterials(c);
  else if (state.route === 'protocols') el.content.innerHTML = renderProtocols(c);
  else if (state.route === 'voting') el.content.innerHTML = renderVoting(c);
  else if (state.route === 'users') el.content.innerHTML = renderUsers(c);
  else if (state.route === 'audit') el.content.innerHTML = renderAudit(c);
  else if (state.route === 'notifications') el.content.innerHTML = renderNotificationsPage(c);
  else if (state.route === 'settings') el.content.innerHTML = renderSettings(c);
}

function renderNav() {
  el.nav.innerHTML = navItems.map((n) => `<a class="nav-item ${state.route === n.key ? 'active' : ''}" href="#" data-nav="${n.key}">${n.label}</a>`).join('');
}
function renderRoleControls() {
  el.roleSelect.innerHTML = `<option value="${ROLES.SECRETARY}">Секретарь</option><option value="${ROLES.MEMBER}">Член Совета/Комитета</option>`;
  el.roleSelect.value = state.session.role;
  refreshUserSelect();
}
function refreshUserSelect() {
  const list = state.db.users.filter((u) => u.role === state.session.role);
  el.userSelect.innerHTML = list.map((u) => `<option value="${u.id}">${u.name}</option>`).join('');
  if (!list.some((u) => u.id === state.session.userId)) state.session.userId = list[0]?.id;
  el.userSelect.value = state.session.userId;
}
function renderNotificationsBell() {
  const unread = state.db.notifications.filter((n) => n.unread).length;
  el.notifCount.textContent = unread ? `(${unread})` : '';
}

function bindBaseEvents() {
  document.body.addEventListener('click', onClick);
  document.body.addEventListener('change', onChange);
  el.roleSelect.addEventListener('change', () => {
    state.session.role = el.roleSelect.value;
    refreshUserSelect();
    saveSession(state.session); render();
  });
  el.userSelect.addEventListener('change', () => {
    state.session.userId = el.userSelect.value;
    saveSession(state.session); render();
  });
  el.notifBtn.addEventListener('click', () => {
    const hidden = el.notifDropdown.classList.toggle('hidden');
    if (!hidden) {
      el.notifDropdown.innerHTML = `<div class="row-actions" style="padding:10px"><button class="ghost" data-action="read-all">Отметить прочитанными</button></div>${state.db.notifications.slice(0, 12).map((n) => `<div class="notif-item ${n.unread ? 'unread' : ''}">${n.text}<div class="muted">${new Date(n.createdAt).toLocaleString('ru-RU')}</div></div>`).join('')}`;
    }
  });
  el.gSearch.addEventListener('input', () => {
    const q = el.gSearch.value.trim().toLowerCase();
    if (!q) return el.gResults.classList.add('hidden');
    const results = [
      ...state.db.documents.map((d) => ({ label: `Документ: ${d.name}`, route: 'materials' })),
      ...state.db.committees.map((c) => ({ label: `Комитет: ${c.name}`, route: 'committees' })),
      ...state.db.meetings.map((m) => ({ label: `Заседание: ${m.name}`, route: 'meetings' })),
    ].filter((x) => x.label.toLowerCase().includes(q)).slice(0, 8);
    el.gResults.classList.remove('hidden');
    el.gResults.innerHTML = results.map((r) => `<div class="search-item" data-action="search-go" data-route="${r.route}">${r.label}</div>`).join('') || '<div class="search-item">Ничего не найдено</div>';
  });
  document.getElementById('mobile-menu-btn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

function onClick(e) {
  const t = e.target;
  const nav = t.getAttribute('data-nav');
  if (nav) { state.route = nav; state.selectedMeetingId = null; render(); return; }

  const a = t.getAttribute('data-action');
  if (!a) return;
  if (a === 'search-go') { state.route = t.dataset.route; el.gResults.classList.add('hidden'); render(); }
  if (a === 'read-all') { markAllRead(state.db); persist(); render(); }
  if (a === 'new-committee') openCommitteeModal();
  if (a === 'edit-committee') openCommitteeModal(t.dataset.id);
  if (a === 'new-meeting') openMeetingModal();
  if (a === 'open-meeting') { state.route = 'meeting-details'; state.selectedMeetingId = t.dataset.id; state.meetingTab = 'overview'; render(); }
  if (a === 'back-meetings') { state.route = 'meetings'; render(); }
  if (a === 'meeting-tab') { state.meetingTab = t.dataset.tab; render(); }
  if (a === 'status-meeting') { setMeetingStatus(state.db, state.session.userId, t.dataset.id, t.dataset.status); persist(); render(); }
  if (a === 'new-document') openAddDocumentModal();
  if (a === 'replace-doc') openReplaceModal(t.dataset.id);
  if (a === 'versions-doc') openVersionsModal(t.dataset.id);
  if (a === 'preview-doc') openPreviewModal(t.dataset.id);
  if (a === 'download-doc') toast('Mock: документ скачан');
  if (a === 'new-user') openUserModal();
  if (a === 'edit-user') openUserModal(t.dataset.id);
  if (a === 'new-voting') openVotingModal();
  if (a === 'submit-vote') {
    const result = castVote(state.db, state.session.userId, t.dataset.id, state.voteChoiceDrafts[t.dataset.id] || 'За', state.voteCommentDrafts[t.dataset.id] || '');
    toast(result.ok ? 'Голос сохранен' : result.message); persist(); render();
  }
  if (a === 'sign-vote') openSignModal(t.dataset.id);
  if (a === 'reset-demo') { resetDB(); state.db = createDemoData(); persist(); render(); }
  if (a === 'init-demo') { state.db = createDemoData(); persist(); render(); }
}

function onChange(e) {
  const t = e.target;
  const a = t.getAttribute('data-action');
  if (!a) return;
  if (a === 'filter-committee-status') { state.filters.committeeStatus = t.value; render(); }
  if (a === 'filter-meeting-status') { state.filters.meetingStatus = t.value; render(); }
  if (a === 'filter-meeting-committee') { state.filters.meetingCommittee = t.value; render(); }
  if (a === 'filter-doc-type') { state.filters.docType = t.value; render(); }
  if (a === 'filter-doc-query') { state.filters.docQuery = t.value; render(); }
  if (a === 'filter-audit-q') { state.filters.auditQ = t.value; render(); }
  if (a === 'select-vote-choice') state.voteChoiceDrafts[t.dataset.id] = t.value;
  if (a === 'vote-comment') state.voteCommentDrafts[t.dataset.id] = t.value;
}

function persist() { saveDB(state.db); saveSession(state.session); }

function openModal(title, body, onSave) {
  el.modalRoot.innerHTML = `<div class="modal"><div class="page-header"><h3>${title}</h3><button class="ghost" id="close-modal">✕</button></div>${body}<div class="row-actions" style="margin-top:12px"><button class="primary" id="save-modal">Сохранить</button></div></div>`;
  el.modalRoot.classList.add('open');
  document.getElementById('close-modal').onclick = closeModal;
  document.getElementById('save-modal').onclick = () => { onSave?.(); closeModal(); };
}
function closeModal() { el.modalRoot.classList.remove('open'); el.modalRoot.innerHTML = ''; render(); }

function openCommitteeModal(id) {
  const c = state.db.committees.find((x) => x.id === id);
  openModal(c ? 'Редактирование комитета' : 'Создание комитета', `<div class="form-grid"><input id="c-name" class="full" placeholder="Наименование" value="${c?.name || ''}"/><select id="c-status"><option value="active">active</option><option value="archived">archived</option></select><select id="c-secretary">${state.db.users.filter((u)=>u.role===ROLES.SECRETARY).map((u)=>`<option value="${u.id}">${u.name}</option>`)}</select><label class="full">Участники</label><select id="c-members" class="full" multiple size="5">${state.db.users.filter((u)=>u.role===ROLES.MEMBER).map((u)=>`<option value="${u.id}" ${c?.members?.includes(u.id)?'selected':''}>${u.name}</option>`)}</select></div>`, () => {
    const payload = { id: c?.id, name: val('c-name'), status: val('c-status'), secretaryId: val('c-secretary'), members: values('c-members') };
    if (!payload.name.trim()) return toast('Введите название');
    saveCommittee(state.db, state.session.userId, payload); persist();
  });
}

function openMeetingModal() {
  openModal('Создание заседания', `<div class="form-grid"><select id="m-type"><option value="board">Совет директоров</option><option value="committee">Комитет</option></select><input id="m-name" class="full" placeholder="Наименование"/><input id="m-date" type="datetime-local"/><select id="m-format"><option>online</option><option>offline</option><option>hybrid</option></select><select id="m-committee"><option value="">—</option>${state.db.committees.map((c)=>`<option value="${c.id}">${c.name}</option>`)}</select><select id="m-participants" class="full" multiple size="5">${state.db.users.filter((u)=>u.role===ROLES.MEMBER).map((u)=>`<option value="${u.id}">${u.name}</option>`)}</select></div>`, () => {
    const payload = { type: val('m-type'), name: val('m-name'), dateTime: new Date(val('m-date')).toISOString(), format: val('m-format'), status: 'draft', committeeId: val('m-committee') || null, participants: values('m-participants') };
    if (!payload.name || !val('m-date')) return toast('Заполните обязательные поля');
    saveMeeting(state.db, state.session.userId, payload); addNotification(state.db, `Новое заседание: ${payload.name}`, 'meeting'); persist();
  });
}

function openAddDocumentModal() {
  openModal('Загрузка материала', `<div class="form-grid"><input id="d-name" class="full" placeholder="Название документа"/><select id="d-type">${documentTypes.map((d)=>`<option>${d}</option>`)}</select><select id="d-meeting">${state.db.meetings.map((m)=>`<option value="${m.id}">${m.name}</option>`)}</select><select id="d-agenda">${state.db.agendaItems.map((a)=>`<option value="${a.id}">${a.title}</option>`)}</select><input id="d-comment" class="full" placeholder="Комментарий"/></div>`, () => {
    const doc = { id: `d-${Math.random().toString(16).slice(2,6)}`, name: val('d-name'), type: val('d-type'), meetingId: val('d-meeting'), agendaItemId: val('d-agenda'), version: 1, uploadedAt: new Date().toISOString(), authorId: state.session.userId, comment: val('d-comment') };
    if (!doc.name.trim()) return toast('Название обязательно');
    state.db.documents.unshift(doc);
    state.db.documentVersions.unshift({ id: `dv-${Math.random().toString(16).slice(2,6)}`, documentId: doc.id, version: 1, label: 'v1', comment: doc.comment || 'initial', uploadedAt: doc.uploadedAt, authorId: state.session.userId });
    addAudit(state.db, state.session.userId, 'create', 'Загрузка документа', `document:${doc.id}`);
    addNotification(state.db, `Новый материал: ${doc.name}`, 'document');
    persist();
  });
}

function openReplaceModal(docId) {
  const d = state.db.documents.find((x) => x.id === docId);
  openModal(`Замена документа: ${d.name}`, `<div class="form-grid"><textarea id="r-comment" class="full" placeholder="Основание замены"></textarea></div>`, () => {
    replaceDocument(state.db, state.session.userId, docId, val('r-comment') || 'Обновление'); persist();
  });
}
function openVersionsModal(docId) {
  const d = state.db.documents.find((x) => x.id === docId);
  const versions = state.db.documentVersions.filter((v) => v.documentId === docId).sort((a,b)=>b.version-a.version);
  openModal(`История версий: ${d.name}`, `<div>${versions.map((v)=>`<div class="card" style="margin-bottom:8px">v${v.version} • ${new Date(v.uploadedAt).toLocaleString('ru-RU')}<div class="muted">${v.comment}</div></div>`).join('')}</div>`, null);
  document.getElementById('save-modal').remove();
}
function openPreviewModal(docId) {
  const d = state.db.documents.find((x) => x.id === docId);
  openModal(`Preview: ${d.name}`, `<div class="preview"><h4>Mock preview (${mockFormat(d.type)})</h4><p>Название: ${d.name}</p><p>Тип: ${d.type}</p><p>Версия: v${d.version}</p><p>Автор: ${state.db.users.find((u)=>u.id===d.authorId)?.name}</p></div>`, null);
  document.getElementById('save-modal').remove();
}
function openUserModal(id) {
  const u = state.db.users.find((x) => x.id === id);
  openModal(u ? 'Редактировать пользователя' : 'Новый пользователь', `<div class="form-grid"><input id="u-name" value="${u?.name || ''}" placeholder="ФИО" class="full"/><input id="u-title" value="${u?.title || ''}" placeholder="Должность"/><input id="u-email" value="${u?.email || ''}" placeholder="Email"/><select id="u-role"><option value="member">member</option><option value="secretary">secretary</option></select><select id="u-status"><option value="active">active</option><option value="blocked">blocked</option></select><label><input id="u-ecp" type="checkbox" ${u?.ecp ? 'checked' : ''}/> Право подписи ЭЦП</label></div>`, () => {
    const payload = { id: u?.id, name: val('u-name'), title: val('u-title'), email: val('u-email'), role: val('u-role'), committees: u?.committees || [], status: val('u-status'), ecp: document.getElementById('u-ecp').checked, rights: u?.rights || { viewMaterials: true, vote: true, viewProtocols: true } };
    if (!payload.name || !payload.email) return toast('ФИО и email обязательны');
    saveUser(state.db, state.session.userId, payload); persist(); refreshUserSelect();
  });
}
function openVotingModal() {
  openModal('Создать вопрос голосования', `<div class="form-grid"><select id="v-meeting">${state.db.meetings.map((m)=>`<option value="${m.id}">${m.name}</option>`)}</select><select id="v-agenda">${state.db.agendaItems.map((a)=>`<option value="${a.id}">${a.title}</option>`)}</select><input id="v-question" class="full" placeholder="Формулировка вопроса"/><select id="v-participants" class="full" multiple size="5">${state.db.users.filter((u)=>u.role===ROLES.MEMBER).map((u)=>`<option value="${u.id}">${u.name}</option>`)}</select></div>`, () => {
    const v = { id: `v-${Math.random().toString(16).slice(2,6)}`, meetingId: val('v-meeting'), agendaItemId: val('v-agenda'), question: val('v-question'), status: 'open', participants: values('v-participants'), createdBy: state.session.userId, createdAt: new Date().toISOString() };
    if (!v.question || !v.participants.length) return toast('Укажите вопрос и участников');
    state.db.votings.unshift(v);
    addAudit(state.db, state.session.userId, 'create', 'Создание и запуск голосования', `voting:${v.id}`);
    addNotification(state.db, `Открыто голосование: ${v.question}`, 'voting'); persist();
  });
}
function openSignModal(votingId) {
  const u = getCurrentUser(state.db, state.session);
  openModal('Подписать ЭЦП (mock)', `<div class="preview"><p>Владелец: ${u.name}</p><p>ИИН/ID: KZ-${u.id}</p><p>Срок действия: 2027-12-31</p><p>Статус: valid</p></div>`, () => {
    const res = signVote(state.db, state.session.userId, votingId);
    toast(res.ok ? 'Подписано ЭЦП' : res.message);
    persist();
  });
}

function val(id) { return document.getElementById(id).value; }
function values(id) { return Array.from(document.getElementById(id).selectedOptions).map((o) => o.value); }
function mockFormat(type) { return type.includes('презентация') ? 'PPTX' : type.includes('проект') ? 'DOCX' : 'PDF'; }
function toast(text) { alert(text); }
