export function defineRouting<
  const T extends { locales: readonly string[]; defaultLocale: string },
>(config: T): T {
  return config;
}
