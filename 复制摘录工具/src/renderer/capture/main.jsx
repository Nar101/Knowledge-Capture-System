import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const initialStatus = {
  enabled: false,
  sourceApp: '',
  queueSize: 0
};

function App() {
  const [status, setStatus] = useState(initialStatus);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    window.api?.capture?.status().then(setStatus).catch(() => {});
    window.api?.capture?.onStatus((next) => setStatus((prev) => ({ ...prev, ...next })));
  }, []);

  const toggleCapture = async () => {
    if (!window.api?.capture) return;
    setIsBusy(true);
    try {
      const next = status.enabled
        ? await window.api.capture.disable()
        : await window.api.capture.enable();
      setStatus((prev) => ({ ...prev, ...next }));
    } finally {
      setIsBusy(false);
    }
  };

  const captureNow = async () => {
    if (!window.api?.capture) return;
    setIsBusy(true);
    try {
      const next = await window.api.capture.now();
      setStatus((prev) => ({ ...prev, ...next }));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="capture-root">
      <div className="capture-header">
        <div className="capture-title">Snippet Capture</div>
        <div className={`capture-status ${status.enabled ? 'on' : 'off'}`}>
          {status.enabled ? 'Capturing' : 'Idle'}
        </div>
      </div>

      <div className="capture-card">
        <div className="source-label">Source App</div>
        <div className="source-value">{status.sourceApp || '—'}</div>
        <div className="queue-info">
          AI Queue: <strong>{status.queueSize}</strong>
        </div>
      </div>

      <div className="capture-actions">
        <button className="btn primary" onClick={toggleCapture} disabled={isBusy}>
          {status.enabled ? 'Pause Capture' : 'Start Capture'}
        </button>
        <button className="btn ghost" onClick={captureNow} disabled={isBusy}>
          Capture Now
        </button>
        <button className="btn ghost" onClick={() => window.api?.capture?.openLibrary()}>
          Open Library
        </button>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
createRoot(container).render(<App />);
