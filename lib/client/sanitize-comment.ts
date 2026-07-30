import { replaceHnLinks } from "./hn-links";

type SanitizeFn = (html: string, opts?: Record<string, unknown>) => string;

let _sanitizeHtml: SanitizeFn | undefined;

const DEFAULT_ALLOWED = [
  "a", "b", "i", "em", "strong", "p", "br", "ul", "ol", "li",
  "pre", "code", "blockquote", "span", "small", "font", "sub", "sup",
];

export async function sanitizeComment(
  html: string | undefined,
): Promise<string> {
  if (!html) return "";
  if (!_sanitizeHtml) {
    const mod = await import("sanitize-html");
    _sanitizeHtml = mod.default;
  }
  return replaceHnLinks(
    _sanitizeHtml(html, {
      allowedTags: DEFAULT_ALLOWED,
      allowedAttributes: { a: ["href"], font: ["color"] },
    }),
  );
}
