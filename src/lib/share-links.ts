export const SHARE_LINK_TTL_SECONDS = 600;
export const SHARE_LINK_TTL_MS = SHARE_LINK_TTL_SECONDS * 1000;
export const PERMANENT_SHARE_TOKEN_PREFIX = "perma_";

export const buildShareToken = (token: string, neverExpires: boolean) =>
  neverExpires ? `${PERMANENT_SHARE_TOKEN_PREFIX}${token}` : token;

export const isPermanentShareToken = (token: string | null | undefined) =>
  typeof token === "string" && token.startsWith(PERMANENT_SHARE_TOKEN_PREFIX);

export const calculateShareExpiry = (createdAt: string | Date) => {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return new Date(created.getTime() + SHARE_LINK_TTL_MS);
};
