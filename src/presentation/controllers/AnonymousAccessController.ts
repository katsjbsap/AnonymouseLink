import type { Request, Response } from "express";
import type { AuthenticateAnonymousLinkUseCase } from "../../application/usecases/AuthenticateAnonymousLinkUseCase.js";

export class AnonymousAccessController {
  constructor(private authUC: AuthenticateAnonymousLinkUseCase) {}

  // GET /a/:token
  showPasswordPage = async (req: Request, res: Response) => {
    const token = String(req.params.token);

    // シンプルにHTMLフォームを返す（UIは最小）
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html>
<html>
  <head><meta charset="utf-8"><title>anonymousLink</title></head>
  <body>
    <h1>anonymousLink</h1>
    <form method="POST" action="/a/${encodeURIComponent(token)}/auth">
      <label>Password: <input type="password" name="password" /></label>
      <button type="submit">Enter</button>
    </form>
  </body>
</html>`);
  };

  // POST /a/:token/auth
  authenticate = async (req: Request, res: Response) => {
    const token = String(req.params.token);
    const password = String(req.body?.password ?? "");

    const out = await this.authUC.execute({ token, password });

    if (!out.ok) {
      res.status(401).json(out);
      return;
    }

    if (out.redirectTo) {
      res.redirect(302, out.redirectTo);
      return;
    }

    res.status(200).json({ ok: true });
  };
}
