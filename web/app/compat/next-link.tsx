import { Link as LocaleLink } from "@/i18n/navigation";
import type { ReactNode } from "react";

export default function Link({
  href,
  children,
  className,
  ...rest
}: {
  href: string;
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <LocaleLink href={href} className={className} {...rest}>
      {children}
    </LocaleLink>
  );
}
