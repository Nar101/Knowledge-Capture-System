const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  emDelimiter: '_'
});

function extractFromHtml(html, baseUrl = 'https://local/') {
  if (!html) return { text: '', markdown: '' };
  const dom = new JSDOM(html, { url: baseUrl });
  const doc = dom.window.document;
  let article = null;
  try {
    const reader = new Readability(doc);
    article = reader.parse();
  } catch {
    article = null;
  }

  const contentHtml = article?.content || doc.body?.innerHTML || html;
  const text = (article?.textContent || doc.body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
  const markdown = turndown.turndown(contentHtml).trim();
  return { text, markdown };
}

module.exports = { extractFromHtml };
