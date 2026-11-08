import { randomBytes } from "node:crypto";
import type { ApolloServerPlugin } from "@apollo/server";

export const sessionSandbox: ApolloServerPlugin = {
  async serverWillStart() {
    return {
      async renderLandingPage() {
        return {
          async html() {
            const nonce = randomBytes(16).toString("base64");
            return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' https://embeddable-sandbox.cdn.apollographql.com; style-src 'nonce-${nonce}'; frame-src https://sandbox.embed.apollographql.com; connect-src 'self'; base-uri 'none'">
  <title>GraphQL Explorer</title>
  <style nonce="${nonce}">
    #sandbox { position: fixed; inset: 0; }
    #sandbox iframe { display: block; width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <div id="sandbox"></div>
  <script nonce="${nonce}" src="https://embeddable-sandbox.cdn.apollographql.com/v2/embeddable-sandbox.umd.production.min.js"></script>
  <script nonce="${nonce}">
    const endpoint = new URL("/graphql", window.location.origin).href;
    new window.EmbeddedSandbox({
      target: "#sandbox",
      initialEndpoint: endpoint,
      endpointIsEditable: false,
      hideCookieToggle: true,
      allowDynamicStyles: false,
      // Send the app session on every request, even after a saved Sandbox preference.
      handleRequest: (_url, options) => fetch(endpoint, {
        ...options,
        credentials: "same-origin",
        redirect: "error",
      }),
    });
  </script>
</body>
</html>`;
          },
        };
      },
    };
  },
};
