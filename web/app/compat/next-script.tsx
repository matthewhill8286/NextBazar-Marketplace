import type { ReactNode, ScriptHTMLAttributes } from "react";

type ScriptProps = ScriptHTMLAttributes<HTMLScriptElement> & {
  strategy?: "afterInteractive" | "lazyOnload" | "beforeInteractive";
  id?: string;
  children?: ReactNode;
};

export default function Script({
  strategy: _strategy,
  children,
  ...rest
}: ScriptProps) {
  if (children) {
    return (
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: GA snippet
        dangerouslySetInnerHTML={{ __html: String(children) }}
        {...rest}
      />
    );
  }
  return <script {...rest} />;
}
