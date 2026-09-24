import MarkdownIt from 'markdown-it';

// Описание и notes пишут агенты: это недоверенный ввод. html: false — сырой HTML экранируется.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
md.validateLink = (url: string) => /^https?:\/\//i.test(url.trim());

const renderToken: NonNullable<typeof md.renderer.rules.link_open> = (tokens, idx, options, _env, self) =>
  self.renderToken(tokens, idx, options);
const defaultLinkOpen = md.renderer.rules.link_open ?? renderToken;

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token?.attrSet('target', '_blank');
  token?.attrSet('rel', 'noopener noreferrer');
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}
