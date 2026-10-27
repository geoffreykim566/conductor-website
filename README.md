askconductor.ai: one page, deployed from `main` to Cloudflare (`wrangler.jsonc`). Files listed
in `.assetsignore` (`tools/`) aren't deployed.

## Previewing locally

Don't open the HTML files directly (`file://`). Chrome renders the page but macOS blocks it
from loading sibling files like the videos in `media/`.

Serve the folder instead:

```
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/preview.html (or index.html).

`preview.html` is the scratch copy for trying changes. Copy it over `index.html` when it's ready
to ship.

## Videos

Each clip is three files in `media/`: `<name>.webm` (AV1), `<name>.mp4` (H.264 fallback) and
`<name>.webp` (poster, the first frame). Make them from a screen recording with:

```
tools/encode-video.sh ~/Desktop/recording.mov hero        # hero is 1600 wide
tools/encode-video.sh ~/Desktop/recording.mov stems 1280  # feature clips are 1280 wide
```

Record at 16:10 (a Mac screen or window), keep it 6–12 s with a clean loop, and check the
UI text is still sharp after encoding (lower `CRF` / `AV1_CRF` if not). Aim for 1–3 MB a clip.

## Quirks & why

- **Only the hero video loads up front.** Feature clips have `preload="none"` and their
  `src` in `data-src`; the page script fills them in a screen before they scroll into view and
  pauses any clip that's off screen, so at most two decode at once. That keeps scrolling smooth.
- **AV1 first, MP4 second.** The `codecs` in each `<source type>` let the browser skip a
  format it can't decode without downloading it (older Macs and iPhones lack AV1 hardware).
- **Reduced motion or Save-Data shows posters with play controls** and downloads nothing.
- **No GIFs:** a GIF is several times bigger than the same clip as video and can't be paused.
- **Download links appear twice** (hero, final block), plus `Beta vX.Y.Z`
  twice. The `release-client` skill's sed must replace all of them.

## Privacy page

`privacy.html` is served at `/privacy` (Cloudflare drops the `.html`). The client's setup
disclaimer and Settings link to it (`config.PRIVACY_URL` in the client). Keep it in step with
the disclaimer and with what the app and server actually collect: a change to either side
means updating both, and if it changes what users agree to, bumping the client's
`DISCLAIMER_VERSION`. It names OpenAI and its 30-day API retention; the disclaimer only says
"our server" (user call 2026-10-27). "No cookies or analytics" stops being true once visit
metrics land; update that line with them. The footer on every page links Privacy and
hello@askconductor.ai (an iCloud+ custom-domain address).
