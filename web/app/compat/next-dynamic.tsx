import { type ComponentType, lazy, Suspense, useEffect, useState } from "react";

export default function dynamic(
  loader: () => Promise<{ default: ComponentType<any> } | ComponentType<any>>,
  opts?: { ssr?: boolean; loading?: ComponentType },
) {
  const Lazy = lazy(async () => {
    const mod = await loader();
    if (mod && typeof mod === "object" && "default" in mod) {
      return mod as { default: ComponentType<any> };
    }
    return { default: mod as ComponentType<any> };
  });

  const Fallback = opts?.loading ?? (() => null);

  function Wrapper(props: any) {
    const [mounted, setMounted] = useState(opts?.ssr !== false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <Fallback />;
    return (
      <Suspense fallback={<Fallback />}>
        <Lazy {...props} />
      </Suspense>
    );
  }

  return Wrapper;
}
