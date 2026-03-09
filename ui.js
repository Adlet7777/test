export function renderDashboard(ctx) {
  return ctx.isSecretary ? secretaryDash(ctx) : memberDash(ctx);
}

export function renderProtocols(ctx) {
  const { db } = ctx;
  return `<div class="page-header"><div><h2>Протоколы</h2><div class="page-subtitle">Версионность протоколов заседаний</div></div>${ctx.isSecretary ? '<button class="primary" data-action="new-protocol">+ Загрузить протокол</button>' : ''}</div>
  <div class="table-wrap"><table><thead><tr><th>ID</th><th>Заседание</th><th>Название</th><th>Версия</th><th>Автор</th><th>Дата</th><th></th></tr></thead><tbody>
  ${db.protocols.map((p) => `<tr><td>${p.id}</td><td>${db.meetings.find((m) => m.id === p.meetingId)?.name || '—'}</td><td>${p.name}</td><td>v${p.version}</td><td>${db.users.find((u) => u.id === p.authorId)?.name || '—'}</td><td>${new Date(p.uploadedAt).toLocaleString('ru-RU')}</td><td><button class="ghost" data-action="view-protocol" data-id="${p.id}">Открыть</button></td></tr>`).join('')}
  </tbody></table></div>`;
}

export function renderAudit(ctx) {
  const { db } = ctx;
  const q = (ctx.filters.auditQ || '').toLowerCase();
  const rows = db.auditLogs.filter((l) => `${l.action} ${l.object}`.toLowerCase().includes(q));
  return `<div class="page-header"><div><h2>Журнал действий</h2><div class="page-subtitle">Аудит операций пользователей</div></div></div>
  <div class="filters"><input data-action="filter-audit-q" value="${ctx.filters.auditQ || ''}" placeholder="Поиск"/></div>
  <div class="table-wrap"><table><thead><tr><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Объект</th><th>Результат</th><th>IP / session</th></tr></thead><tbody>
  ${rows.map((l) => `<tr><td>${new Date(l.createdAt).toLocaleString('ru-RU')}</td><td>${db.users.find((u) => u.id === l.userId)?.name || 'system'}</td><td><span class="audit-tag-${l.type}">${l.action}</span></td><td>${l.object}</td><td>${l.result}</td><td>${l.ip} / ${l.sessionId}</td></tr>`).join('')}
  </tbody></table></div>`;
}

export function renderNotificationsPage(ctx) {
  const { db } = ctx;
  return `<div class="page-header"><div><h2>Уведомления</h2><div class="page-subtitle">Системные оповещения по заседаниям и материалам</div></div></div>
  <div class="grid">${db.notifications.map((n) => `<div class="card"><div><span class="badge ${n.unread ? 'warning' : ''}">${n.kind}</span></div><strong>${n.text}</strong><div class="muted">${new Date(n.createdAt).toLocaleString('ru-RU')}</div></div>`).join('')}</div>`;
}

export function renderSettings() {
  return `<div class="page-header"><div><h2>Настройки / Demo Data</h2><div class="page-subtitle">Управление локальным хранилищем</div></div></div>
  <div class="card"><p>Данные приложения хранятся в localStorage.</p><div class="row-actions"><button class="danger" data-action="reset-demo">Сбросить demo-данные</button><button class="primary" data-action="init-demo">Переинициализировать</button></div></div>`;
}

export function renderMeetingDetails(ctx, meetingId) {
  const { db } = ctx;
  const m = db.meetings.find((x) => x.id === meetingId);
  if (!m) return '<p>Заседание не найдено.</p>';
  const agenda = db.agendaItems.filter((a) => a.meetingId === m.id).sort((a,b) => a.number - b.number);
  const docs = db.documents.filter((d) => d.meetingId === m.id);
  const votings = db.votings.filter((v) => v.meetingId === m.id);
  const logs = db.auditLogs.filter((l) => l.object.includes(m.id));
  const notifs = db.notifications.filter((n) => n.text.toLowerCase().includes(m.name.split(' ')[0].toLowerCase()));

  return `<div class="page-header"><div><h2>${m.name}</h2><div class="page-subtitle">${new Date(m.dateTime).toLocaleString('ru-RU')} • ${m.format} • <span class="badge">${m.status}</span></div></div><button class="ghost" data-action="back-meetings">← К списку</button></div>
    <div class="tabs">${['overview','agenda','materials','protocols','voting','audit'].map((t)=>`<button class="ghost tab-btn ${ctx.meetingTab===t?'active':''}" data-action="meeting-tab" data-tab="${t}" data-id="${m.id}">${tabName(t)}</button>`).join('')}</div>
    ${renderMeetingTab(ctx, m, agenda, docs, votings, logs, notifs)}`;
}

function renderMeetingTab(ctx, m, agenda, docs, votings, logs, notifs) {
  switch (ctx.meetingTab) {
    case 'agenda': return `<div class="card">${agenda.map((a)=>`<div><strong>${a.number}. ${a.title}</strong><div class="muted">${a.description}</div></div>`).join('<hr/>')}</div>`;
    case 'materials': return `<div class="card">${docs.map((d)=>`<div>${d.name} • ${d.type} • v${d.version}</div>`).join('')}</div>`;
    case 'protocols': return `<div class="card">${ctx.db.protocols.filter((p)=>p.meetingId===m.id).map((p)=>`<div>${p.name} v${p.version}</div>`).join('') || 'Нет протоколов'}</div>`;
    case 'voting': return `<div class="card">${votings.map((v)=>`<div><strong>${v.question}</strong><div class="muted">${v.status}</div></div>`).join('') || 'Нет голосований'}</div>`;
    case 'audit': return `<div class="card">${logs.map((l)=>`<div>${new Date(l.createdAt).toLocaleString('ru-RU')} — ${l.action}</div>`).join('') || 'Нет записей'}</div>`;
    default:
      return `<div class="grid cards-3"><div class="card"><h4>Участники</h4>${m.participants.map((id)=>`<div class="muted">${ctx.db.users.find((u)=>u.id===id)?.name || id}</div>`).join('')}</div>
      <div class="card"><h4>Повестка</h4><div class="metric">${agenda.length}</div></div>
      <div class="card"><h4>Уведомления</h4>${notifs.map((n)=>`<div class="muted">${n.text}</div>`).join('') || '<div class="muted">Нет</div>'}</div></div>`;
  }
}

function tabName(t){return ({overview:'Обзор',agenda:'Повестка',materials:'Материалы',protocols:'Протоколы',voting:'Голосование',audit:'История / Аудит'})[t];}

function memberDash(ctx) {
  const { db, user } = ctx;
  const assigned = db.meetings.filter((m) => m.participants.includes(user.id));
  const attention = db.notifications.filter((n) => n.unread).length;
  return `<div class="page-header"><div><h2>Добро пожаловать, ${user.name}</h2><div class="page-subtitle">Dashboard члена Совета / комитета</div></div></div>
    <div class="grid cards-4"><div class="card"><div class="muted">Назначенные заседания</div><div class="metric">${assigned.length}</div></div><div class="card"><div class="muted">Ближайшие заседания</div><div class="metric">${assigned.filter((m)=>new Date(m.dateTime)>new Date()).length}</div></div><div class="card"><div class="muted">Требуют внимания</div><div class="metric">${attention}</div></div><div class="card"><div class="muted">Мой статус голосований</div><div class="metric">${statusSummary(ctx)}</div></div></div>
    <div class="card"><h3>Мои заседания</h3>${assigned.map((m)=>`<div class="row-actions"><span>${m.name}</span><span class="badge">${m.status}</span><button class="ghost" data-action="open-meeting" data-id="${m.id}">Открыть</button></div>`).join('')}</div>`;
}

function secretaryDash(ctx) {
  const { db } = ctx;
  return `<div class="page-header"><div><h2>Панель секретаря</h2><div class="page-subtitle">Управление комитетами, заседаниями и документами</div></div></div>
  <div class="grid cards-4"><div class="card"><div class="muted">Активные заседания</div><p class="metric">${db.meetings.filter((m)=>!['archive','closed'].includes(m.status)).length}</p></div><div class="card"><div class="muted">Документы</div><p class="metric">${db.documents.length}</p></div><div class="card"><div class="muted">Новые версии</div><p class="metric">${db.documentVersions.filter((v)=>v.version>1).length}</p></div><div class="card"><div class="muted">Открытые голосования</div><p class="metric">${db.votings.filter((v)=>v.status==='open').length}</p></div></div>
  <div class="card"><h3>Быстрые действия</h3><div class="row-actions"><button class="primary" data-nav="committees">Создать комитет</button><button class="primary" data-nav="meetings">Создать заседание</button><button class="primary" data-nav="materials">Загрузить материал</button><button class="primary" data-nav="voting">Открыть голосование</button></div></div>
  <div class="card"><h3>Последние действия</h3>${db.auditLogs.slice(0,6).map((l)=>`<div class="muted">${new Date(l.createdAt).toLocaleString('ru-RU')} — ${l.action}</div>`).join('')}</div>`;
}

function statusSummary(ctx) {
  const uid = ctx.user.id;
  const myVotes = ctx.db.votes.filter((v) => v.userId === uid);
  const signed = myVotes.filter((v) => v.signed).length;
  return `${myVotes.length}/${signed}`;
}
