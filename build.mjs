// Builds the Tanque Journal into dist/: one page per post at /posts/<slug>/, the home page, posts.json for client navigation, and feed.xml.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { marked } from 'marked';
import { esc, postPath, plainTitle, homeFolder, foldersHTML, listTitleHTML, itemsHTML, noteHTML, folderName, docTitle } from './src/render.js';

const OUT = 'dist';
const site = JSON.parse(readFileSync('content/site.json', 'utf8'));

function parse(file){
  const raw = readFileSync(`content/posts/${file}`, 'utf8');
  const [, head, md] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [, '', raw];
  const meta = Object.fromEntries(head.split('\n').filter(l => l.includes(':')).map(l => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
  const html = markdown(md);
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const firstPara = ((html.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
  const missing = ['title', 'folder', 'date'].filter(k => !meta[k]);
  if (missing.length) throw new Error(`${file}: missing front matter ${missing.join(', ')}`);
  return { id: file.replace(/\.md$/, ''), folder: meta.folder, date: meta.date, title: meta.title, snippet: meta.snippet || firstPara.slice(0, 140), html, text };
}

// Markdown extras: GFM task lists become the Notes-style checklist, and any block that still starts with "[ " is styled as placeholder copy.
function markdown(md){
  return marked.parse(md)
    .replace(/<ul>(\s*<li><input[\s\S]*?)<\/ul>/g, (_, items) => '<ul class="checklist">' + items
      .replace(/<li><input checked="" disabled="" type="checkbox">\s*/g, '<li class="done">')
      .replace(/<li><input disabled="" type="checkbox">\s*/g, '<li>') + '</ul>')
    .replace(/<(p|h2|h3|li)( class="([^"]*)")?>(\s*\[ )/g, (_, tag, __, cls, rest) => `<${tag} class="${cls ? cls + ' ' : ''}ph">${rest}`);
}

const posts = readdirSync('content/posts').filter(f => f.endsWith('.md')).map(parse).sort((a, b) => b.date.localeCompare(a.date));
const data = { sections: site.sections, posts };
const folderIds = new Set(site.sections.flatMap(s => s.folders.map(f => f.id)));
posts.forEach(p => { if (!folderIds.has(p.folder)) throw new Error(`${p.id}: unknown folder "${p.folder}"`); });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/fonts`, { recursive: true });
cpSync('static', OUT, { recursive: true });
const FONTS = {
  'atkinson-400': '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2',
  'atkinson-400-italic': '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-italic.woff2',
  'atkinson-700': '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2',
  'plex-mono-400': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  'plex-mono-500': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
  'plex-mono-600': '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2'
};
for (const [name, src] of Object.entries(FONTS)) cpSync(`node_modules/${src}`, `${OUT}/fonts/${name}.woff2`);

const v = createHash('sha1').update(['src/desktop.css', 'src/desktop.js', 'src/render.js'].map(f => readFileSync(f)).join('')).digest('hex').slice(0, 8);
cpSync('src/desktop.css', `${OUT}/desktop.css`);
cpSync('src/render.js', `${OUT}/render.js`);
writeFileSync(`${OUT}/desktop.js`, readFileSync('src/desktop.js', 'utf8').replace("from './render.js'", `from './render.js?v=${v}'`));
writeFileSync(`${OUT}/posts.json`, JSON.stringify(data));

const SEARCH = '<label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l4.5 4.5"></path></svg><input type="search" placeholder="Search" aria-label="Search" data-q></label>';

function page(post, view){
  const state = { folder: homeFolder(post), post: post.id, q: '' };
  const url = site.url + (view === 'folders' ? '/' : postPath(post.id));
  const title = view === 'folders' ? 'Tanque — Journal' : docTitle(post);
  const desc = view === 'folders' || post.snippet.startsWith('[') ? site.description : post.snippet;
  return `<!DOCTYPE html>
<html lang="en" data-mode="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.url}/assets/mascot-256.png">
<meta property="og:type" content="${view === 'folders' ? 'website' : 'article'}">
<link rel="icon" href="/assets/mascot-128.png">
<link rel="apple-touch-icon" href="/assets/mascot-256.png">
<link rel="alternate" type="application/rss+xml" title="Tanque Journal" href="/feed.xml">
<link rel="preload" href="/fonts/atkinson-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/atkinson-700.woff2" as="font" type="font/woff2" crossorigin>
<script>(function(){var m;try{m=localStorage.getItem('tanque-desktop-mode')}catch(e){}if(!m)m=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.mode=m;})();</script>
<link rel="stylesheet" href="/desktop.css?v=${v}">
<script type="module" src="/desktop.js?v=${v}"></script>
</head>
<body>
<header class="menubar">
<button class="mi mark" data-act="home" aria-label="Tanque"><img src="/assets/mascot-128.png" alt=""></button>
<button class="mi app" data-act="open">Journal</button>
<a class="mi" href="/" data-act="all">Posts</a>
<a class="mi" href="${postPath('about')}" data-act="about">About</a>
<a class="mi" href="/feed.xml">RSS</a>
<div class="right">
<button class="mi" data-act="mode" aria-label="Toggle light or dark"><svg class="mode-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"></svg></button>
<div class="mi clock" id="clock"></div>
</div>
</header>
<main class="desk">
<section class="win focused" id="win" data-view="${view}" data-folder="${state.folder}" data-post="${post.id}" aria-label="Journal">
<nav class="pane side">
<div class="top" data-drag>
<div class="lights"><button class="c" data-win="close" aria-label="Close"><svg viewBox="0 0 8 8"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5"></path></svg></button><button class="m" data-win="min" aria-label="Minimise"><svg viewBox="0 0 8 8"><path d="M1.2 4h5.6"></path></svg></button><button class="z" data-win="zoom" aria-label="Zoom"><svg viewBox="0 0 8 8"><path d="M2 2h3.2L2 5.2zM6 6H2.8L6 2.8z" fill="rgba(0,0,0,.55)" stroke="none"></path></svg></button></div>
</div>
<div class="m-head"><div class="m-bar"><span></span><button class="m-mode" data-act="mode" aria-label="Toggle light or dark"><svg class="mode-ic" viewBox="0 0 24 24"></svg></button></div><h1>Journal</h1></div>
<div class="folders" id="folders">${foldersHTML(data, state)}</div>
</nav>
<div class="pane list">
<div class="top" data-drag><h2 id="listTitle">${listTitleHTML(data, state)}</h2></div>
<div class="m-head"><div class="m-bar"><button class="back" data-back="folders"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"></path></svg>Folders</button></div><h1 id="mListTitle">${esc(folderName(data, state.folder))}</h1>${SEARCH}</div>
<div class="items" id="items" tabindex="-1">${itemsHTML(data, state)}</div>
</div>
<article class="pane doc">
<div class="top" data-drag>
<button class="tbtn" data-act="copy" title="Copy link" aria-label="Copy link"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"></path></svg></button>
${SEARCH}
</div>
<div class="m-head"><div class="m-bar"><button class="back" data-back="list" id="mBack"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"></path></svg><span>${esc(folderName(data, state.folder))}</span></button></div></div>
<div class="page" id="page"><div class="note" id="note">${noteHTML(post)}</div></div>
</article>
</section>
</main>
<nav class="dock" id="dock" aria-label="Dock"></nav>
</body>
</html>
`;
}

const newest = posts.find(p => p.folder !== 'about');
writeFileSync(`${OUT}/index.html`, page(newest, 'folders'));
for (const p of posts) {
  mkdirSync(`${OUT}/posts/${p.id}`, { recursive: true });
  writeFileSync(`${OUT}/posts/${p.id}/index.html`, page(p, 'post'));
}

const feedItems = posts.filter(p => p.folder !== 'about').map(p => `<item>
<title>${esc(plainTitle(p.title))}</title>
<link>${site.url}${postPath(p.id)}</link>
<guid isPermaLink="true">${site.url}${postPath(p.id)}</guid>
<pubDate>${new Date(p.date).toUTCString()}</pubDate>
<category>${esc(folderName(data, p.folder))}</category>
<description><![CDATA[${p.html.replaceAll(']]>', ']]]]><![CDATA[>')}]]></description>
</item>`).join('\n');
writeFileSync(`${OUT}/feed.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Tanque Journal</title>
<link>${site.url}/</link>
<description>${esc(site.description)}</description>
<language>en-gb</language>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${feedItems}
</channel>
</rss>
`);

console.log(`Built ${posts.length} posts into ${OUT}/ (v${v})`);
