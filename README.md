askconductor.ai

## Privacy page

`privacy.html` is served at `/privacy` (Cloudflare drops the `.html`). The client's setup
disclaimer and Settings link to it (`config.PRIVACY_URL` in the client). Keep it in step with
the disclaimer and with what the app and server actually collect: a change to either side
means updating both, and if it changes what users agree to, bumping the client's
`DISCLAIMER_VERSION`. It names OpenAI and its 30-day API retention; the disclaimer only says
"our server" (user call 2026-10-27). "No cookies or analytics" stops being true once visit
metrics land; update that line with them. The footer on every page links Privacy and
hello@askconductor.ai (an iCloud+ custom-domain address).
