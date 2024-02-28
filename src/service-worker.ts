import { timestamp, files, shell } from "@sapper/service-worker";

const ASSETS = `cache${timestamp}`;

// `shell` es una matriz de todos los archivos generados por el paquete,
// `files` es una matriz de todo lo que se encuentra en el directorio `static`
const to_cache = (shell as string[]).concat(files as string[]);
const staticAssets = new Set(to_cache);

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(ASSETS)
      .then((cache) => cache.addAll(to_cache))
      .then(() => {
        ((self as any) as ServiceWorkerGlobalScope).skipWaiting();
      })
  );
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      // delete old caches
      for (const key of keys) {
        if (key !== ASSETS) await caches.delete(key);
      }

      ((self as any) as ServiceWorkerGlobalScope).clients.claim();
    })
  );
});

/**
 * Obtenga el activo de la red y guárdelo en el caché.
 * Recurrir al caché si el usuario está desconectado.
 */
async function fetchAndCache(request: Request) {
  const cache = await caches.open(`offline${timestamp}`);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const response = await cache.match(request);
    if (response) return response;

    throw err;
  }
}

self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET" || event.request.headers.has("range"))
    return;

  const url = new URL(event.request.url);

  // no intentes manejar, p.e. datos: URI
  const isHttp = url.protocol.startsWith("http");
  const isDevServerRequest =
    url.hostname === self.location.hostname && url.port !== self.location.port;
  const isStaticAsset =
    url.host === self.location.host && staticAssets.has(url.pathname);
  const skipBecauseUncached =
    event.request.cache === "only-if-cached" && !isStaticAsset;

  if (isHttp && !isDevServerRequest && !skipBecauseUncached) {
    event.respondWith(
      (async () => {
	// siempre entrega archivos estáticos y activos generados por paquetes desde la caché.
        // si tu aplicación tiene otras URL con datos que nunca cambiarán,
        // establece esta variable en verdadero para ellos y solo se recuperarán una vez.
        const cachedAsset =
          isStaticAsset && (await caches.match(event.request));

	// para las páginas, es posible que quieras servir un archivo shell `service-worker-index.html`,
        // que Sapper ha generado para ti. No es adecuado para todos
        // aplicación, pero si es adecuada para ti entonces descomenta esta sección
        /*
				if (!cachedAsset && url.origin === self.origin && routes.find(route => route.pattern.test(url.pathname))) {
					return caches.match('/service-worker-index.html');
				}
				*/

        return cachedAsset || fetchAndCache(event.request);
      })()
    );
  }
});
