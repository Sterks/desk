import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({html:false,linkify:false,breaks:true,typographer:true});
markdown.validateLink=(url:string)=>/^(https?:|mailto:)/i.test(url.trim());

export function renderMarkdown(source:string):string{return markdown.render(source);}
