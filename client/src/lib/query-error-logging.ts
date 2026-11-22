export function logQueryError(
  meta: Record<string, unknown> | undefined,
  error: unknown,
  logger: (...args: unknown[]) => void = console.error,
) {
  if (meta?.suppressConsoleError === true) return;
  logger("[API Query Error]", error);
}
