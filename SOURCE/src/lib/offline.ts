// PWA preparation: registers the service worker, asks it to cache everything
// (shell, fonts, SVGs, every photograph) and verifies the result.

export type OfflineStatus = "idle" | "preparing" | "ready" | "error" | "unsupported";

export interface OfflineResult {
  status: OfflineStatus;
  missing: string[];
}

const url = (p: string) => new URL(p, document.baseURI).href;

export async function prepareOffline(): Promise<OfflineResult> {
  if (!("serviceWorker" in navigator) || !("caches" in window)) return { status: "unsupported", missing: [] };
  if (!import.meta.env.PROD) return { status: "unsupported", missing: [] };
  try {
    await navigator.serviceWorker.register(url("service-worker.js"), { scope: new URL("./", document.baseURI).pathname });
    const reg = await navigator.serviceWorker.ready;
    const worker = reg.active ?? reg.waiting ?? reg.installing;
    if (!worker) throw new Error("no worker");
    void navigator.storage?.persist?.();

    const result = await new Promise<{ ok: boolean; missing: string[] }>((resolve, reject) => {
      const ch = new MessageChannel();
      const timer = window.setTimeout(() => reject(new Error("timeout")), 90_000);
      ch.port1.onmessage = (e) => {
        clearTimeout(timer);
        resolve(e.data);
      };
      worker.postMessage({ type: "PREPARE" }, [ch.port2]);
    });
    return result.ok ? { status: "ready", missing: [] } : { status: "error", missing: result.missing };
  } catch (e) {
    return { status: "error", missing: [String(e)] };
  }
}
