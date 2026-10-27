/* Shared by build.mjs (server render) and desktop.js (client render), so both produce identical markup. */

export const ICON = {
  folder: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 012-2h4l2 2h7a2 2 0 012 2v7.5a2 2 0 01-2 2h-13a2 2 0 01-2-2z"/></svg>',
  stack: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 9.5h8M8 13h8M8 16.5h5"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.5"/><path d="M5 19.5c1.2-3.3 4-5 7-5s5.8 1.7 7 5"/></svg>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>'
};

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const postPath = id => `/posts/${id}/`;
export const isPlaceholder = s => s.trim().startsWith('[');
export const plainTitle = s => s.replace(/[\[\]]/g, '').trim();

const d = s => new Date(s);
export const shortDate = (s, now = new Date()) => { const x = d(s); return x.getFullYear() === now.getFullYear() ? x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : x.toLocaleDateString('en-GB'); };
export const longDate = s => { const x = d(s); return x.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' + x.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
const month = s => d(s).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export const folderList = data => data.sections.flatMap(s => s.folders);
export const folderName = (data, id) => (folderList(data).find(f => f.id === id) || {}).name || '';
export const inFolder = (folder, p) => folder === 'all' ? p.folder !== 'about' : p.folder === folder;
export const homeFolder = p => p.folder === 'about' ? 'about' : 'all';

export function visible(data, { folder, q }){
  return data.posts.filter(p => inFolder(folder, p)).filter(p => !q || (p.title + ' ' + p.snippet + ' ' + p.text).toLowerCase().includes(q));
}

export function foldersHTML(data, { folder }){
  return data.sections.map(s => `<div class="label">${esc(s.label)}</div><div class="grp">` + s.folders.map(f => {
    const n = data.posts.filter(p => inFolder(f.id, p)).length;
    return `<button class="folder${f.id === folder ? ' on' : ''}" data-folder="${f.id}">${ICON[f.icon] || ICON.folder}<span>${esc(f.name)}</span><span class="n">${n}</span></button>`;
  }).join('') + '</div>').join('');
}

export function listTitleHTML(data, state){
  const n = visible(data, state).length;
  return `${esc(folderName(data, state.folder))}<small>${n} ${n === 1 ? 'note' : 'notes'}</small>`;
}

export function itemsHTML(data, state, now){
  let html = '', g = '';
  visible(data, state).forEach(p => {
    const m = month(p.date);
    if (m !== g && state.folder !== 'about') { html += `<div class="group">${m}</div>`; g = m; }
    html += `<a class="item${p.id === state.post ? ' on' : ''}" href="${postPath(p.id)}" data-post="${p.id}"><div class="t">${esc(p.title)}</div><div class="s"><b>${shortDate(p.date, now)}</b>${esc(p.snippet)}</div>${state.folder === 'all' ? `<div class="f">${ICON.folder}${esc(folderName(data, p.folder))}</div>` : ''}</a>`;
  });
  return html || `<div class="empty">${state.q ? 'No results' : 'No notes'}</div>`;
}

export function noteHTML(p){
  return p ? `<div class="when">${longDate(p.date)}</div><h1${isPlaceholder(p.title) ? ' class="ph"' : ''}>${esc(p.title)}</h1>${p.html}` : '';
}

export const docTitle = p => p ? `${plainTitle(p.title)} — Tanque` : 'Tanque — Journal';
