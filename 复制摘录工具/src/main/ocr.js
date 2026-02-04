const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

function runOcr(imagePath) {
  return new Promise((resolve) => {
    const unpackedPath = path.join(process.resourcesPath || '', 'app.asar.unpacked', 'tools', 'ocr.swift');
    const localPath = path.join(__dirname, '../../tools/ocr.swift');
    const scriptPath = fs.existsSync(unpackedPath) ? unpackedPath : localPath;
    if (!fs.existsSync(scriptPath)) {
      resolve('');
      return;
    }
    execFile('swift', [scriptPath, imagePath], { timeout: 15000 }, (err, stdout) => {
      if (err) {
        resolve('');
        return;
      }
      resolve(String(stdout || '').trim());
    });
  });
}

module.exports = { runOcr };
