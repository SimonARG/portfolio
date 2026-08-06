# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Simón Chasnovsky's personal portfolio — a two-page static site in vanilla HTML, CSS and JavaScript. No framework, no package manager, no build config committed, no tests. Served at **www.simon-dev.com** by nginx on Simon's Hostinger VPS (migrated off GitHub Pages 2026-08-06).

Only two pages exist: `index.html` (landing) and `projects.html` (project gallery). Both share `css/index.css` and the same fixed side menu / popup markup.

## Branches: `main` is source, `production` is the deployed artifact

Three branches, and `main` shares **no history** with the other two — `production` was cut from `gh-pages`, which was never a descendant of `main`. They are maintained in parallel, with matching commit messages (`Update blog project`, `Add newtab and mpi projects`, …) applied by hand to each. `main` cannot be merged into `production`.

| | `main` | `production` | `gh-pages` |
|---|---|---|---|
| Role | readable source | **deployed to the VPS** | frozen GitHub Pages rollback |
| Content | readable | minified build output | minified build output |
| `imgs/` `vids/` `docs/` | gitignored (absent) | committed — the only copy in the repo | committed |
| `CNAME` | absent | removed (nginx sets the hostname) | `www.simon-dev.com` |
| `README.md` `LICENSE` `.gitignore` | present | absent | absent |

Consequences to respect:

- **Never overwrite `production` wholesale** (no force-push from `main`, no `git checkout main -- .`). It would drop every image, video and CV PDF, since `production`/`gh-pages` are the only place those binaries live.
- Media and CVs are **only ever committed to `production`**. `.gitignore` on `main` excludes `imgs/`, `vids/`, `docs/`, `dist/`. Commits like `Update CV files` with no counterpart on `main` are expected, not drift.
- **`gh-pages` is the rollback**, kept in sync with GitHub Pages settings and left untouched. If the VPS has to be abandoned, pointing DNS back at GitHub Pages restores the old site as-is. Don't repurpose or delete that branch.
- Content parity is currently intact: all branches carry the same six projects (`mpi`, `mixtorrents`, `newtab`, `ambient`, `blog`, `portfolio`).

### Deploying a change

1. Commit the readable change to `main` and push.
2. Check out `production`, apply the same change **minified**, commit with the same message, push.
3. The push fires a GitHub webhook → the VPS deploys it to the standby slot and switches. Nothing else to do.

The minifier itself is not committed — there is no `package.json` or workflow file, so minification happens outside the repo, before the push. **The server never builds anything: the `production` tree is served byte-for-byte.** Match the existing output style: HTML with `<!doctypehtml>` and unquoted attributes, CSS collapsed to one line, JS with mangled locals.

### The JS bundling trap on `production`

The deployed JS layout is **asymmetric between the two pages**, and it is easy to break:

- `index.html` loads a single `js/index.js` that is `locale.js` + `index.js` + `menu.js` + `popups.js` concatenated and minified into one bundle.
- `projects.html` loads four separate files — `js/locale.js`, `js/menu.js`, `js/popups.js`, `js/projects.js`.

So `locale.js`, `menu.js` and `popups.js` exist **twice** on `production`: once inlined into the `index.js` bundle, once as standalone files. Editing one of those three modules on `main` means updating both copies on `production`, or the two pages silently diverge in behaviour.

This is exactly how the site broke once already: commit `156f7a9 Minify code` created the bundle and deleted the three standalone files, which 404'd `projects.html`; `97bd942 Fix missing js` restored them — as **unminified source copies**, which is why the deployed tree today has minified `index.js`/`projects.js` alongside plain-source `locale.js`/`menu.js`/`popups.js`.

## Production: the VPS

Simon's Hostinger VPS, `148.230.91.169` (Alpine 3.22). **Shared box** — `api.harmlesspleasure.com` and `pointgeek.store` are live co-tenants on the same nginx. Never reload nginx without `nginx -t` first, and don't touch the PHP-FPM pool: it belongs to harmless-pleasure, and this site needs no PHP at all.

Root SSH is password auth; the password lives in `/home/simon/harmless-pleasure/CLAUDE.md` → "Credentials & Secrets" (use `sshpass`).

```
/var/www/portfolio/
├── blue/                    # deployment slot
├── green/                   # deployment slot
├── current -> blue|green    # symlink nginx serves from
├── shared/                  # unused (no runtime state to persist)
└── acme/                    # ACME webroot, deliberately OUTSIDE the slots so
                             # a deploy can't delete a challenge mid-renewal
```

| Piece | Where |
|---|---|
| vhost | `/etc/nginx/http.d/portfolio.conf` |
| deploy script | `/opt/scripts/deploy-static.sh` |
| rollback script | `/opt/scripts/rollback-static.sh` |
| webhook handler | `/var/www/webhook/deploy.php` (shared with harmless-pleasure) |
| deploy log | `/var/log/webhook-deploy.log` |
| access / error log | `/var/log/nginx/portfolio-{access,error}.log` |

### How a push becomes a deploy

`git push origin production` → GitHub webhook (`repos/SimonARG/portfolio/hooks`, id `662282764`) POSTs to `https://api.harmlesspleasure.com/webhook/deploy` → `deploy.php` verifies the HMAC signature, ignores anything that isn't a push to `production`, looks the repo up in its `apps` map and runs `/opt/scripts/deploy-static.sh portfolio https://github.com/SimonARG/portfolio.git production`.

The webhook endpoint lives on the harmless-pleasure vhost because that's where it was already wired; there is no separate endpoint for this site. `deploy.php` routes per-app via `script` and `migrate` keys — the portfolio entry sets `deploy-static.sh` and `migrate => false`, so no `artisan` ever runs for it.

`deploy-static.sh` clones `--depth 1` into a temp dir (a failed clone never touches a slot), refuses to continue if `index.html` didn't land, strips `.git`, populates the standby slot, `chown`s it to `nginx`, then flips the `current` symlink. **No nginx reload** — nginx has no `open_file_cache` here and resolves `root` per request, so the new slot serves from the next request.

The repo is public, so the clone uses HTTPS and needs no deploy key.

### Manual operations

```bash
tail -f /var/log/webhook-deploy.log                    # watch a deploy
readlink -f /var/www/portfolio/current                 # which slot is live
/opt/scripts/deploy-static.sh portfolio https://github.com/SimonARG/portfolio.git production
/opt/scripts/rollback-static.sh portfolio              # flip to the other slot
```

Rollback just flips the symlink back to the previous slot, so it only ever reaches **one** deploy back — the standby slot holds the last release, not a history. To go further back, push the older commit to `production`.

### Redeploy cost

Each deploy re-clones the whole branch, ~55MB of it video. That's fine at this site's change rate. If deploys ever get frequent, move `vids/` into `/var/www/portfolio/shared/` and symlink it into the slots — but note that breaks the "push is the only step" property, since new videos would then need a manual copy to the server.

## DNS, TLS and Cloudflare

The zone moved from Namecheap to **Cloudflare** on 2026-08-06. Apex and `www` are both **A records to `148.230.91.169`, proxied (orange cloud)**, so visitors hit Cloudflare's edge and Cloudflare fetches from this origin.

- **Zone id** `d84bbeba0d21b2a0e68871c9a5fdf1bd`. The API token at `/etc/letsencrypt/cloudflare.ini` on the VPS is account-scoped and covers this zone — the same token that issues the pointgeek wildcard. No separate credential is needed.
- **SSL mode is Full (strict)**, and `always_use_https` is on. Strict is only safe because the origin holds a real Let's Encrypt cert; if that cert ever lapses, Cloudflare will serve 526 rather than fall back. Renewal is automatic via `/etc/periodic/daily/certbot-renew`.
- **The cert is issued by DNS-01, not HTTP-01** (`/opt/scripts/enable-portfolio-tls.sh`). With the records proxied, an HTTP-01 challenge would be validated through Cloudflare's edge and could fail for edge-side reasons that have nothing to do with this box. DNS-01 doesn't care where the A records point, so it also works before any cutover. Cert lineage is `simon-dev.com`, covering `www` + apex.
- **Canonical host is `www`**; the apex 301s to it at the origin, matching the CNAME GitHub Pages used to serve.

### Scrape Shield is off — leave it off

Email Address Obfuscation was on by default and rewrote the footer address at the edge from `simonchasnovsky@gmail.com` into `[email protected]` plus a `/cdn-cgi/scripts/.../email-decode.min.js` decoder. **It was turned off on 2026-08-06** (zone setting `email_obfuscation`): the footer is this site's primary call to action, and anyone reading the page without JS — including some scrapers and preview bots — got `[email protected]` instead of a contact address.

The tradeoff is accepted deliberately: the plain address is now scrapeable by spam harvesters. If it ever needs reverting, it's a single zone setting, but re-enabling it silently changes what the served HTML contains.

**Verifying by checksum is still a trap**, even though the edge no longer rewrites anything. The VPS copy and the old GitHub Pages copy are byte-identical by construction, so a matching md5 does not prove which one answered. Use headers — `server: cloudflare` + `cf-ray` means you reached the edge, `server: GitHub.com` means you hit a stale DNS answer pointing at the old GitHub Pages site. To test the origin directly:

```bash
curl -sI --resolve www.simon-dev.com:443:148.230.91.169 https://www.simon-dev.com/
```

### Caching

Cloudflare caches assets at the edge (`cf-cache-status: HIT`) and passes HTML through (`DYNAMIC`, because the origin sends `Cache-Control: no-cache` on `.html`). Since asset filenames are not content-hashed, a deploy that changes `index.css` or `index.js` can be masked by the edge cache for up to the origin's `max-age` (1h for css/js, 30d for media). If a deploy looks like it didn't land, purge the Cloudflare cache before debugging the server.

## Running it locally

There is no dev server, no build, no lint, no test. Serve the directory and open it:

```bash
python3 -m http.server 8000    # then http://localhost:8000
```

Opening `index.html` over `file://` also works, but `localStorage` behaviour differs by browser.

On a fresh `main` checkout every image, video and CV link 404s, because that media is not tracked here. Pull it from the deployed branch without staging it (it stays untracked, matching `.gitignore`):

```bash
git archive origin/production imgs vids docs | tar -x
```

## Architecture

### Script load order is load-bearing

`index.html` loads, in order: `locale.js`, `menu.js`, `popups.js`, `index.js`. These are plain scripts sharing one global scope — not modules — and they depend on that:

- `menu.js` declares the globals `about`, `socials`, `cv` and the flags `aboutShow`, `socialsShow`, `cvShow`.
- `popups.js` reads those globals directly. It will throw on load if it runs before `menu.js`.

`projects.html` loads `locale.js`, `menu.js`, `popups.js`, `projects.js` — same dependency, plus `projects.js` which is self-contained.

Note the `reactive` parameters threaded through `togglePopup`, `checkAndclosePopup` and `eventTargetRollOver`: they are passed by value and reassigning them does nothing. The `*Show` flags are effectively dead state — the real state is the `.active` class on the element. Don't add logic that trusts those flags.

### Localization: three copies of every string in the DOM

There is no i18n library and no string table. Every translatable string is written three times in the HTML, tagged `class="spanish"`, `class="english"` or `class="japanese"`, with the two inactive ones carrying `hidden`. `locale.js` toggles the `hidden` class across all three `NodeList`s, persists the choice under the `locale` key in `localStorage` (JSON-encoded, e.g. `"es"`), defaults to `es`, and sets `document.documentElement.lang`.

**Adding or editing any user-facing text means editing all three variants.** Japanese variants frequently carry an inline `style="font-size: …"` override because the CJK glyphs need different sizing — preserve those when editing.

The static `lang` attributes in the source are inconsistent (`index.html` is `lang="es"`, `projects.html` is `lang="en-us"`); `locale.js` overwrites it on load, so this is cosmetic.

### Popups

Two independent popup systems, both driven by toggling an `.active` class, both closing on an outside click via a window-level listener that uses `event.target.closest(...)` against the trigger, panel and closer selectors:

- **Menu popups** (`menu.js` + `popups.js`) — About, CV, Socials. Present on both pages.
- **Project popups** (`projects.js`) — one per project, `projects.html` only. Each also plays/pauses its `<video>` in step with the toggle.

### Adding a project

`projects.js` is hand-wired per project — no data structure, no loop. A new project needs, consistently named across all of them:

1. A card in `projects.html`'s `.projects-container`: `<div class="project NAME">` with `imgs/NAME.avif` and a `<button class="btn pj-btn NAME-btn">` carrying all three language spans.
2. A popup: `<div class="project-pu-container NAME-pu">` with a closer `<button class="btn close-project NAME-btn">`, a `<video class="pj-vid NAME-vid" loop muted><source src="vids/NAME.mp4">`, a tech list, a description in all three languages, and a GitHub source link.
3. In `projects.js`: the popup const, the button `querySelectorAll`, the video const, a `forEach` click binding to `toggleProjectPopup`, and a `projectRollover` line inside the window click listener.
4. Any project-specific styling under the `Projects body` / `Project popup` sections of `css/index.css`.
5. The `imgs/` and `vids/` assets — committed **to `gh-pages` only**.

Some existing `<source>` tags declare `type="video/webm"` while pointing at an `.mp4`; browsers sniff and play them anyway. Use `type="video/mp4"` for new ones.

### CSS

One 1682-line stylesheet, `css/index.css`, organized top to bottom by banner comments: Reset → Scrollbars → Utilities → Body → Logo → Index → Menu → Popups → About → Socials/CV → Footer → Projects body → Project popup → Media queries. Add rules to the matching section rather than appending to the end.

- The palette is eight CSS custom properties on `:root`, named by brightness rank: `--1brightest` … `--8darkest`. Use these, never raw hex.
- Layout uses terse utility classes applied in the HTML — `flex-r`/`flex-c`, `f-al-cent`, `f-just-cent`/`f-just-bet`/`f-just-eve`/`f-just-end`, `pos-ab`/`pos-fix`/`pos-rel`, `hide-of-x`/`hide-of-y`, `scroll-of-x`/`scroll-of-y`, `fill-width`/`fill-height`, `hidden`. Reach for these before writing a new rule.
- Breakpoints are mixed `max-width`/`min-width` and are **not** a clean mobile-first ladder: `max-width: 600px`, then `min-width` at 600 / 768 / 1158 / 1303, plus two aspect-ratio queries (`max-aspect-ratio: 1/1` and `min-aspect-ratio: 1/1`) at the end. The aspect-ratio blocks come last and win — check them when a width-based rule appears to have no effect.

### External dependencies

Loaded from CDNs in both pages' `<head>`, not vendored: Google Fonts (Noto Sans, Sofia Sans Extra Condensed) and Font Awesome 6.4.0 (SRI-pinned). All icons are Font Awesome `<i>` tags.
