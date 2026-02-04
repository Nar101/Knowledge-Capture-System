const DEFAULT_DIM = 256;

function hashToken(token) {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash << 5) - hash + token.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalize(vec) {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return vec.map((v) => v / norm);
}

function embedText(text, dim = DEFAULT_DIM) {
  const vec = new Array(dim).fill(0);
  if (!text) return vec;
  const tokens = text
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .match(/[\p{L}\p{N}]+/gu);
  if (!tokens) return vec;
  for (const token of tokens) {
    const idx = hashToken(token) % dim;
    vec[idx] += 1;
  }
  return normalize(vec);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let score = 0;
  for (let i = 0; i < a.length; i += 1) {
    score += a[i] * b[i];
  }
  return score;
}

module.exports = { embedText, cosineSimilarity, DEFAULT_DIM };
