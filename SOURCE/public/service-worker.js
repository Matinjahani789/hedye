/* HEDYE — service worker
 * Static, dependency-free. Precaches the app shell (index.html and every
 * asset it references, including url() references inside CSS), local SVGs,
 * icons and every photograph listed in photos/manifest.json.
 *
 * Bump VERSION whenever the cache strategy changes. Old caches are removed
 * on activation. Built asset files are also cached at runtime.
 */
const VERSION = "hedye-v1";
const CORE = `${VERSION}-core`;
const PHOTOS = `${VERSION}-photos`;
const SCOPE = self.registration.scope;

const STATIC = [
  "index.html",
  "manifest.webmanifest",
  "photos/manifest.json",
  "svg/logo.svg",
  "svg/envelope.svg",
  "svg/gift-box.svg",
  "svg/birthday-cake.svg",
  "svg/decorations.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

const abs = (p, base = SCOPE) => new URL(p, base).href;
const sameOrigin = (u) => new URL(u).origin === self.location.origin;

async function putOk(cache, url, { reload = true } = {}) {
  const res = await fetch(url, { cache: reload ? "reload" : "default" });
  if (!res || !res.ok) throw new Error(`${res && res.status} ${url}`);
  await cache.put(url, res.clone());
  return res;
}

/** Discover every URL the shell needs. */
async function discoverShell(core) {
  const urls = new Set(STATIC.map((p) => abs(p)));
  const res = await putOk(core, abs("index.html"));
  await core.put(SCOPE, res.clone()); // the "start_url" navigation
  const html = await res.text();
  for (const m of html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g)) {
    try {
      const u = new URL(m[1], SCOPE).href;
      if (sameOrigin(u)) urls.add(u);
    } catch (_) { /* ignore */ }
  }
  return urls;
}

async function prepare() {
  const missing = [];
  let total = 0;
  const core = await caches.open(CORE);
  const photos = await caches.open(PHOTOS);

  let urls = new Set();
  try {
    urls = await discoverShell(core);
  } catch (e) {
    missing.push("index.html");
  }

  // Shell + CSS referenced resources
  const queue = [...urls];
  const seen = new Set();
  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    total++;
    try {
      const res = await putOk(core, url, { reload: !url.endsWith("photos/manifest.json") || true });
      if (/\.css(\?|$)/.test(url)) {
        const css = await res.clone().text();
        for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
          if (m[1].startsWith("data:")) continue;
          const u = new URL(m[1], url).href;
          if (sameOrigin(u) && !seen.has(u)) queue.push(u);
        }
      }
    } catch (e) {
      missing.push(url.replace(SCOPE, ""));
    }
  }

  // Photographs from the manifest
  try {
    const mres = await fetch(abs("photos/manifest.json"), { cache: "reload" });
    const data = await mres.json();
    const list = Array.isArray(data.photos) ? data.photos : [];
    for (const name of list) {
      total++;
      const url = abs("photos/" + name);
      try {
        await putOk(photos, url);
      } catch (e) {
        missing.push("photos/" + name);
      }
    }
  } catch (e) {
    missing.push("photos/manifest.json");
  }

  // Verification — every item must really be in the cache
  for (const url of seen) {
    if (missing.includes(url.replace(SCOPE, ""))) continue;
    if (!(await core.match(url))) missing.push(url.replace(SCOPE, ""));
  }
  return { ok: missing.length === 0, missing, total };
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(prepare().catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([CORE, PHOTOS]);
      for (const k of await caches.keys()) if (k.startsWith("hedye-") && !keep.has(k)) await caches.delete(k);
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "PREPARE") return;
  const port = event.ports && event.ports[0];
  event.waitUntil(
    prepare()
      .then((r) => port && port.postMessage(r))
      .catch((e) => port && port.postMessage({ ok: false, missing: [String(e)], total: 0 }))
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !sameOrigin(req.url)) return;
  const url = new URL(req.url);

  // Navigations: network first, fall back to the cached shell (offline start)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CORE).then((c) => c.put(abs("index.html"), copy));
          return res;
        })
        .catch(async () => (await caches.match(abs("index.html"))) || (await caches.match(SCOPE)) || Response.error())
    );
    return;
  }

  // Photo manifest: network first so newly added photos show up
  if (url.pathname.endsWith("/photos/manifest.json")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CORE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => (await caches.match(req)) || new Response('{"photos":[]}', { headers: { "Content-Type": "application/json" } }))
    );
    return;
  }

  // Everything else: cache first, then network (and store)
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              const bucket = url.pathname.includes("/photos/") ? PHOTOS : CORE;
              caches.open(bucket).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => Response.error())
    )
  );
});
