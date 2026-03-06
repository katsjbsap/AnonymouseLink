import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JsonFileStore } from "./infrastructure/storage/JsonFileStore.js";
import { JsonAnonymousLinkRepository } from "./infrastructure/repositories/JsonAnonymousLinkRepository.js";
import type { LinksFile } from "./infrastructure/repositories/types.js";

import { CryptoTokenGenerator } from "./infrastructure/crypto/CryptoTokenGenerator.js";
import { RandomPasswordGenerator } from "./infrastructure/crypto/RandomPasswordGenerator.js";
import { BcryptPasswordHasher } from "./infrastructure/crypto/BcryptPasswordHasher.js";
import { SystemClock } from "./infrastructure/time/Clock.js";

import { defaultLinkConfig } from "./application/config/LinkConfig.js";
import { CreateAnonymousLinkUseCase } from "./application/usecases/CreateAnonymousLinkUseCase.js";
import { AuthenticateAnonymousLinkUseCase } from "./application/usecases/AuthenticateAnonymousLinkUseCase.js";
import { DeleteAnonymousLinkUseCase } from "./application/usecases/DeleteAnonymousLinkUseCase.js";
import { PurgeExpiredLinksUseCase } from "./application/usecases/PurgeExpiredLinksUseCase.js";

import { SimpleLockPolicy } from "./domain/policies/LockPolicy.js";

import { LinksController } from "./presentation/controllers/LinksController.js";
import { AnonymousAccessController } from "./presentation/controllers/AnonymousAccessController.js";
import { buildRoutes } from "./presentation/routes.js";

import { ExpiredLinkJanitor } from "./jobs/ExpiredLinkJanitor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// wiring
const dataPath = path.join(__dirname, "../data/links.json");
const store = new JsonFileStore<LinksFile>(dataPath);
const repo = new JsonAnonymousLinkRepository(store);

const tokenGen = new CryptoTokenGenerator(24);
const passGen = new RandomPasswordGenerator(14);
const hasher = new BcryptPasswordHasher(12);
const clock = new SystemClock();
const lockPolicy = new SimpleLockPolicy({ maxAttempts: 10, lockDurationMs: 5 * 60 * 1000 });

const createUC = new CreateAnonymousLinkUseCase(repo, tokenGen, passGen, hasher, clock, defaultLinkConfig);
const authUC = new AuthenticateAnonymousLinkUseCase(repo, hasher, clock, lockPolicy);
const deleteUC = new DeleteAnonymousLinkUseCase(repo, clock);
const purgeUC = new PurgeExpiredLinksUseCase(repo, clock);

const linksController = new LinksController(createUC, deleteUC);
const accessController = new AnonymousAccessController(authUC);

app.use(buildRoutes({ linksController, accessController }));

// janitor (simple interval)
const janitor = new ExpiredLinkJanitor(purgeUC);
setInterval(() => { void janitor.run(); }, 60_000);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`anonymousLink server listening on http://localhost:${port}`);
});
