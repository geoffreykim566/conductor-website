// Visit beacon: one POST per page view, sent once the visitor has looked at the page (~2 s
// visible, or a scroll, tap or key). No cookies. README.md, "Visit counting".
(() => {
  const local = ["127.0.0.1", "localhost"].includes(location.hostname);
  const API = local ? "http://127.0.0.1:8000" : "https://api.askconductor.ai";
  const params = new URLSearchParams(location.search);
  const SESSION_IDLE_MS = 30 * 60 * 1000;

  // Storage can be blocked (some private modes): fall back to a fresh id, so the view still counts.
  const get = (kind, key) => { try { return window[kind].getItem(key); } catch (_) { return null; } };
  const set = (kind, key, v) => { try { window[kind].setItem(key, v); } catch (_) {} };
  const del = (kind, key) => { try { window[kind].removeItem(key); } catch (_) {} };

  // ?notrack keeps this browser out of the counts for good (our own visits); ?track undoes it.
  if (params.has("notrack")) set("localStorage", "conductor_notrack", "1");
  if (params.has("track")) del("localStorage", "conductor_notrack");
  if (get("localStorage", "conductor_notrack")) return;

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)));

  let vid = get("localStorage", "conductor_vid");
  if (!vid) { vid = uuid(); set("localStorage", "conductor_vid", vid); }
  // One visit per tab until it sits idle for 30 minutes.
  let sid = get("sessionStorage", "conductor_sid");
  const last = +get("sessionStorage", "conductor_sid_at") || 0;
  if (!sid || Date.now() - last > SESSION_IDLE_MS) { sid = uuid(); set("sessionStorage", "conductor_sid", sid); }
  set("sessionStorage", "conductor_sid_at", String(Date.now()));

  let ref = null;
  try {
    const host = document.referrer && new URL(document.referrer).hostname;
    if (host && host !== location.hostname) ref = host.replace(/^www\./, "");
  } catch (_) {}

  const ENGAGED_MS = 2000;
  const EVENTS = ["scroll", "pointerdown", "keydown", "touchstart"];
  let sent = false, visibleMs = 0, since = null, timer = null;

  const send = () => {
    if (sent || document.visibilityState !== "visible") return;
    sent = true;
    clearTimeout(timer);
    EVENTS.forEach((e) => removeEventListener(e, send, true));
    document.removeEventListener("visibilitychange", onVisibility);
    const p = (k) => (params.get(k) || "").slice(0, 100) || null;
    fetch(API + "/v3/visit", {
      method: "POST", keepalive: true,
      // text/plain keeps it a simple request: no CORS preflight.
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        vid, sid, path: location.pathname, ref,
        utm_source: p("utm_source"), utm_medium: p("utm_medium"), utm_campaign: p("utm_campaign"),
        webdriver: !!navigator.webdriver,
      }),
    }).catch(() => {});
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      since = performance.now();
      timer = setTimeout(send, Math.max(0, ENGAGED_MS - visibleMs));
    } else if (since !== null) {
      visibleMs += performance.now() - since;
      since = null;
      clearTimeout(timer);
    }
  };

  EVENTS.forEach((e) => addEventListener(e, send, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", onVisibility);
  onVisibility();
})();
