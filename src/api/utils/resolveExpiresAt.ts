type ResolveExpiresAt = (args: {
  expiresAt: number | undefined;
  minAge: number | undefined;
  maxAge: number | undefined;
}) => number | undefined;

export const resolveExpiresAt: ResolveExpiresAt = ({
  expiresAt,
  minAge,
  maxAge,
}) => {
  const now = Date.now();

  const minExpiresAt = minAge ? now + minAge : undefined;
  const maxExpiresAt = maxAge ? now + maxAge : undefined;

  if (expiresAt === undefined) {
    return minExpiresAt;
  }

  if (minExpiresAt !== undefined && expiresAt < minExpiresAt) {
    return minExpiresAt;
  }

  if (maxExpiresAt !== undefined && expiresAt > maxExpiresAt) {
    return maxExpiresAt;
  }

  return expiresAt;
};
