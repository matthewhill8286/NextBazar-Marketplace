/**
 * Minimal HTML escaper for user-supplied content that will be interpolated
 * into an email body (or any other HTML sink). Escapes the five characters
 * that matter for context-breaking: & < > " '.
 *
 * We intentionally do NOT try to be a full sanitiser — callers should treat
 * the output as *text content* and avoid interpolating it into attributes
 * or URLs.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Same as escapeHtml but also converts \n to <br/> for display. */
export function escapeHtmlMultiline(input: string): string {
  return escapeHtml(input).replace(/\r?\n/g, "<br/>");
}
