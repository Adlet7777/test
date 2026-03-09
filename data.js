export const ROLES = {
  MEMBER: 'member',
  SECRETARY: 'secretary',
};

export const navItems = [
  { key: 'dashboard', label: 'Главная' },
  { key: 'committees', label: 'Комитеты' },
  { key: 'meetings', label: 'Заседания' },
  { key: 'materials', label: 'Материалы' },
  { key: 'protocols', label: 'Протоколы' },
  { key: 'voting', label: 'Голосование' },
  { key: 'users', label: 'Пользователи и права' },
  { key: 'audit', label: 'Журнал действий' },
  { key: 'notifications', label: 'Уведомления' },
  { key: 'settings', label: 'Настройки / Demo Data' },
];

export const documentTypes = ['пояснительная записка', 'проект решения', 'презентация', 'финансовые материалы', 'юридическое заключение', 'протокол', 'иное'];

export function createDemoData() {
  const users = [
    { id: 'u1', name: 'Серик Абдрахманов', title: 'Секретарь Совета', role: ROLES.SECRETARY, committees: ['c1', 'c2'], email: 'serik@nbk.kz', status: 'active', ecp: true, rights: { viewMaterials: true, vote: false, viewProtocols: true } },
    { id: 'u2', name: 'Айгерим Жумабаева', title: 'Член Совета', role: ROLES.MEMBER, committees: ['c1'], email: 'aigerim@nbk.kz', status: 'active', ecp: true, rights: { viewMaterials: true, vote: true, viewProtocols: true } },
    { id: 'u3', name: 'Данияр Мусин', title: 'Независимый директор', role: ROLES.MEMBER, committees: ['c2'], email: 'daniyar@nbk.kz', status: 'active', ecp: true, rights: { viewMaterials: true, vote: true, viewProtocols: true } },
    { id: 'u4', name: 'Назгуль Сагинтаева', title: 'Финансовый комитет', role: ROLES.MEMBER, committees: ['c2'], email: 'nazgul@nbk.kz', status: 'active', ecp: false, rights: { viewMaterials: true, vote: true, viewProtocols: true } },
  ];

  const committees = [
    { id: 'c1', name: 'Комитет по стратегии', status: 'active', createdAt: now(-14), updatedAt: now(-2), secretaryId: 'u1', members: ['u2', 'u3'] },
    { id: 'c2', name: 'Комитет по финансам и рискам', status: 'active', createdAt: now(-20), updatedAt: now(-1), secretaryId: 'u1', members: ['u3', 'u4'] },
    { id: 'c3', name: 'Комитет по цифровым сервисам', status: 'archived', createdAt: now(-90), updatedAt: now(-30), secretaryId: 'u1', members: ['u2'] },
  ];

  const meetings = [
    meeting('m1', 'board', 'Очередное заседание Совета директоров', 1, 'online', 'published', null, ['u2', 'u3'], ['a1', 'a2']),
    meeting('m2', 'committee', 'Комитет по стратегии: приоритизация инициатив', 3, 'hybrid', 'voting_open', 'c1', ['u2', 'u3'], ['a3']),
    meeting('m3', 'committee', 'Финансовый комитет: бюджет 2027', -2, 'offline', 'voting_closed', 'c2', ['u3', 'u4'], ['a4']),
    meeting('m4', 'board', 'Внеочередное заседание Совета', 7, 'online', 'draft', null, ['u2'], []),
    meeting('m5', 'committee', 'Комитет по рискам: закрытие квартала', 12, 'hybrid', 'archive', 'c2', ['u3', 'u4'], ['a5']),
  ];

  const agendaItems = [
    agenda('a1', 'm1', 1, 'Утверждение стратегии цифровизации', 'Обсуждение KPI и дорожной карты.', 'active', true),
    agenda('a2', 'm1', 2, 'Назначение ответственных по программам', 'Определение владельцев инициатив.', 'active', false),
    agenda('a3', 'm2', 1, 'Пересмотр backlog платформы', 'Новый приоритет инициатив 2026.', 'active', true),
    agenda('a4', 'm3', 1, 'Бюджет CAPEX/OPEX', 'Согласование параметров.', 'closed', true),
    agenda('a5', 'm5', 1, 'Итоги квартала', 'Контроль исполнения.', 'closed', false),
  ];

  const documents = [
    doc('d1', 'm1', 'a1', 'Пояснительная записка по стратегии', 'пояснительная записка', 'u1', 'initial'),
    doc('d2', 'm1', 'a1', 'Проект решения по стратегии', 'проект решения', 'u1', 'initial'),
    doc('d3', 'm2', 'a3', 'Презентация инициатив', 'презентация', 'u1', 'initial'),
    doc('d4', 'm3', 'a4', 'Финансовая модель 2027', 'финансовые материалы', 'u1', 'updated'),
  ];

  const documentVersions = [
    version('dv1', 'd1', 1, 'v1', 'Первичная загрузка', -10),
    version('dv2', 'd1', 2, 'v2', 'Актуализация KPI', -3),
    version('dv3', 'd4', 1, 'v1', 'Первичная модель', -6),
    version('dv4', 'd4', 2, 'v2', 'Учет замечаний CFO', -2),
  ];

  const protocols = [
    { id: 'p1', meetingId: 'm3', name: 'Протокол заседания финкомитета', version: 2, authorId: 'u1', uploadedAt: now(-1) },
    { id: 'p2', meetingId: 'm5', name: 'Итоговый протокол Q4', version: 1, authorId: 'u1', uploadedAt: now(-8) },
  ];

  const votings = [
    { id: 'v1', meetingId: 'm2', agendaItemId: 'a3', question: 'Утвердить перечень инициатив по стратегии?', status: 'open', participants: ['u2', 'u3'], createdBy: 'u1', createdAt: now(-1) },
    { id: 'v2', meetingId: 'm3', agendaItemId: 'a4', question: 'Одобрить бюджет CAPEX 2027?', status: 'closed', participants: ['u3', 'u4'], createdBy: 'u1', createdAt: now(-5) },
  ];

  const votes = [
    vote('vt1', 'v2', 'u3', 'За', 'Поддерживаю', true, -4),
    vote('vt2', 'v2', 'u4', 'Воздержался', 'Нужны уточнения', false, -4),
  ];

  const signatures = [
    { id: 's1', voteId: 'vt1', certificateOwner: 'Данияр Мусин', certId: 'KZ-101-8891', validTo: '2027-12-31', status: 'valid', signedAt: now(-4) },
  ];

  const auditLogs = [
    log('login', 'Вход в систему', 'u2', 'session', 'ok', -1),
    log('create', 'Создание заседания', 'u1', 'meeting:m4', 'ok', -2),
    log('update', 'Замена документа', 'u1', 'document:d1', 'ok', -3),
    log('sign', 'Подписание ЭЦП', 'u3', 'vote:vt1', 'ok', -4),
    log('view', 'Просмотр протокола', 'u2', 'protocol:p1', 'ok', -1),
  ];

  const notifications = [
    notif('n1', 'Новое заседание: Очередное заседание Совета директоров', 'meeting', true, -1),
    notif('n2', 'Новая версия документа: Пояснительная записка по стратегии (v2)', 'document', true, -1),
    notif('n3', 'Голосование открыто: Утвердить перечень инициатив?', 'voting', true, -1),
    notif('n4', 'Загружен протокол: Протокол заседания финкомитета', 'protocol', false, -1),
  ];

  return { users, roles: Object.values(ROLES), committees, meetings, agendaItems, documents, documentVersions, protocols, votings, votes, signatures, auditLogs, notifications };
}

function now(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}
function meeting(id, type, name, inDays, format, status, committeeId, participants, agenda) {
  return { id, type, name, dateTime: now(inDays), format, status, committeeId, agenda, participants, materials: [], votingIds: [], protocolIds: [] };
}
function agenda(id, meetingId, number, title, description, status, hasVoting) {
  return { id, meetingId, number, title, description, status, documentIds: [], hasVoting };
}
function doc(id, meetingId, agendaItemId, name, type, authorId, state) {
  return { id, meetingId, agendaItemId, name, type, version: state === 'updated' ? 2 : 1, uploadedAt: now(-2), authorId, comment: 'demo' };
}
function version(id, documentId, version, label, comment, offset) {
  return { id, documentId, version, label, comment, uploadedAt: now(offset), authorId: 'u1' };
}
function vote(id, votingId, userId, choice, comment, signed, offset) {
  return { id, votingId, userId, choice, comment, signed, votedAt: now(offset) };
}
function log(type, action, userId, object, result, offset) {
  return { id: `log-${Math.random().toString(16).slice(2, 8)}`, createdAt: now(offset), userId, type, action, object, result, ip: '10.0.0.5', sessionId: `sess-${Math.random().toString(16).slice(2, 8)}` };
}
function notif(id, text, kind, unread, offset) {
  return { id, text, kind, unread, createdAt: now(offset) };
}
