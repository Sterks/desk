import { renderMarkdown } from '../lib/markdown';

export function Markdown({ source }: { source: string }) {
  // renderMarkdown экранирует HTML (html: false) и пропускает только http(s)-ссылки — см. markdown.test.ts.
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />;
}
