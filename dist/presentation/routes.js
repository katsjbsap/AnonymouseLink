import express from "express";
export function buildRoutes(args) {
    const r = express.Router();
    // UI (minimal)
    r.get("/", (_req, res) => {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>anonymousLink</title>
  </head>
  <body>
    <h1>anonymousLink</h1>
    <form method="POST" action="/ui/links">
      <input type="hidden" name="userId" value="ui" />
      <input type="hidden" name="ttlSeconds" value="3600" />
      <input type="hidden" name="targetUrl" value="https://example.com" />
      <input type="hidden" name="note" value="generated from /" />
      <button type="submit">Generate anonymous link</button>
    </form>
  </body>
</html>`);
    });
    // UI submit
    r.post("/ui/links", args.linksController.createHtml);
    // 管理API
    r.post("/links", args.linksController.create);
    r.delete("/links/:id", args.linksController.delete);
    // anonymous access
    r.get("/a/:token", args.accessController.showPasswordPage);
    r.post("/a/:token/auth", args.accessController.authenticate);
    return r;
}
