# tanque.org — Journal

The macOS-desktop-style blog from `../design_handoff_tanque_desktop_blog`. Plain static output, no framework.

```
npm install
npm run build     # → dist/
npm run preview   # build, then serve dist/ at http://localhost:4321
```

Pushing to `main` deploys: `.github/workflows/deploy.yml` builds the site and publishes `dist/` to GitHub Pages, which serves it at tanque.org with an automatic HTTPS certificate. `static/CNAME` holds the custom domain.

## Writing a post

Add `content/posts/<slug>.md`. The filename becomes the URL: `/posts/<slug>/`.

```
---
title: My post
folder: story            # a folder id from content/site.json
date: 2026-10-21T09:14   # local time
snippet: Optional. Defaults to the first paragraph.
---

Markdown body. Raw HTML is fine.

- [x] Task lists render as the Notes checklist
- [ ] like this

<div class="figure"><img src="/assets/shot.png" alt=""></div>
```

Any paragraph, heading or list item that still starts with `[ ` is styled as placeholder copy, so unfinished text stands out.

Folders and sidebar sections live in `content/site.json`. Posts in the `about` folder (About, Now) are kept out of "All posts" and the feed.

## Layout

| Path | What |
|---|---|
| `build.mjs` | Markdown → pages, `posts.json`, `feed.xml`; copies fonts and `static/` |
| `src/render.js` | Markup for folders, list and note. Shared by the build and the browser so both render identically |
| `src/desktop.js` | Client shell: routing (`pushState`), search, keyboard, window controls, drag, clock, dock |
| `src/desktop.css` | All styles, from the handoff prototype, plus self-hosted `@font-face` |
| `static/assets/` | Mascot, Local Code and Draw Things icons |
| `serve.mjs` | Local preview server |
| `_archive/landing-2026-05.html` | The previous tanque.org landing page |

Each page is fully server-rendered, so posts are crawlable and links work before the script loads. The script then fetches `/posts.json` once and switches posts without reloading.

## Open items

- Write all `[ placeholder ]` copy (posts, About, Now).
- Local Code dock link still points at the TestFlight invite (`src/desktop.js`, `DOCK`).
- `static/assets/drawthings.avif` is the file the prototype hotlinked: only 72×73 px, so it looks soft when the dock magnifies it. Swap in a larger icon if Draw Things provides one.

