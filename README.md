askconductor.ai: one page, deployed from `main` to Cloudflare (`wrangler.jsonc`). Files listed
in `.assetsignore` (`tools/`) aren't deployed.

Only `main` builds: "Builds for non-production branches" is off in the Worker's settings. Until
2026-11-13 it was on with `npx wrangler deploy` as the version command, so every pushed branch
went live. Preview on the local stack (below), not a pushed branch.

## Previewing locally

Don't open the HTML files directly (`file://`). Chrome renders the page but macOS blocks it
from loading sibling files like the videos in `media/`.

Serve the folder instead:

```
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/ (or `/privacy.html`, `/download.html`; the download page starts
the DMG download on arrival).

The landing page is `index.html`: one Logic window pinned to the screen. A scroll grows it and
blurs it, Conductor's panel comes out of the corner, and three stops step through (Learn as you
create, Your session your call, Conductor does the rest), by scroll, the dots, the arrow keys or a
sideways swipe. Each stop's pills pick a demo and the demos loop:
- **Learn as you create:** Visual pointers (a guided Compressor run, Explain on) and Term definitions.
- **Your session, your call:** Run and Revert (plug-in edits, a ⌘D copy, an edit on the copy) and
  Keybind change detection (the key-commands ask, Yes, the read, the card pressing the user's key).
- **Conductor does the rest:** example requests (Supermassive, Mastering Assistant, Stem Splitter,
  buffer size).
Waitlist forms in the top bar and the closing section.

## Media

All captures are single Logic windows from live runs on Logic Pro 13, taken with the client's
`./dev.sh capture <scene>` (client `dev/README.md` "Capturing demos"; scenes `dev/scenes/site-*.toml`).
Scene coordinates in the page are Logic's main window's own 1920×960 pixels, so a replacement
capture must keep that size or the windows land in the wrong place.
- `scene/logic-clean` (11-09): the main window behind every stop. `scene/eq-*`, `scene/compressor`:
  V15 layers the page still carries but no demo shows.
- `s1/` (`site-stop1`, 11-15): the guided Compressor run. `main`, `frame-search`, `frame-pick` are
  whole main-window frames (the slot menu drawn in) for the close-up; `compressor` the result.
- `s2/` (`site-stop2`, 11-15): Run and Revert's windows as they ended, plus `eq-before` and
  `comp-before` (the Compressor at defaults, from `site-stop1`) for the change landing.
- `s3/` (`site-buffer`, 11-14/15): Settings > Audio at 256, with the dropdown open, and at 128.
- `s3x/` (`site-verb`, `site-master`, `site-stems`, 11-15): each example's window before and after.

`tools/encode-video.sh` is still there for clips (AV1 `.webm`, H.264 `.mp4`, `.webp` poster,
1600 wide); the page has none today.

## Quirks & why

- **The Conductor panel is HTML, not a screenshot**, rebuilt from the app's theme tokens, so it
  stays sharp at any zoom. Replies and cards are the app's real text from the captures, trimmed
  to the app's own sentences (user call). Glossary underlines match `seed/glossary.json`.
- **Demos happen in windows, not on the blurred Logic behind them** (user call 11-15): a window
  opens, then its change lands with its pill. Windows stack down-right as Logic opens them. Explain
  pointers sit on a 1.6× close-up of the strip between the bubble and the panel. Timings are faster
  than the real runs (pointers ~5 s vs 11 s, Run and Revert ~7 s vs 16 s, its Revert 3 s vs ~20 s).
- **The capture's menu and sheet shots hold the whole main window**, not the menu's bounds (a
  capture-tool bug): the page uses them as full frames (the close-up) or crops them (Stem Splitter).
- **Mouse and trackpad page one stop per gesture** (JS); touch uses CSS scroll snap. Momentum
  after a swipe is ignored until the movement rises again or changes direction.
- **Reduced motion** turns off transitions and the loops' delays.
- **One look toggle** in the top bar, dark (B) by default since V15; `?v=a` opens light, the pick
  is kept per browser in local storage (`scene-look-dark`).
- **`privacy.html`, `terms.html` and `download.html` copy the landing page's look:** its colour
  tokens (both looks), font, top-bar wordmark, look toggle, and footer. They default to dark and
  share the landing page's storage key (`scene-look-dark`) and `?v=a`; the look is set in `<head>`
  so a light pick doesn't flash dark. A change to the landing page's tokens or footer means updating both pages.
- **Every footer carries Apple's trademark credit** ("Logic Pro is a trademark of Apple Inc., registered
  in the U.S. and other countries and regions."), as Apple's third-party guidelines ask, next to
  "Not affiliated with Apple". Keep it on any new page that names Logic Pro.
- **The landing page has no download link** (`index.html`, waitlist since v0.4.4). Its two
  forms post to the server's `/v3/waitlist` (`api.askconductor.ai`, or `127.0.0.1:8000` when
  the page is served locally). The server answers the same for a new or repeat email, so the page
  never shows who's on the list. A hidden `company` field is a honeypot. `source` is the URL's
  `utm_source`, else the referrer's host: link socials as `?utm_source=instagram` etc.
- **The visit beacon waits for a look** (~2 s visible, or a scroll, tap or key), so link-preview
  fetchers and tabs opened in the background and never viewed aren't counted. It sends
  `text/plain` so the cross-origin POST needs no CORS preflight. The visitor id is in local
  storage (one per browser, so "unique" is an upper bound); the visit id is per tab and renews
  after 30 minutes idle. Bots are dropped on the server, by user agent and `navigator.webdriver`.
- **`_redirects` works on Workers static assets** (checked with `wrangler dev` 11-06: `/ig` → 302,
  the file itself isn't served).
- **`download.html` is the only download link.** It's served at `/download`, linked only from
  the invite email, and marked noindex. A shared link gets nobody in: the app asks for an
  approved email. Its `Beta vX.Y.Z` and DMG href are what the `release-client` skill's sed changes.
  The client's update popup opens it too (`DOWNLOAD_URL`).

## Visit counting

`visit.js` (loaded by every page) posts one beacon per page view to the server's `/v3/visit`,
which feeds the admin Website tab (`server/app/api/README.md`, Funnel). No cookies, no third party.

- **Short links:** `/ig` `/tt` `/yt` `/x` `/th` `/fb` `/rd` `/dc` redirect to `/?utm_source=<tag>`
  (`_redirects`, 302). Put these in bios and posts: the tag is the only source that survives
  in-app browsers. A new platform is a line here plus its tag in `server/app/core/channel.py`.
- **Our own visits:** open `askconductor.ai/?notrack` once in each browser you use; `?track` undoes it.
- **The visitor id renews after 13 months** (`conductor_vid_at`; an id from before this gets its
  date on its next visit). EU rules want consent for anything stored on a visitor's device; the
  user call (2026-11-13) was to keep the id, disclose it with the `?notrack` opt-out and cap
  its life at 13 months (CNIL's audience-measurement exemption works this way) rather than add a
  consent banner. Removing it would cost the admin's unique and new visitors and first-visit channel.

## Privacy page

The "The waitlist" section covers the signup email (kept with the Mac's record since server
migration 018, Resend sends the invite). Keep it in step with the server's waitlist (`server/app/api/README.md`).


`privacy.html` is served at `/privacy` (Cloudflare drops the `.html`). The client's setup
disclaimer and About Conductor link to it (`config.PRIVACY_URL` in the client). Keep it in step with
the disclaimer and with what the app and server actually collect: a change to either side
means updating both, and if it changes what users agree to, bumping the client's
`DISCLAIMER_VERSION`. It names OpenAI, which keeps API data up to 30 days for abuse checks (longer
if the law requires) and sends web research queries to its search services; the disclaimer only says
"our server" (user call 2026-10-27). The "never stored" lines say "on our server" because OpenAI
holds what it receives for that window (user call 2026-11-13). "This website" describes the visit
beacon: keep it in step with `visit.js` and the server's `visits` table. The footer on every page
links Privacy and
hello@askconductor.ai (an iCloud+ custom-domain address).

## Beta terms

`terms.html` (served at `/terms`, linked in every footer) holds the six beta lines the client's setup
screen links (`config.TERMS_URL`): as is, keep backups, auto-run is at your own risk, no liability to
the extent the law allows, use only for your own work in Logic and lawfully, and we can limit or end
access. The last two went in now because OpenAI's services agreement (3.3, 8.1) makes us responsible
for what users do and requires that we can cut a user off, so they don't wait for the full terms of
service (user call 2026-11-13). Consent stays v3, because v3 has not shipped. The terms go on their
own page, not in the popup (shorter) and not in the privacy policy (a notice, not an agreement,
so its terms may not bind).
The popup's "By clicking Continue, you agree to the Beta terms and Privacy policy", right above the
button, is the agreement; naming the button follows the 2025 sign-in-wrap rulings. Written flat, like
other beta terms: no reassurance, since a promise about safety would undercut the disclaimer. The
full terms of service (usage rules, a lawyer's wording) waits for the public launch (`legal-log.md`).
A change to these terms bumps the client's `DISCLAIMER_VERSION`.

The terms and the privacy page say 18 or older, not "under 13", because OpenAI's services
agreement (3.3(c)) bars minors without a parent's consent. There is no age gate in the app; the
click-through agreement carries it (user call 2026-11-13).

**EU and UK (user call 2026-11-13):** EU and UK people may join the beta, so the page carries
GDPR Art. 13's items: who's responsible ("Conductor", not a person or company, until there's an
LLC to name), the legal basis for each use, the US transfer under each provider's standard
contractual clauses, the full rights list with a one-month answer, the right to complain, and
deletions reaching backups and logs within ~3 months (Railway keeps logs up to 90 days and
they hold replies and queries; user call 2026-11-14). The EU and UK representatives (Art. 27) are
deferred, a known gap (`legal-log.md`). None of this changes what users agree to, so no
`DISCLAIMER_VERSION` bump.
