export type LinkRecord = {
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

export type LinksFile = {
  version: number;
  links: LinkRecord[];
};
