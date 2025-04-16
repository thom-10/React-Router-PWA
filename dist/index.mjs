import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync } from 'node:fs';
import { lstat, rm, access, constants, mkdir, writeFile } from 'node:fs/promises';

const version = "0.1.3";

const VIRTUAL_REMIX_SW = "virtual:vite-pwa/remix/sw";
const RESOLVED_VIRTUAL_REMIX_SW = `\0${VIRTUAL_REMIX_SW}`;
function SWPlugin(ctx) {
  return {
    name: "vite-pwa:remix:sw",
    enforce: "pre",
    resolveId(id, _, options) {
      return !options.ssr && id === VIRTUAL_REMIX_SW ? RESOLVED_VIRTUAL_REMIX_SW : null;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_REMIX_SW) {
        const {
          version,
          enablePrecaching,
          navigateFallback,
          clientsClaimMode,
          cleanupOutdatedCaches,
          promptForUpdate
        } = ctx.sw;
        const allRoutes = Object.values(ctx.resolvedConfig.routes).filter((r) => {
          return r.index !== true && r.id !== "root";
        });
        const staticRoutes = allRoutes.filter((r) => r.path && !r.path.includes(":"));
        const dynamicRoutes = allRoutes.filter((r) => r.path && r.path.includes(":"));
        return `export const version = '${version}'
export const ssr = ${ctx.resolvedConfig.ssr}
export const enablePrecaching = ${enablePrecaching}
export const navigateFallback = ${JSON.stringify(navigateFallback)}
export const clientsClaimMode = ${JSON.stringify(clientsClaimMode)}
export const cleanupOutdatedCaches = ${cleanupOutdatedCaches}
export const promptForUpdate = ${promptForUpdate}
export const staticRoutes = ${JSON.stringify(staticRoutes)}
export const dynamicRoutes = ${JSON.stringify(dynamicRoutes)}
export const routes = ${JSON.stringify(allRoutes)}
`;
      }
    }
  };
}

function loadReactRouterConfig() {
  const rootDirectory = process.env.REACT_ROUTER_ROOT ?? process.cwd();
  const storeFilePath = `${rootDirectory}/.react-router/react-router-pwa-rotues.json`;
  const reactRouterResolvedConfig = readFileSync(storeFilePath);
  return JSON.parse(reactRouterResolvedConfig.toString());
}
function configurePWA(ctx, pwaOptions, isReactRouter = false) {
  const pwa = preparePWAOptions(ctx, pwaOptions);
  pwa.integration = {
    closeBundleOrder: "post",
    async configureOptions(viteOptions, options) {
      var _a;
      if (isReactRouter)
        ctx.resolvedConfig = loadReactRouterConfig();
      const { ssr, basename, buildDirectory } = ctx.resolvedConfig;
      let config;
      if (options.strategies === "injectManifest") {
        const swOptions = ctx.options.injectManifest;
        ctx.sw.promptForUpdate = options.registerType !== "autoUpdate";
        ctx.sw.cleanupOutdatedCaches = swOptions.cleanupOutdatedCaches ?? true;
        options.injectManifest = options.injectManifest ?? {
          injectionPoint: "self.__WB_MANIFEST"
        };
        if ("injectionPoint" in options.injectManifest)
          ctx.sw.enablePrecaching = options.injectManifest.injectionPoint !== void 0;
        else
          ctx.sw.enablePrecaching = true;
        if (ctx.sw.enablePrecaching) {
          if (ssr)
            ctx.sw.navigateFallback = basename || viteOptions.base || "/";
          else
            ctx.sw.navigateFallback = "index.html";
        }
        (_a = options.injectManifest).plugins ?? (_a.plugins = []);
        options.injectManifest.plugins.push(SWPlugin(ctx));
        config = options.injectManifest;
      } else {
        options.workbox = options.workbox ?? {};
        if (!("navigateFallback" in options.workbox)) {
          if (ssr)
            options.workbox.navigateFallback = basename ?? viteOptions.base ?? "/";
          else
            options.workbox.navigateFallback = "index.html";
        }
        if (ssr && !("navigateFallbackAllowlist" in options.workbox))
          options.workbox.navigateFallbackAllowlist = [new RegExp(`^${options.workbox.navigateFallback}$`)];
        config = options.workbox;
      }
      if (!("globDirectory" in config))
        config.globDirectory = `${buildDirectory}/client`;
      if (!("dontCacheBustURLsMatching" in config))
        config.dontCacheBustURLsMatching = /assets\//;
    },
    async beforeBuildServiceWorker(options) {
      var _a, _b;
      const { appDirectory, routes, ssr } = ctx.resolvedConfig;
      if (ctx.build && ssr) {
        const entryPoint = Object.values(routes).find((r) => r.index === true);
        if (entryPoint) {
          const path = resolve(appDirectory, entryPoint.file);
          if (options.strategies === "injectManifest") {
            (_a = options.injectManifest).manifestTransforms ?? (_a.manifestTransforms = []);
            options.injectManifest.manifestTransforms.push(async (entries) => {
              entries.push({
                url: options.base,
                revision: await createRevision(path),
                size: await lstat(path).then((s) => s.size)
              });
              return { manifest: entries, warnings: [] };
            });
          } else {
            (_b = options.workbox).additionalManifestEntries ?? (_b.additionalManifestEntries = []);
            options.workbox.additionalManifestEntries.push({
              url: options.base,
              revision: await createRevision(path)
            });
          }
        }
        ctx.resolvedPWAOptions = options;
      }
    }
  };
  return pwa;
}
async function createRevision(path) {
  return await new Promise((resolve, reject) => {
    const cHash = createHash("MD5");
    const stream = createReadStream(path, "utf-8");
    stream.on("error", (err) => {
      reject(err);
    });
    stream.on("data", (chunk) => cHash.update(chunk));
    stream.on("end", () => {
      resolve(cHash.digest("hex"));
    });
  });
}
function preparePWAOptions(ctx, pwaOptions) {
  const { swOptions: remix, ...pwa } = pwaOptions;
  const {
    injectManifest = {}
  } = remix ?? {};
  const {
    cleanupOutdatedCaches = true,
    clientsClaimMode = "auto"
  } = injectManifest;
  ctx.options = {
    injectManifest: {
      cleanupOutdatedCaches,
      clientsClaimMode
    }
  };
  return pwa;
}

async function cleanupServerFolder(ctx, manifestName) {
  const { buildDirectory } = ctx.resolvedConfig;
  try {
    await Promise.all([
      resolve(buildDirectory, "server/registerSW.js"),
      manifestName ? resolve(buildDirectory, `server/${manifestName}`) : void 0
    ].map(async (file) => {
      if (!file)
        return;
      try {
        await rm(file, { force: true, recursive: false });
      } catch {
      }
    }));
  } catch {
  }
}
function BuildPlugin(ctx) {
  return {
    name: "vite-pwa:reactrouter:build",
    apply: "build",
    configResolved(config) {
      if (!config.build.ssr)
        ctx.api = config.plugins.find((p) => p.name === "vite-plugin-pwa")?.api;
    },
    async onBuildEnd() {
      ctx.build = true;
      await ctx.api?.generateSW();
      if (ctx.resolvedConfig?.ssr && ctx.resolvedPWAOptions)
        await cleanupServerFolder(ctx, ctx.resolvedPWAOptions.manifestFilename);
    }
  };
}

function MainPlugin(ctx, isReactRouter = false) {
  return (config = {}) => {
    const pwaOptions = configurePWA(ctx, config, isReactRouter);
    return [
      VitePWA(pwaOptions),
      SWPlugin(ctx),
      BuildPlugin(ctx)
    ];
  };
}

function RemixPreset(ctx) {
  return () => {
    return {
      name: "@vite-pwa/remix/preset",
      remixConfig() {
        return {
          async buildEnd({ viteConfig }) {
            const remixPwaBuildPlugin = viteConfig.plugins.find((plugin) => plugin.name === "vite-pwa:reactrouter:build");
            if (!remixPwaBuildPlugin)
              throw new Error("Remix PWA Plugin must be preset in vite.config");
            await remixPwaBuildPlugin.onBuildEnd();
          }
        };
      },
      remixConfigResolved({ remixConfig }) {
        ctx.resolvedConfig = {
          ...remixConfig,
          prerender: false,
          buildEnd: void 0,
          future: void 0
        };
      }
    };
  };
}
function ReactRouterPreset() {
  return {
    name: "@vite-pwa/remix/preset",
    reactRouterConfig() {
      return {
        async buildEnd({ viteConfig }) {
          const remixPwaBuildPlugin = viteConfig.plugins.find((plugin) => plugin.name === "vite-pwa:reactrouter:build");
          if (!remixPwaBuildPlugin)
            throw new Error("Remix PWA Plugin must be preset in vite.config");
          await remixPwaBuildPlugin.onBuildEnd();
        }
      };
    },
    async reactRouterConfigResolved({ reactRouterConfig }) {
      const rootDirectory = process.env.REACT_ROUTER_ROOT ?? process.cwd();
      try {
        await access(".react-router", constants.F_OK);
      } catch (err) {
        mkdir(".react-router");
      }
      const storeFilePath = `${rootDirectory}/.react-router/react-router-pwa-rotues.json`;
      await writeFile(storeFilePath, JSON.stringify(reactRouterConfig));
    }
  };
}

function RemixVitePWA() {
  const ctx = {
    options: void 0,
    resolvedConfig: void 0,
    api: void 0,
    build: false,
    sw: {
      version,
      enablePrecaching: true,
      navigateFallback: void 0,
      clientsClaimMode: "auto",
      cleanupOutdatedCaches: true,
      promptForUpdate: false,
      routes: []
    }
  };
  return {
    RemixVitePWAPlugin: MainPlugin(ctx),
    RemixPWAPreset: RemixPreset(ctx)
  };
}
function ReactRouterVitePWA() {
  const ctx = {
    options: void 0,
    resolvedConfig: void 0,
    api: void 0,
    build: false,
    sw: {
      version,
      enablePrecaching: true,
      navigateFallback: void 0,
      clientsClaimMode: "auto",
      cleanupOutdatedCaches: true,
      promptForUpdate: false,
      routes: []
    }
  };
  return {
    ReactRouterVitePWAPlugin: MainPlugin(ctx, true)
  };
}

export { ReactRouterPreset, ReactRouterVitePWA, RemixVitePWA };
