export function replaceHnLinks(sanitizedHtml: string) {
  const hnLinkRegex =
    /href="https:..news.ycombinator.com.(user|item)\?id=([\w\d]+)/gim;
  const matches = sanitizedHtml.matchAll(hnLinkRegex);

  for (const match of matches) {
    const toReplace = match[0];
    const id = match[2];
    const type = match[1];
    sanitizedHtml = sanitizedHtml.replace(
      toReplace,
      `href="/${type === "user" ? "user" : "comment"}/${id}`,
    );
  }
  return sanitizedHtml;
}
