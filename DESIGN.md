# anonymousLink モジュール設計（Node.js / TypeScript）

要件:
1. ランダムな文字列をURLの一部としてウェブサーバー側で受け付ける  
2. パスワードもランダムに生成してアクセス時にパスワード入力が必要  
3. URLとパスワードと対応するユーザーはJSONでローカルに保存  
4. 有効期限がきたらLinkを削除  
5. 生成ボタン付きのページで、新規リンク生成とパスワード表示を行う  

---

## 1. 全体構成（レイヤ）

- `presentation/`（HTTP層）: Express のルーティング・Controller
- `application/`（ユースケース層）: 作成/認証/削除/期限削除などの「やりたいこと」
- `domain/`（ドメイン層）: AnonymousLinkのルール（期限・ロック・削除等）
- `infrastructure/`（実装詳細）: JSON永続化、暗号、時刻
- `jobs/`（定期ジョブ）: 期限切れ削除の実行

依存方向:
`presentation → application → domain`  
`application → (interfaces) → infrastructure(implements)`

---

## 2. 永続化スキーマ（links.json）

`data/links.json`

```ts
type LinkRecord = {
  id: string;
  token: string;
  passwordHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  deletedAt: string | null;
  meta?: { targetUrl?: string; note?: string };
  stats: {
    accessCount: number;
    lastAccessAt: string | null;
    failedAttempts: number;
    lockedUntil: string | null;
  };
};
```

- パスワードは平文で保存しない（bcrypt/argon2等でハッシュ化）
- JSON書き換えは **排他 + atomic write** が必須

---

## 3. モジュール一覧（責務）

### `domain/`
- `entities/AnonymousLink.ts`: エンティティ、ルール
- `valueObjects/*`: Token, OwnerId, PasswordHash
- `policies/LockPolicy.ts`: 失敗回数→ロック方針

### `application/`
- `usecases/CreateAnonymousLinkUseCase.ts`
- `usecases/AuthenticateAnonymousLinkUseCase.ts`
- `usecases/DeleteAnonymousLinkUseCase.ts`
- `usecases/PurgeExpiredLinksUseCase.ts`
- `config/LinkConfig.ts`

### `infrastructure/`
- `repositories/AnonymousLinkRepository.ts`: 永続化インターフェース
- `repositories/JsonAnonymousLinkRepository.ts`: JSON実装
- `storage/JsonFileStore.ts`: atomic write
- `crypto/*`: TokenGenerator, PasswordGenerator, PasswordHasher(bcrypt)
- `time/Clock.ts`: 時刻抽象

### `presentation/`
- `controllers/LinksController.ts`: 管理API + UI用HTMLレスポンス
- `controllers/AnonymousAccessController.ts`: tokenアクセス/認証
- `routes.ts`

### `jobs/`
- `ExpiredLinkJanitor.ts`: 期限切れ削除の実行者（本実装は `setInterval` で呼び出し）

---

## 4. 主要ユースケース

### UI（GET / → POST /ui/links）
- `GET /`: 生成ボタン（フォーム）を表示
- `POST /ui/links`: 新規リンクを生成し、HTML上に `URL` と `Password`（平文）と `ExpiresAt` を表示
  - 画面は最小構成（JS依存なし）
  - 入力は `application/x-www-form-urlencoded`（`express.urlencoded`）

### 作成（POST /links）
1. userId, ttlSeconds, targetUrl等を受け取る
2. token/password生成
3. passwordHash化
4. JSONへ保存（排他 + atomic）
5. url + passwordを返す（平文はこの時だけ）

### アクセス（GET /a/:token → POST /a/:token/auth）
- token存在・期限内・ロック解除を確認
- password照合
- 失敗なら失敗回数加算/必要ならロック
- 成功ならアクセス統計更新 → targetUrlがあればリダイレクト

### 期限削除（ジョブ）
- 定期実行で expiresAt < now のリンクを削除
- 本実装は `setInterval`（60秒間隔）で `ExpiredLinkJanitor` を実行

---

## 5. セキュリティ最低限

- パスワード平文保存しない
- 失敗回数上限 + 一時ロック（簡易ブルートフォース対策）
- ログにパスワードを出さない
- tokenは十分長く（例: 16bytes以上）
- HTTPS前提

---

## 6. ファイル構成

```
src/
  app.ts
  jobs/ExpiredLinkJanitor.ts
  presentation/
    routes.ts
    controllers/
      LinksController.ts
      AnonymousAccessController.ts
  application/
    config/LinkConfig.ts
    usecases/
      CreateAnonymousLinkUseCase.ts
      AuthenticateAnonymousLinkUseCase.ts
      DeleteAnonymousLinkUseCase.ts
      PurgeExpiredLinksUseCase.ts
  domain/
    entities/AnonymousLink.ts
    policies/LockPolicy.ts
    valueObjects/
      Token.ts
      OwnerId.ts
      PasswordHash.ts
  infrastructure/
    repositories/
      AnonymousLinkRepository.ts
      JsonAnonymousLinkRepository.ts
      types.ts
    storage/JsonFileStore.ts
    crypto/
      TokenGenerator.ts
      PasswordGenerator.ts
      PasswordHasher.ts
      BcryptPasswordHasher.ts
      CryptoTokenGenerator.ts
      RandomPasswordGenerator.ts
    time/Clock.ts
data/
  links.json
```
