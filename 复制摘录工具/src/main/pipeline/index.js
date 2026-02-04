const fs = require('fs');
const { extractFromHtml } = require('../utils/html');
const { summarize, extractKeywords, buildCitation } = require('../utils/text');
const { embedText, DEFAULT_DIM } = require('../utils/embedding');
const { runOcr } = require('../ocr');

function createPipeline({ db }) {
  const queue = [];
  let processing = false;

  async function processNext() {
    if (processing || queue.length === 0) return;
    processing = true;
    const snippetId = queue.shift();
    try {
      await processSnippet(snippetId);
    } catch (err) {
      db.updateSnippet(snippetId, { ai_status: 'error' });
    } finally {
      processing = false;
      if (queue.length) processNext();
    }
  }

  function enqueue(snippetId) {
    if (!queue.includes(snippetId)) {
      queue.push(snippetId);
      processNext();
    }
  }

  async function processSnippet(snippetId) {
    const snippet = db.getSnippet(snippetId);
    if (!snippet) return;
    db.updateSnippet(snippetId, { ai_status: 'processing' });

    let contentText = snippet.content_text || '';
    let contentMarkdown = snippet.content_markdown || '';

    if (snippet.content_html) {
      const extracted = extractFromHtml(snippet.content_html, snippet.source_url || 'https://local/');
      if (extracted.text) contentText = extracted.text;
      if (extracted.markdown) contentMarkdown = extracted.markdown;
    } else if (contentText && !contentMarkdown) {
      contentMarkdown = contentText;
    }

    const assets = snippet.assets || [];
    let ocrText = '';
    for (const asset of assets) {
      if (!asset.file_path || asset.ocr_text) continue;
      if (!fs.existsSync(asset.file_path)) continue;
      const result = await runOcr(asset.file_path);
      if (result) {
        ocrText += `\n${result}`;
        db.updateAsset(asset.id, { ocr_text: result });
      }
    }

    let combinedText = [contentText, ocrText].filter(Boolean).join('\n').trim();
    if (!contentText && ocrText) {
      contentText = ocrText.trim();
      combinedText = contentText;
    }
    const summary = summarize(combinedText);
    const keywords = extractKeywords(combinedText).join(', ');
    const topics = extractKeywords(combinedText, 2).join(', ');
    const citation = buildCitation({
      summary,
      sourceTitle: snippet.source_title,
      sourceUrl: snippet.source_url,
      sourceApp: snippet.source_app,
      createdAt: snippet.created_at
    });

    db.updateSnippet(snippetId, {
      content_text: contentText,
      content_markdown: contentMarkdown,
      summary,
      keywords,
      topics,
      citation_md: citation,
      ai_status: 'done'
    });

    const vector = embedText(`${contentText}\n${summary}`, DEFAULT_DIM);
    db.upsertEmbedding(snippetId, vector, DEFAULT_DIM);
  }

  function size() {
    return queue.length + (processing ? 1 : 0);
  }

  return {
    enqueue,
    size
  };
}

module.exports = { createPipeline };
