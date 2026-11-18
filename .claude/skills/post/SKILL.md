---
name: post
description: Publish a Tanque Journal entry on tanque.org. Use when Ned says /post, or asks to post, publish, add or update a Journal entry, About or Now. Turns his draft into content/posts/<slug>.md, previews it, and pushes to main only after he approves.
---

# /post — publish a Journal entry

The site is in this repo (`tanque.org/`). Pushing to `main` deploys to https://tanque.org in about 30 seconds via `.github/workflows/deploy.yml`. Format details are in `README.md` → "Writing a post".

## 1. Get the draft

Ned supplies the words: pasted text, a file path, or an existing post to edit. **Never write or pad post copy yourself.** Fix only obvious typos, and list each one when you show the preview. If there's no draft, ask for it.

## 2. Fill in the front matter

```
---
title: <Ned's title>
folder: <id>
date: <YYYY-MM-DDTHH:MM, US Eastern>
snippet: <optional>
---
```

- **folder:** must be an id from `content/site.json` (today: `story`, `patterns`, `notes`, `releases`, `about`). If the draft doesn't make it obvious, ask. Never invent a folder; adding one means editing `site.json`, so ask first.
- **date:** now, in Eastern: `TZ=America/New_York date +%Y-%m-%dT%H:%M`. Keep the existing date when editing a post unless Ned says otherwise.
- **snippet:** leave it out; the build uses the first paragraph. Add one only if Ned gives it or the first paragraph is an image or heading.
- **slug** (the filename and URL `/posts/<slug>/`): lowercase-kebab from the title, short, ASCII only. Check `content/posts/` so it doesn't collide. Never rename an existing post's file: its URL is public and in the feed.

## 3. Body

Markdown. Things the site styles specially:
- `- [x] done` / `- [ ] todo` render as the Notes checklist.
- Images: copy into `static/assets/<slug>/` (keep Ned's originals where they are), then
  `<div class="figure"><img src="/assets/<slug>/name.png" alt="<describe it>"></div>`.
  The image keeps its own shape and is stretched to the full column width (about 600 px on desktop), so anything narrower than ~1200 px looks soft on Retina. Tell Ned if an image is smaller than that. Ask him for alt text if the image's meaning isn't clear.
- Any paragraph, heading or item starting with `[ ` renders grey as placeholder text. If Ned's real copy starts with `[`, tell him.

## 4. Build and look

```
npm run build
```
It must print `Built N posts` with no error (it fails on missing front matter or an unknown folder). Then preview with the `tanque-journal` server (`node serve.mjs`) and **open the post in the browser**: check the title, date, list row, every image, and the phone layout (375 px wide). A green build is not enough.

## 5. Show Ned, then publish

Show the post's file, the URL it will get, any typo fixes, and a screenshot. **Wait for an explicit yes**: pushing publishes to the public site and its RSS feed.

On yes:
```
git add content/posts/<slug>.md static/assets/<slug>
git commit -m "Post: <title>"   # plus the Co-Authored-By trailer
git push
gh run watch --exit-status $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')
```
Then load `https://tanque.org/posts/<slug>/` and confirm it's live. GitHub Pages caches pages for 10 minutes, so if an *edited* post looks stale, check with `curl -s https://tanque.org/posts/<slug>/`.

## Other requests

- **Unpublish / delete a post:** confirm first. It disappears from the site and feed, and its URL starts returning 404.
- **About / Now:** edit `content/posts/about.md` or `now.md` the same way.
- **Placeholders:** `p1.md`–`p7.md` are prototype filler. Remove them only when Ned asks.
