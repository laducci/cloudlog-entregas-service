/** Página que renderiza o contrato AsyncAPI dos eventos (o "Swagger dos eventos"). */
export const asyncApiPage = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>CloudLog · Eventos (AsyncAPI)</title>
<link rel="stylesheet" href="https://unpkg.com/@asyncapi/react-component@1.4.10/styles/default.min.css">
</head><body>
<div id="asyncapi"></div>
<script src="https://unpkg.com/@asyncapi/react-component@1.4.10/browser/standalone/index.js"></script>
<script>
  AsyncApiStandalone.render({ schema: { url: "/events/asyncapi.yaml", options: { method: "GET", mode: "cors" } },
    config: { show: { sidebar: true } } }, document.getElementById("asyncapi"));
</script>
</body></html>`;
