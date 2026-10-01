# Notes for AI agents

Static site (Nicepage export + hand-written pages), hosted on GitHub Pages at
https://swingshine.fr. No build step: the files in this repo are what gets served.

## Always bump the `?v=` version when you change a CSS or JS file

This is the most frequently forgotten step on this project. Do it in the same
change, not as a follow-up.

Every stylesheet and script is linked with a cache-busting query string:

```html
<link rel="stylesheet" href="nicepage.css?v=20261001-1" media="screen">
<script src="MoonriseBlues.js?v=20261001-1" defer></script>
```

GitHub Pages serves files with `Cache-Control: max-age=600`, and browsers
(Safari on iPhone especially) keep reusing the old file as long as the URL is
unchanged. If you edit a CSS/JS file without changing its `?v=`, the change
looks fine locally but returning visitors keep seeing the old version online.

`serve.py` disables caching, so local testing will never reveal this mistake.

### Rule

When you modify `foo.css` or `foo.js`, update `?v=` for **every** reference to
it in **every** HTML file, then verify none were missed.

- Format: `YYYYMMDD-N` (today's date, `N` starting at 1 and incremented for
  further changes the same day). Use the same value everywhere for one file.
- `nicepage.css` is shared by all pages, including `blog/*.html`, which
  reference it as `../nicepage.css` and `/nicepage.css` (three times in each
  blog post).
- Page-specific files (`index.css`, `Contact.css`, `Schedule.css`,
  `SwingDances.css`, `Equipe.css`, `MoonriseBlues.css`, `MoonriseBlues.js`,
  `banner.js`, ...) are usually linked from a single page.
- `jquery.js` and `nicepage.js` are currently unversioned. If you edit one,
  add a `?v=` to it on every page.
- Replacing an image under the same filename has the same problem: rename the
  file or add a `?v=` to its references.

### Check before finishing

List every reference to the file you changed and make sure they all carry the
new version:

```bash
rg -n 'nicepage\.css\?v=' --glob '*.html'
```

## Other conventions

- Internal page links also carry a `?v=` (e.g. `Contact.html?v=20260818-1`).
  When a page's content changes significantly, bump the links pointing to it
  so visitors don't get a cached copy of the HTML.
- The header/menu (`#sec-3c14`) is duplicated in every HTML file, as a desktop
  menu and a mobile sidenav. Any menu change must be applied to all pages, both
  menus, and the blog pages (which use `../` paths).
- Nicepage utility classes use `!important`; overrides need an ID-scoped
  selector (e.g. `#sec-3c14 ...`) plus `!important`.
- Run the site locally with `python3 serve.py` (http://localhost:8000, also
  reachable from a phone on the same Wi-Fi).
