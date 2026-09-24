import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('экранирует сырой HTML', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('не делает ссылки из javascript: и data:', () => {
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('href');
    expect(renderMarkdown('[x](data:text/html,hi)')).not.toContain('href');
  });

  it('http(s)-ссылки открываются безопасно', () => {
    const html = renderMarkdown('[PR](https://github.com/org/repo/pull/1)');
    expect(html).toContain('href="https://github.com/org/repo/pull/1"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it('mailto: и голые адреса не становятся ссылками', () => {
    expect(renderMarkdown('[m](mailto:x@y.z) a@b.com')).not.toContain('href');
  });

  it('рендерит markdown', () => expect(renderMarkdown('**жирный**')).toContain('<strong>жирный</strong>'));
});
