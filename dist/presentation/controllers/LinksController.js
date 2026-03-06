export class LinksController {
    createUC;
    deleteUC;
    constructor(createUC, deleteUC) {
        this.createUC = createUC;
        this.deleteUC = deleteUC;
    }
    escapeHtml(input) {
        return input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    // POST /links
    create = async (req, res) => {
        const { userId, ttlSeconds, targetUrl, note } = req.body ?? {};
        const out = await this.createUC.execute({
            userId: String(userId),
            ttlSeconds: Number(ttlSeconds ?? 3600),
            targetUrl: targetUrl ? String(targetUrl) : undefined,
            note: note ? String(note) : undefined
        });
        res.status(201).json(out);
    };
    // POST /ui/links (application/x-www-form-urlencoded)
    createHtml = async (req, res) => {
        const { userId, ttlSeconds, targetUrl, note } = req.body ?? {};
        const out = await this.createUC.execute({
            userId: String(userId ?? "ui"),
            ttlSeconds: Number(ttlSeconds ?? 3600),
            targetUrl: targetUrl ? String(targetUrl) : undefined,
            note: note ? String(note) : undefined
        });
        const url = this.escapeHtml(String(out.url));
        const password = this.escapeHtml(String(out.password));
        const expiresAt = this.escapeHtml(String(out.expiresAt));
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

    <p><a href="/">Generate another</a></p>

    <h2>New link</h2>
    <ul>
      <li>URL: <a href="${url}">${url}</a></li>
      <li>Password: <strong>${password}</strong></li>
      <li>ExpiresAt: ${expiresAt}</li>
    </ul>

    <p>Open the URL and enter the password.</p>
  </body>
</html>`);
    };
    // DELETE /links/:id?userId=...
    delete = async (req, res) => {
        const id = String(req.params.id);
        const userId = String(req.query.userId ?? "");
        await this.deleteUC.execute({ id, userId });
        res.status(204).end();
    };
}
