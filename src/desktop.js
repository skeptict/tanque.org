import { ICON, postPath, folderName, inFolder, homeFolder, visible, foldersHTML, listTitleHTML, itemsHTML, noteHTML, docTitle } from './render.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const win = $('#win'), dock = $('#dock');
const mobile = () => matchMedia('(max-width:720px)').matches;
const idFromPath = path => (path.match(/^\/posts\/([^/]+)\/?$/) || [])[1] || null;
const state = { folder: win.dataset.folder || 'all', post: win.dataset.post || null, q: '' };
let J = null;

/* ---- appearance, window, clock, dock: work before posts.json arrives ---- */

function setMode(m, save){
  document.documentElement.dataset.mode = m;
  if (save) localStorage.setItem('tanque-desktop-mode', m);
  $$('.mode-ic').forEach(s => s.innerHTML = m === 'dark' ? ICON.sun : ICON.moon);
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => { if (!localStorage.getItem('tanque-desktop-mode')) setMode(e.matches ? 'light' : 'dark'); });

function windowAction(a){
  if (a === 'close') { win.classList.add('closed'); setRunning(false); }
  else if (a === 'min') win.classList.add('minimized');
  else if (a === 'zoom') win.classList.toggle('zoomed');
}
function showWin(){
  const j = $('.dk.notes');
  if (win.classList.contains('closed') && j) { j.classList.add('bounce'); setTimeout(() => j.classList.remove('bounce'), 1000); }
  win.classList.remove('closed', 'minimized'); setRunning(true);
}
function setRunning(on){ const j = $('.dk.notes'); j && j.classList.toggle('running', on); }

let drag = null;
$$('[data-drag]').forEach(bar => {
  bar.addEventListener('pointerdown', e => {
    if (mobile() || win.classList.contains('zoomed') || e.target.closest('button,input,label,a')) return;
    const cs = getComputedStyle(win);
    drag = { x: e.clientX, y: e.clientY, dx: parseFloat(cs.getPropertyValue('--dx')) || 0, dy: parseFloat(cs.getPropertyValue('--dy')) || 0, top: win.offsetTop };
    win.classList.add('dragging'); bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', e => {
    if (!drag) return;
    const dy = Math.max(-drag.top, drag.dy + e.clientY - drag.y);
    win.style.setProperty('--dx', drag.dx + e.clientX - drag.x + 'px'); win.style.setProperty('--dy', dy + 'px');
  });
  const end = () => { drag = null; win.classList.remove('dragging'); };
  bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  bar.addEventListener('dblclick', e => { if (!e.target.closest('button,input,label,a')) windowAction('zoom'); });
});
document.addEventListener('pointerdown', e => win.classList.toggle('focused', !!e.target.closest('#win,.dock,.menubar')));

function tick(){
  const n = new Date();
  $('#clock').textContent = n.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '') + ' ' + n.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  setTimeout(tick, 1000 - n.getMilliseconds() + 5);
}
tick();

const DOCK = [
  { cls: 'notes running', label: 'Notes', html: '', act: () => win.classList.contains('closed') || win.classList.contains('minimized') ? showWin() : windowAction('min') },
  { cls: 'journal', label: 'Journal', html: '<img src="/assets/mascot-256.png" alt="">', act: () => { showWin(); setFolder('all'); } },
  { cls: 'story', label: 'Story Studio', html: 'S', act: () => { showWin(); setFolder('story'); } },
  { cls: 'patterns', label: 'Patterns', html: 'P', act: () => { showWin(); setFolder('patterns'); } },
  { cls: 'drawthings', label: 'Draw Things', href: 'https://drawthings.ai/', html: '<img src="/assets/drawthings.avif" alt="">' },
  { cls: 'localcode', label: 'Local Code', href: 'https://testflight.apple.com/join/X1RyBj9q', html: '<img src="/assets/localcode.png" alt="">' },
  'sep',
  { label: 'About', href: postPath('about'), html: ICON.person.replace(/^<svg[^>]*>|<\/svg>$/g, ''), svg: true, act: () => act('about') },
  { label: 'GitHub', href: 'https://github.com/skeptict', html: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5a3 3 0 00-.9-2.4c3-.3 6.1-1.5 6.1-6.6a5 5 0 00-1.4-3.6 4.7 4.7 0 00-.1-3.6s-1.1-.3-3.7 1.4a12.6 12.6 0 00-6.6 0C5.8 1 4.7 1.3 4.7 1.3a4.7 4.7 0 00-.1 3.6A5 5 0 003.2 8.5c0 5.1 3.1 6.3 6.1 6.6a3 3 0 00-.9 2.4V21"/>', svg: true },
  { label: 'RSS', href: '/feed.xml', html: '<path d="M5 5a14 14 0 0114 14M5 11a8 8 0 018 8"/><circle cx="6" cy="18" r="1.3" fill="currentColor"/>', svg: true },
  { label: 'Appearance', html: '', svg: true, mode: true, act: () => act('mode') }
];
dock.innerHTML = DOCK.map((it, i) => it === 'sep' ? '<span class="sep"></span>' :
  `<${it.href ? `a href="${it.href}"${it.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}` : 'button'} class="dk ${it.cls || ''}" data-i="${i}" aria-label="${it.label}"><span class="ic">${it.svg ? `<svg viewBox="0 0 24 24"${it.mode ? ' class="mode-ic"' : ''}>${it.html}</svg>` : it.html}</span><span class="tip">${it.label}</span><span class="run"></span></${it.href ? 'a' : 'button'}>`).join('');
setMode(document.documentElement.dataset.mode);
dock.addEventListener('click', e => { const b = e.target.closest('.dk'); const it = b && DOCK[b.dataset.i]; if (it && it.act && J) { e.preventDefault(); it.act(); } });

const tiles = $$('.dk'), BASE = 50, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX = reduce ? 50 : 96, R = 170;
const size = tiles.map(() => BASE);
let mx = null, raf = 0;
function frame(){
  let moving = false;
  tiles.forEach((el, i) => {
    let target = BASE;
    if (mx !== null) {
      const r = el.getBoundingClientRect(), dist = Math.abs(mx - (r.left + r.width / 2));
      if (dist < R) target = BASE + (MAX - BASE) * (Math.cos(Math.PI * dist / R) + 1) / 2;
    }
    size[i] += (target - size[i]) * 0.24;
    if (Math.abs(target - size[i]) > 0.15) moving = true; else size[i] = target;
    el.style.width = el.style.height = size[i].toFixed(2) + 'px';
  });
  raf = moving || mx !== null ? requestAnimationFrame(frame) : 0;
}
dock.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; mx = e.clientX; if (!raf) raf = requestAnimationFrame(frame); });
dock.addEventListener('pointerleave', () => { mx = null; if (!raf) raf = requestAnimationFrame(frame); });

/* ---- journal navigation: needs posts.json; until then rows and menu items are plain links ---- */

const remember = () => ({ folder: state.folder, post: state.post, view: win.dataset.view });
// Pushed entries are marked so the mobile back button can use real history instead of guessing.
const push = url => history.pushState({ ...remember(), pushed: true }, '', url);

function render(){
  $('#folders').innerHTML = foldersHTML(J, state);
  $('#listTitle').innerHTML = listTitleHTML(J, state);
  $('#mListTitle').textContent = folderName(J, state.folder);
  $('#items').innerHTML = itemsHTML(J, state);
}
function renderNote(){
  const p = J.posts.find(x => x.id === state.post);
  $('#note').innerHTML = noteHTML(p);
  $('#page').scrollTop = 0;
  $('#mBack span').textContent = folderName(J, state.folder);
  document.title = docTitle(p);
}

const clearSearch = () => { state.q = ''; $$('[data-q]').forEach(i => i.value = ''); };
function setFolder(id){
  state.folder = id; clearSearch();
  const first = visible(J, state)[0]; state.post = first ? first.id : null;
  renderNote(); render();
  if (mobile()) { win.dataset.view = 'list'; push(location.pathname); }
  else { win.dataset.view = 'list'; if (state.post) history.replaceState(remember(), '', postPath(state.post)); }
}
function openPost(id, pushEntry = true){
  const p = J.posts.find(x => x.id === id); if (!p) return;
  if (!inFolder(state.folder, p)) state.folder = homeFolder(p);
  state.post = id; render(); renderNote(); win.dataset.view = 'post';
  const el = $(`.item[data-post="${id}"]`), box = $('#items');
  if (el && (el.offsetTop < box.scrollTop || el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight)) box.scrollTop = el.offsetTop - 40;
  if (pushEntry) push(postPath(id));
}
function goBack(view){
  if (history.state && history.state.pushed) return history.back();
  win.dataset.view = view;
  history.replaceState(remember(), '', view === 'post' ? postPath(state.post) : '/');
}

function act(a, el){
  if (a === 'mode') setMode(document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark', true);
  else if (a === 'open' || a === 'home') showWin();
  else if (a === 'all') { showWin(); setFolder('all'); }
  else if (a === 'about') { showWin(); state.folder = 'about'; clearSearch(); openPost('about'); }
  else if (a === 'copy') { navigator.clipboard && navigator.clipboard.writeText(location.href); el.title = 'Copied'; setTimeout(() => el.title = 'Copy link', 1500); }
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-folder],[data-post],[data-back],[data-act],[data-win]'); if (!t) return;
  if (t.dataset.win) return windowAction(t.dataset.win);
  if (t.dataset.act === 'mode' || t.dataset.act === 'copy' || t.dataset.act === 'open' || t.dataset.act === 'home') return act(t.dataset.act, t);
  if (!J || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
  e.preventDefault();
  if (t.dataset.folder) setFolder(t.dataset.folder);
  else if (t.dataset.post) openPost(t.dataset.post);
  else if (t.dataset.back) goBack(t.dataset.back);
  else act(t.dataset.act, t);
});

$$('[data-q]').forEach(i => i.addEventListener('input', () => {
  if (!J) return;
  state.q = i.value.trim().toLowerCase();
  $$('[data-q]').forEach(o => o !== i && (o.value = i.value));
  $('#listTitle').innerHTML = listTitleHTML(J, state);
  $('#items').innerHTML = itemsHTML(J, state);
}));

window.addEventListener('popstate', e => {
  if (!J) return location.reload();
  const s = e.state || {}, id = idFromPath(location.pathname);
  if (s.folder) state.folder = s.folder;
  if (id) { openPost(id, false); if (s.view) win.dataset.view = s.view; }
  else { render(); win.dataset.view = s.view || (mobile() ? 'folders' : 'list'); document.title = docTitle(null); }
});

document.addEventListener('keydown', e => {
  if (!J || e.target.matches('input') || mobile() || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
  const list = visible(J, state), i = list.findIndex(p => p.id === state.post), n = list[Math.max(0, Math.min(list.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
  if (n && n.id !== state.post) { e.preventDefault(); openPost(n.id, false); history.replaceState(remember(), '', postPath(n.id)); }
});

fetch('/posts.json').then(r => r.json()).then(data => {
  J = data;
  const s = history.state;
  if (s && s.folder) { state.folder = s.folder; state.post = s.post; win.dataset.view = s.view; }
  render(); renderNote();
  if (!idFromPath(location.pathname) && mobile()) document.title = docTitle(null);
  if (!idFromPath(location.pathname) && !mobile() && state.post) history.replaceState(remember(), '', postPath(state.post));
  else history.replaceState({ ...remember(), pushed: s && s.pushed }, '');
});
