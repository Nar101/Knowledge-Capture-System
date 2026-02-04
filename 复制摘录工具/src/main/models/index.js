const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_CATALOG = [
  {
    id: 'qwen2.5-7b-instruct',
    name: 'Qwen2.5 7B Instruct (Q4)',
    type: 'llm',
    filename: 'qwen2.5-7b-instruct-q4.gguf',
    url: ''
  },
  {
    id: 'bge-m3',
    name: 'BGE-M3 Embedding',
    type: 'embedding',
    filename: 'bge-m3-f16.gguf',
    url: ''
  }
];

const downloads = new Map();

function resolveModelPath(settings, model, vaultPath) {
  const customPath = model.type === 'llm' ? settings.models.llmPath : settings.models.embedPath;
  if (customPath && fs.existsSync(customPath)) return customPath;
  const defaultPath = path.join(vaultPath, 'models', model.filename);
  return fs.existsSync(defaultPath) ? defaultPath : '';
}

function listModels(settings, vaultPath) {
  return MODEL_CATALOG.map((model) => {
    const resolvedPath = resolveModelPath(settings, model, vaultPath);
    return {
      ...model,
      path: resolvedPath,
      status: resolvedPath ? 'ready' : 'missing'
    };
  });
}

function getStatus() {
  const items = [];
  downloads.forEach((value, key) => {
    items.push({ id: key, ...value });
  });
  return items;
}

function downloadModel(settings, vaultPath, modelId) {
  const model = MODEL_CATALOG.find((item) => item.id === modelId);
  if (!model) throw new Error('Model not found');
  if (!model.url) throw new Error('Model URL not configured');
  const targetPath = path.join(vaultPath, 'models', model.filename);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(targetPath);
    downloads.set(modelId, { status: 'downloading', progress: 0 });
    https.get(model.url, (response) => {
      if (response.statusCode !== 200) {
        downloads.set(modelId, { status: 'error', progress: 0 });
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }
      const total = parseInt(response.headers['content-length'] || '0', 10);
      let received = 0;
      response.on('data', (chunk) => {
        received += chunk.length;
        const progress = total ? received / total : 0;
        downloads.set(modelId, { status: 'downloading', progress });
      });
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        downloads.set(modelId, { status: 'done', progress: 1 });
        resolve(targetPath);
      });
    }).on('error', (err) => {
      downloads.set(modelId, { status: 'error', progress: 0 });
      reject(err);
    });
  });
}

module.exports = {
  listModels,
  downloadModel,
  getStatus
};
