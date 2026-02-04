import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [query, setQuery] = useState('');
  const [snippets, setSnippets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [tagInput, setTagInput] = useState('');

  const loadSnippets = async (nextQuery) => {
    const data = await window.api?.library?.search(nextQuery ?? query);
    setSnippets(data || []);
    if (!selectedId && data?.length) {
      setSelectedId(data[0].id);
    }
  };

  const loadSnippet = async (id) => {
    const detail = await window.api?.library?.getSnippet(id);
    setSelected(detail);
    const recs = await window.api?.library?.getRecommendations(id);
    setRecommendations(recs || []);
  };

  useEffect(() => {
    window.api?.settings?.get().then(setSettings).catch(() => {});
    loadSnippets('');
    window.api?.library?.onUpdated(() => {
      if (!query) loadSnippets('');
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!query) loadSnippets('');
    }, 5000);
    return () => clearInterval(interval);
  }, [query]);

  useEffect(() => {
    if (selectedId) loadSnippet(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadSnippets(query);
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  const snippetList = useMemo(() => snippets || [], [snippets]);

  const onAddTag = async () => {
    if (!tagInput.trim() || !selected) return;
    const tags = Array.from(new Set([...(selected.tags || []), tagInput.trim()]));
    const updated = await window.api?.library?.updateTags({ id: selected.id, tags });
    setSelected(updated);
    setTagInput('');
  };

  const onSelectVault = async () => {
    const next = await window.api?.settings?.selectVault();
    setSettings(next);
  };

  return (
    <div className="library-root">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">◉</div>
          <div>
            <div className="brand-name">Snippet Vault</div>
            <div className="brand-sub">Local Knowledge</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-title">Smart Collections</div>
          <button className="nav-item active">All Snippets</button>
          <button className="nav-item">Recent</button>
        </div>

        <div className="sidebar-section">
          <div className="section-title">Library</div>
          <div className="vault-path">{settings?.vaultPath || 'Vault not set'}</div>
          <button className="nav-item" onClick={onSelectVault}>
            Choose Vault
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <input
            className="search"
            placeholder="Search your knowledge..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="top-actions">
            <button className="ghost-btn" onClick={() => window.api?.capture?.openLibrary()}>
              Capture Window
            </button>
          </div>
        </header>

        <section className="grid">
          <div className="list">
            {snippetList.map((snippet) => (
              <button
                key={snippet.id}
                className={`list-item ${selectedId === snippet.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(snippet.id)}
              >
                <div className="list-title">
                  {snippet.summary || snippet.source_title || snippet.source_app || 'Untitled'}
                </div>
                <div className="list-meta">
                  {snippet.source_app || 'Unknown'} ·{' '}
                  {new Date(snippet.created_at).toLocaleDateString()}
                </div>
                <div className="list-preview">
                  {(snippet.content_text || snippet.content_markdown || '').slice(0, 120)}
                </div>
              </button>
            ))}
          </div>

          <div className="detail">
            {selected ? (
              <>
                <div className="detail-header">
                  <h2>{selected.source_title || selected.source_app || 'Snippet'}</h2>
                  <div className="detail-meta">
                    {selected.source_url ? (
                      <span>{selected.source_url}</span>
                    ) : (
                      <span>{selected.source_app}</span>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">Summary</div>
                  <div className="detail-text">{selected.summary || 'AI summary pending...'}</div>
                </div>

                <div className="detail-section">
                  <div className="section-title">Original</div>
                  <div className="detail-text">
                    {(selected.content_markdown || selected.content_text || '').trim() || 'No content'}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">Keywords</div>
                  <div className="pill-row">
                    {(selected.keywords || '')
                      .split(',')
                      .map((k) => k.trim())
                      .filter(Boolean)
                      .map((k) => (
                        <span className="pill" key={k}>
                          {k}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">Topics</div>
                  <div className="pill-row">
                    {(selected.topics || '')
                      .split(',')
                      .map((k) => k.trim())
                      .filter(Boolean)
                      .map((k) => (
                        <span className="pill" key={k}>
                          {k}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">Citation</div>
                  <pre className="citation">{selected.citation_md || 'Pending...'}</pre>
                </div>

                <div className="detail-section">
                  <div className="section-title">Tags</div>
                  <div className="pill-row">
                    {(selected.tags || []).map((tag) => (
                      <span className="pill" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="tag-input">
                    <input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="Add a tag"
                    />
                    <button className="ghost-btn" onClick={onAddTag}>
                      Add
                    </button>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="section-title">Related Snippets</div>
                  <div className="recommendations">
                    {recommendations.map((item) => (
                      <button
                        key={item.id}
                        className="recommendation-card"
                        onClick={() => setSelectedId(item.id)}
                      >
                        <div className="rec-title">
                          {item.summary || item.source_title || 'Snippet'}
                        </div>
                        <div className="rec-meta">
                          {item.source_app || 'Unknown'} ·{' '}
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">No snippet selected</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const container = document.getElementById('root');
createRoot(container).render(<App />);
