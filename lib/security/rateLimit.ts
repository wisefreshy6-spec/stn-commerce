type Entry = {
  count: number;
  expiresAt: number;
};

const store = new Map<string, Entry>();

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || existing.expiresAt < now) {
    store.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });

    return { success: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.expiresAt - now) / 1000),
    };
  }

  existing.count += 1;

  return {
    success: true,
    remaining: limit - existing.count,
  };
}