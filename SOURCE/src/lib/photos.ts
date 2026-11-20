// Photo discovery.
//  1. Project photos: exactly the files listed in photos/manifest.json (never invented).
//  2. Optional device photos: picked in-app and stored in IndexedDB on this device.

export interface PhotoItem {
  id: string;
  src: string;
  name: string;
  source: "project" | "device";
}

const EXT = /\.(jpe?g|png|webp|avif)$/i;
const DB = "hedye-gift";
const STORE = "photos";

export async function loadManifest(): Promise<PhotoItem[]> {
  try {
    const res = await fetch(new URL("photos/manifest.json", document.baseURI).href, { cache: "no-cache" });
    if (!res.ok) return [];
    const data = (await res.json()) as { photos?: unknown };
    const list = Array.isArray(data.photos) ? data.photos.filter((p): p is string => typeof p === "string" && EXT.test(p)) : [];
    return list.map((name) => ({
      id: "p:" + name,
      name,
      source: "project" as const,
      src: new URL("photos/" + encodeURI(name), document.baseURI).href,
    }));
  } catch {
    return [];
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no idb"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadDevicePhotos(): Promise<PhotoItem[]> {
  try {
    const db = await openDb();
    const rows = await new Promise<{ id: number; name: string; blob: Blob }[]>((resolve, reject) => {
      const r = db.transaction(STORE).objectStore(STORE).getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    db.close();
    return rows.map((r) => ({ id: "d:" + r.id, name: r.name, source: "device" as const, src: URL.createObjectURL(r.blob) }));
  } catch {
    return [];
  }
}

export async function saveDevicePhotos(files: File[]): Promise<{ saved: number; error?: string }> {
  const imgs = files.filter((f) => f.type.startsWith("image/") || EXT.test(f.name));
  if (!imgs.length) return { saved: 0, error: "هیچ تصویری انتخاب نشد." };
  try {
    const db = await openDb();
    let saved = 0;
    for (const f of imgs) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).add({ name: f.name, blob: f });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      saved++;
    }
    db.close();
    return { saved };
  } catch (e) {
    const quota = e instanceof DOMException && e.name === "QuotaExceededError";
    return { saved: 0, error: quota ? "فضای ذخیره‌سازی مرورگر پر است." : "ذخیره‌ی عکس‌ها روی این دستگاه ممکن نشد." };
  }
}

export async function loadAllPhotos(): Promise<PhotoItem[]> {
  const [a, b] = await Promise.all([loadManifest(), loadDevicePhotos()]);
  return [...a, ...b];
}
