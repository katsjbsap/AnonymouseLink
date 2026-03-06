export type LinkConfig = {
  baseUrl: string;         // e.g. https://example.com
  maxTtlSeconds: number;   // safety upper bound
};

export const defaultLinkConfig: LinkConfig = {
  baseUrl: "http://localhost:3000",
  maxTtlSeconds: 60 * 60 * 24 * 30
};
