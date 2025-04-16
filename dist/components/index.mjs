import * as React from 'react';
import { pwaInfo } from 'virtual:pwa-info';
import { pwaAssetsHead } from 'virtual:pwa-assets/head';

function PWAManifest() {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, pwaInfo ? /* @__PURE__ */ React.createElement(
    "link",
    {
      rel: "manifest",
      href: pwaInfo.webManifest.href,
      crossOrigin: pwaInfo.webManifest.useCredentials ? "use-credentials" : void 0
    }
  ) : null);
}

function PWAAssets() {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, pwaAssetsHead.themeColor ? /* @__PURE__ */ React.createElement("meta", { name: "theme-color", content: pwaAssetsHead.themeColor.content }) : null, pwaAssetsHead.links.map(({ href, ...link }) => /* @__PURE__ */ React.createElement("link", { key: href, href, ...link })), /* @__PURE__ */ React.createElement(PWAManifest, null));
}

export { PWAAssets, PWAManifest };
