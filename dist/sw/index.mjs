import { version, promptForUpdate, enablePrecaching, navigateFallback, cleanupOutdatedCaches, clientsClaimMode } from 'virtual:vite-pwa/remix/sw';
export { cleanupOutdatedCaches, clientsClaimMode, dynamicRoutes, enablePrecaching, navigateFallback, promptForUpdate, routes, ssr, staticRoutes } from 'virtual:vite-pwa/remix/sw';
import { precacheAndRoute, cleanupOutdatedCaches as cleanupOutdatedCaches$1, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

function setupPwa(options = {}) {
  if (import.meta.env.DEV) {
    console.info(
      `React Router PWA v${version}, using ${promptForUpdate ? "prompt-for-update" : "auto-update"} register mode`
    );
  }
  if (promptForUpdate) {
    self.addEventListener("message", (event) => {
      if (event.data.type === "SKIP_WAITING")
        self.skipWaiting();
    });
  }
  if (enablePrecaching) {
    const manifest = options.manifest ?? [];
    if (import.meta.env.DEV) {
      if (navigateFallback)
        manifest.push({ url: navigateFallback, revision: Math.random().toString() });
    }
    precacheAndRoute(manifest);
  }
  if (cleanupOutdatedCaches)
    cleanupOutdatedCaches$1();
  if (navigateFallback) {
    registerRoute(new NavigationRoute(createHandlerBoundToURL(navigateFallback), {
      allowlist: [/^\/$/]
    }));
  }
  if (!promptForUpdate) {
    if (clientsClaimMode === "auto") {
      self.addEventListener("activate", async () => {
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => {
          client.navigate(client.url);
        });
      });
      self.skipWaiting();
    } else {
      self.skipWaiting();
      if (clientsClaimMode)
        clientsClaim();
    }
  }
}

export { setupPwa };
