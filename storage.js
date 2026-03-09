import { createDemoData } from './data.js';

const KEY = 'ddc-board-portal-db';

export function loadDB() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const demo = createDemoData();
    saveDB(demo);
    return demo;
  }
  return JSON.parse(raw);
}

export function saveDB(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDB() {
  localStorage.removeItem(KEY);
}

export function upsert(collection, item, idField = 'id') {
  const idx = collection.findIndex((el) => el[idField] === item[idField]);
  if (idx === -1) collection.push(item);
  else collection[idx] = item;
}

export function nextId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}
