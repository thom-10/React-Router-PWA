import * as _remix_run_dev_dist_vite_plugin from '@remix-run/dev/dist/vite/plugin';
import * as vite from 'vite';
import { VitePWAOptions } from 'vite-plugin-pwa';
import { Preset } from '@react-router/dev/config';

interface RemixPWAInjectManifest {
    /**
     * Remove old assets once the new service worker activated?
     *
     * @default true
     */
    cleanupOutdatedCaches?: boolean;
    /**
     * This option is about the Automatic reload when a new service worker is activated.
     *
     * If you use any Vite PWA virtual module, you **MUST** to set this option to `true`.
     *
     * With `auto`, the page will be reloaded without using a Vite PWA virtual module.
     *
     * **NOTE**: this option will be ignored if `registerType` is `autoUpdate` in your PWA options: the default value is `prompt`.
     *
     * @default 'auto'
     * @see https://vite-pwa-org.netlify.app/guide/auto-update.html
     */
    clientsClaimMode?: 'auto' | boolean;
}
interface RemixPWASWOptions {
    /**
     * Options when using `@vite-pwa/remix/sw` module in your custom service worker
     */
    injectManifest?: RemixPWAInjectManifest;
}
interface RemixPWAOptions extends Partial<VitePWAOptions> {
    remix?: RemixPWASWOptions;
}
interface ReactRouterPWASWOptions {
    /**
     * Options when using `@vite-pwa/remix/sw` module in your custom service worker
     */
    injectManifest?: RemixPWAInjectManifest;
}
interface ReactRouterPWAOptions extends Partial<VitePWAOptions> {
    swOptions?: ReactRouterPWASWOptions;
}

declare function ReactRouterPreset(): Preset;

declare function RemixVitePWA(): {
    RemixVitePWAPlugin: (config?: ReactRouterPWAOptions) => vite.PluginOption;
    RemixPWAPreset: () => {
        name: string;
        remixConfig(): {
            buildEnd({ viteConfig }: {
                viteConfig: vite.ResolvedConfig;
            }): Promise<void>;
        };
        remixConfigResolved({ remixConfig }: {
            remixConfig: _remix_run_dev_dist_vite_plugin.ResolvedVitePluginConfig;
        }): void;
    };
};
declare function ReactRouterVitePWA(): {
    ReactRouterVitePWAPlugin: (config?: ReactRouterPWAOptions) => vite.PluginOption;
};

export { ReactRouterPreset, ReactRouterVitePWA, RemixVitePWA };
export type { ReactRouterPWAOptions, ReactRouterPWASWOptions, RemixPWAInjectManifest, RemixPWAOptions, RemixPWASWOptions };
