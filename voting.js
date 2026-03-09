import { nextId } from './storage.js';
import { addAudit } from './audit.js';
import { addNotification } from './notifications.js';

const options = ['За', 'Против', 'Воздержался'];

export function renderVoting(ctx) {
  const { db, user } = ctx;
  const list = db.votings;
  return `<div class="page-header"><div><h2>Голосование</h2><div class="page-subtitle">Вопросы повестки, прогресс, результаты, mock ЭЦП</div></div>${ctx.isSecretary ? '<button class="primary" data-action="new-voting">+ Создать вопрос</button>' : ''}</div>
    <div class="grid cards-3">${list.map((v) => votingCard(db, user, v, ctx.isSecretary)).join('')}</div>
    <p class="muted">Демонстрационный режим ЭЦП (mock)</p>`;
}

export function castVote(db, userId, votingId, choice, comment) {
  const current = db.votes.find((x) => x.votingId === votingId && x.userId === userId);
  if (current?.signed) return { ok: false, message: 'Голос подписан и заблокирован' };
  if (current) Object.assign(current, { choice, comment, votedAt: new Date().toISOString() });
  else db.votes.push({ id: nextId('vt'), votingId, userId, choice, comment, signed: false, votedAt: new Date().toISOString() });
  addAudit(db, userId, 'update', 'Голосование: подача голоса', `voting:${votingId}`);
  return { ok: true };
}

export function signVote(db, userId, votingId) {
  const v = db.votes.find((x) => x.votingId === votingId && x.userId === userId);
  if (!v) return { ok: false, message: 'Сначала выберите голос' };
  v.signed = true;
  db.signatures.push({ id: nextId('s'), voteId: v.id, certificateOwner: userId, certId: `KZ-${Math.floor(Math.random() * 99999)}`, validTo: '2027-12-31', status: 'valid', signedAt: new Date().toISOString() });
  addAudit(db, userId, 'sign', 'Подписание голоса ЭЦП', `vote:${v.id}`);
  addNotification(db, 'Зафиксирована ЭЦП подпись решения участника', 'signature');
  return { ok: true };
}

function votingCard(db, user, v, isSecretary) {
  const votes = db.votes.filter((x) => x.votingId === v.id);
  const participants = v.participants.length;
  const voted = votes.length;
  const byChoice = options.map((o) => ({ o, c: votes.filter((x) => x.choice === o).length }));
  const my = votes.find((x) => x.userId === user.id);
  return `<article class="card"><strong>${v.question}</strong>
    <div class="muted">Статус: <span class="badge ${v.status === 'open' ? 'success' : 'warning'}">${v.status}</span></div>
    <div class="muted">Прогресс ${voted}/${participants}</div>
    <div class="progress"><span style="width:${Math.min(100, Math.round((voted / participants) * 100))}%"></span></div>
    <div style="margin-top:8px">${byChoice.map((x) => `<div class="muted">${x.o}: ${x.c}</div>`).join('')}</div>
    ${v.status === 'open' ? voteActions(v.id, my, isSecretary, v) : ''}
  </article>`;
}

function voteActions(votingId, myVote) {
  return `<div class="row-actions" style="margin-top:10px"><select data-action="select-vote-choice" data-id="${votingId}">${options.map((o) => `<option value="${o}" ${myVote?.choice === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
    <input placeholder="Комментарий" data-action="vote-comment" data-id="${votingId}" value="${myVote?.comment || ''}" />
    <button class="ghost" data-action="submit-vote" data-id="${votingId}">Проголосовать</button>
    <button class="primary" data-action="sign-vote" data-id="${votingId}">Подписать ЭЦП</button>
    ${myVote?.signed ? '<span class="badge success">Подписано</span>' : ''}
    </div>`;
}
