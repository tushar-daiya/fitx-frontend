// A screen to open after the splash/redirect logic has decided where the
// signed-in user lands — set when a notification is tapped, consumed by index.
let pending: string | null = null;

export const setPendingRoute = (route: unknown) => {
  // Only in-app paths; ignore anything else a payload might carry.
  pending = typeof route === "string" && route.startsWith("/") ? route : null;
};

export const takePendingRoute = (): string | null => {
  const r = pending;
  pending = null;
  return r;
};
