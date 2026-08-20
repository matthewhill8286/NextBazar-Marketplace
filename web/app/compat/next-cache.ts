export function revalidateTag(..._args: unknown[]) {}
export function revalidatePath(..._args: unknown[]) {}
export function unstable_cache<T extends (...args: never[]) => unknown>(
  fn: T,
  _key?: string[],
  _opts?: unknown,
): T {
  return fn;
}
export function cacheTag(..._args: unknown[]) {}
export function cacheLife(..._args: unknown[]) {}
export function cache<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn;
}
