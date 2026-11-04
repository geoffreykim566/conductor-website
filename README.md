askconductor.ai: one page, deployed from `main` to Cloudflare (`wrangler.jsonc`). Files listed
in `.assetsignore` (`tools/`) aren't deployed.

## Previewing locally

Don't open the HTML files directly (`file://`). Chrome renders the page but macOS blocks it
from loading sibling files like the videos in `media/`.

Serve the folder instead:

```
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/ (or `/privacy.html`, `/download.html`; the download page starts
the DMG download on arrival).

The landing page is `index.html` (from the `landing-v2` draft, shipped with v0.4.4): hero over
the backdrop with the waitlist form, four features as a text-only 2×2 grid, a closing form.
The backdrop `media/hero-bg.*` is still the placeholder gradient.

## Videos

The backdrop is the only video now. Each clip is three files in `media/`: `<name>.webm` (AV1), `<name>.mp4` (H.264 fallback) and
`<name>.webp` (poster, the first frame). Make them from a screen recording with:

```
tools/encode-video.sh ~/Desktop/recording.mov hero-bg     # 1600 wide
```

Record at 16:10 (a Mac screen or window), keep it 6–12 s with a clean loop, and check the
UI text is still sharp after encoding (lower `CRF` / `AV1_CRF` if not). Aim for 1–3 MB a clip.

## Quirks & why

- **Features are text only (v0.4.4):** there were no real recordings yet, so the clip slots were
  dropped (user call). If clips come back, load them lazily (`preload="none"`, `src` filled in a
  screen early, paused off screen) so only the backdrop loads up front.
- **AV1 first, MP4 second.** The `codecs` in each `<source type>` let the browser skip a
  format it can't decode without downloading it (older Macs and iPhones lack AV1 hardware).
- **Reduced motion or Save-Data shows the backdrop's poster** and plays nothing.
- **No GIFs:** a GIF is several times bigger than the same clip as video and can't be paused.
- **The landing page has no download link** (`index.html`, waitlist since v0.4.4). Its two
  forms post to the server's `/v3/waitlist` (`api.askconductor.ai`, or `127.0.0.1:8000` when
  the page is served locally). The server answers the same for a new or repeat email, so the page
  never shows who's on the list. A hidden `company` field is a honeypot. `source` is the URL's
  `utm_source`, else the referrer's host: link socials as `?utm_source=instagram` etc.
- **`download.html` is the only download link.** It's served at `/download`, linked only from
  the invite email, and marked noindex. A shared link gets nobody in: the app asks for an
  approved email. Its `Beta vX.Y.Z` and DMG href are what the `release-client` skill's sed changes.
  The client's update popup opens it too (`DOWNLOAD_URL`).

## Privacy page

The "The waitlist" section covers the signup email (kept apart from usage, Resend sends the
invite). Keep it in step with the server's waitlist (`server/app/api/README.md`).


`privacy.html` is served at `/privacy` (Cloudflare drops the `.html`). The client's setup
disclaimer and Settings link to it (`config.PRIVACY_URL` in the client). Keep it in step with
the disclaimer and with what the app and server actually collect: a change to either side
means updating both, and if it changes what users agree to, bumping the client's
`DISCLAIMER_VERSION`. It names OpenAI and its 30-day API retention; the disclaimer only says
"our server" (user call 2026-10-27). "No cookies or analytics" stops being true once visit
metrics land; update that line with them. The footer on every page links Privacy and
hello@askconductor.ai (an iCloud+ custom-domain address).
