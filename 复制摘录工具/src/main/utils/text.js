const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'are', 'was', 'were', 'has', 'have', 'had',
  'a', 'an', 'to', 'of', 'in', 'on', 'by', 'is', 'it', 'as', 'at', 'be', 'or', 'but',
  '我们', '你们', '他们', '以及', '但是', '因此', '因为', '所以', '如果', '不是', '没有', '一个', '这种', '这些', '那些'
]);

function splitSentences(text) {
  if (!text) return [];
  const parts = text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[。！？.!?])\s+/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function summarize(text, maxSentences = 2) {
  const sentences = splitSentences(text);
  if (!sentences.length) return '';
  return sentences.slice(0, maxSentences).join(' ');
}

function extractKeywords(text, limit = 6) {
  if (!text) return [];
  const tokens = text
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu);
  if (!tokens) return [];
  const freq = new Map();
  for (const token of tokens) {
    if (token.length < 2) continue;
    if (STOPWORDS.has(token)) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function buildCitation({ summary, sourceTitle, sourceUrl, sourceApp, createdAt }) {
  const title = sourceTitle || sourceApp || 'Unknown Source';
  const date = createdAt ? new Date(createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const urlLine = sourceUrl ? `(${sourceUrl})` : '';
  const excerpt = summary ? summary : '';
  return `> ${excerpt}\n> — ${title} ${urlLine}\n> ${date}`;
}

module.exports = {
  summarize,
  extractKeywords,
  buildCitation
};
