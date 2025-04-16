export { cleanupOutdatedCaches, clientsClaimMode, dynamicRoutes, enablePrecaching, navigateFallback, promptForUpdate, routes, ssr, staticRoutes } from 'virtual:vite-pwa/remix/sw';
import { PrecacheEntry } from 'workbox-precaching';

interface PwaOptions {
    manifest?: Array<PrecacheEntry | string>;
}

declare function setupPwa(options?: PwaOptions): void;

export { setupPwa };
export type { PwaOptions };
