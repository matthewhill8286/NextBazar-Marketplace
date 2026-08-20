import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

export type Messages = Record<string, unknown>;

export function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function interpolate(
  template: string,
  values?: Record<string, unknown>,
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] === undefined ? `{${key}}` : String(values[key]),
  );
}

export function renderRich(
  template: string,
  tags?: Record<string, (chunks: ReactNode) => ReactNode>,
): ReactNode {
  if (!tags) return template;
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(template))) {
    if (match.index > last) nodes.push(template.slice(last, match.index));
    const tag = match[1];
    const inner = match[2];
    const fn = tags[tag];
    nodes.push(
      createElement(Fragment, { key: i++ }, fn ? fn(inner) : inner),
    );
    last = match.index + match[0].length;
  }
  if (last < template.length) nodes.push(template.slice(last));
  return nodes;
}

export type Translator = {
  (key: string, values?: Record<string, unknown>): string;
  rich: (
    key: string,
    tags?: Record<string, (chunks: ReactNode) => ReactNode>,
  ) => ReactNode;
  raw: (key: string) => unknown;
};

export function createTranslator({
  messages,
  namespace,
}: {
  locale?: string;
  messages: Messages;
  namespace?: string;
}): Translator {
  const scoped = namespace ? getByPath(messages, namespace) : messages;

  const t = ((key: string, values?: Record<string, unknown>) => {
    const raw = getByPath(scoped, key);
    if (typeof raw !== "string") return key;
    return interpolate(raw, values);
  }) as Translator;

  t.rich = (key, tags) => {
    const raw = getByPath(scoped, key);
    if (typeof raw !== "string") return key;
    return renderRich(raw, tags);
  };

  t.raw = (key) => getByPath(scoped, key);

  return t;
}

export async function loadMessages(locale: string): Promise<Messages> {
  switch (locale) {
    case "el":
      return (await import("../messages/el.json")).default as Messages;
    case "ru":
      return (await import("../messages/ru.json")).default as Messages;
    default:
      return (await import("../messages/en.json")).default as Messages;
  }
}
