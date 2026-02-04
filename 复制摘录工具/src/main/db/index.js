const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let SQL = null;
let db = null;
let dbPath = null;
let ftsEnabled = false;

function locateSqlWasm(file) {
  const devPath = path.join(__dirname, '../../../node_modules/sql.js/dist', file);
  const packedPath = path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules/sql.js/dist', file);
  if (fs.existsSync(devPath)) return devPath;
  return packedPath;
}

async function initDb(vaultPath) {
  fs.mkdirSync(vaultPath, { recursive: true });
  dbPath = path.join(vaultPath, 'library.db');

  if (!SQL) {
    SQL = await initSqlJs({ locateFile: locateSqlWasm });
  }

  const buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
  db = buffer ? new SQL.Database(new Uint8Array(buffer)) : new SQL.Database();
  createTables();
  migrateLegacy();
  persist();
  return db;
}

function persist() {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function exec(sql) {
  db.exec(sql);
}

function run(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

function get(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function all(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function tableExists(name) {
  const row = get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=@name`,
    { '@name': name }
  );
  return Boolean(row?.name);
}

function createTables() {
  exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_key TEXT UNIQUE,
      title TEXT,
      summary TEXT,
      author TEXT,
      publish_time TEXT,
      keywords TEXT,
      source_url TEXT,
      source_app TEXT,
      source_window TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER,
      sequence INTEGER DEFAULT 1,
      type TEXT,
      content_text TEXT,
      image_path TEXT,
      ocr_text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE,
      title TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS fts_clips USING fts5(
        content_text,
        ocr_text,
        content='clips',
        content_rowid='id'
      );

      CREATE TRIGGER IF NOT EXISTS clips_ai AFTER INSERT ON clips BEGIN
        INSERT INTO fts_clips(rowid, content_text, ocr_text)
        VALUES (new.id, new.content_text, new.ocr_text);
      END;

      CREATE TRIGGER IF NOT EXISTS clips_au AFTER UPDATE ON clips BEGIN
        INSERT INTO fts_clips(fts_clips, rowid, content_text, ocr_text)
        VALUES('delete', old.id, old.content_text, old.ocr_text);
        INSERT INTO fts_clips(rowid, content_text, ocr_text)
        VALUES (new.id, new.content_text, new.ocr_text);
      END;

      CREATE TRIGGER IF NOT EXISTS clips_ad AFTER DELETE ON clips BEGIN
        INSERT INTO fts_clips(fts_clips, rowid, content_text, ocr_text)
        VALUES('delete', old.id, old.content_text, old.ocr_text);
      END;
    `);
    ftsEnabled = true;
  } catch {
    ftsEnabled = false;
  }
}

function migrateLegacy() {
  if (!tableExists('modules') || !tableExists('snippets')) return;
  const noteCount = get(`SELECT COUNT(*) as count FROM notes`)?.count || 0;
  if (noteCount > 0) return;

  const modules = all(`SELECT * FROM modules`);
  const moduleMap = new Map();
  const noteKeyMap = new Map();
  for (const module of modules) {
    const noteKey = module.normalized_url || module.source_url || module.source_title || `legacy-${module.id}`;
    if (noteKeyMap.has(noteKey)) {
      moduleMap.set(module.id, noteKeyMap.get(noteKey));
      continue;
    }

    const existing = get(`SELECT id FROM notes WHERE note_key=@note_key`, { '@note_key': noteKey });
    if (existing?.id) {
      noteKeyMap.set(noteKey, existing.id);
      moduleMap.set(module.id, existing.id);
      continue;
    }

    run(
      `INSERT INTO notes (note_key, title, summary, keywords, source_url, created_at, updated_at)
       VALUES (@note_key, @title, @summary, @keywords, @source_url, @created_at, @updated_at)`
      ,
      {
        '@note_key': noteKey,
        '@title': module.source_title || module.source_url || 'Untitled',
        '@summary': module.summary || '',
        '@keywords': module.keywords || '',
        '@source_url': module.source_url || '',
        '@created_at': module.created_at || new Date().toISOString(),
        '@updated_at': module.updated_at || new Date().toISOString()
      }
    );
    const row = get(`SELECT last_insert_rowid() as id`);
    const noteId = row?.id || 0;
    noteKeyMap.set(noteKey, noteId);
    moduleMap.set(module.id, noteId);
  }

  const assets = tableExists('assets') ? all(`SELECT * FROM assets`) : [];
  const assetMap = new Map();
  for (const asset of assets) {
    if (!assetMap.has(asset.snippet_id)) assetMap.set(asset.snippet_id, []);
    assetMap.get(asset.snippet_id).push(asset);
  }

  const snippets = all(`SELECT * FROM snippets ORDER BY created_at ASC`);
  for (const snippet of snippets) {
    const noteId = moduleMap.get(snippet.module_id);
    if (!noteId) continue;
    const type = snippet.source_type === 'image' ? 'image' : 'text';
    const sequence = snippet.sequence || getNextSequence(noteId);
    let imagePath = '';
    let ocrText = '';
    if (type === 'image') {
      const asset = assetMap.get(snippet.id)?.[0];
      if (asset) {
        imagePath = asset.file_path || '';
        ocrText = asset.ocr_text || '';
      }
    }
    run(
      `INSERT INTO clips (note_id, sequence, type, content_text, image_path, ocr_text, created_at)
       VALUES (@note_id, @sequence, @type, @content_text, @image_path, @ocr_text, @created_at)`
      ,
      {
        '@note_id': noteId,
        '@sequence': sequence,
        '@type': type,
        '@content_text': snippet.content_text || snippet.content_markdown || '',
        '@image_path': imagePath,
        '@ocr_text': ocrText,
        '@created_at': snippet.created_at || new Date().toISOString()
      }
    );
  }
}

function getNoteByKey(noteKey) {
  return get(`SELECT * FROM notes WHERE note_key=@note_key`, { '@note_key': noteKey });
}

function createNote(data) {
  run(
    `INSERT INTO notes (note_key, title, summary, author, publish_time, keywords, source_url, source_app, source_window)
     VALUES (@note_key, @title, @summary, @author, @publish_time, @keywords, @source_url, @source_app, @source_window)`
    ,
    {
      '@note_key': data.note_key,
      '@title': data.title || 'Untitled',
      '@summary': data.summary || '',
      '@author': data.author || '',
      '@publish_time': data.publish_time || '',
      '@keywords': data.keywords || '',
      '@source_url': data.source_url || '',
      '@source_app': data.source_app || '',
      '@source_window': data.source_window || ''
    }
  );
  const row = get(`SELECT last_insert_rowid() as id`);
  persist();
  return row?.id || 0;
}

function updateNote(noteId, data) {
  const fields = Object.keys(data);
  if (!fields.length) return;
  const assignments = fields.map((field) => `${field}=@${field}`).join(', ');
  run(
    `UPDATE notes SET ${assignments}, updated_at=CURRENT_TIMESTAMP WHERE id=@id`,
    { '@id': noteId, ...Object.fromEntries(fields.map((k) => [`@${k}`, data[k]])) }
  );
  persist();
}

function touchNote(noteId) {
  run(`UPDATE notes SET updated_at=CURRENT_TIMESTAMP WHERE id=@id`, { '@id': noteId });
  persist();
}

function getNextSequence(noteId) {
  const row = get(`SELECT MAX(sequence) as maxSeq FROM clips WHERE note_id=@id`, { '@id': noteId });
  const maxSeq = row?.maxSeq || 0;
  return maxSeq + 1;
}

function insertClip(data) {
  run(
    `INSERT INTO clips (note_id, sequence, type, content_text, image_path, ocr_text)
     VALUES (@note_id, @sequence, @type, @content_text, @image_path, @ocr_text)`
    ,
    {
      '@note_id': data.note_id,
      '@sequence': data.sequence,
      '@type': data.type,
      '@content_text': data.content_text || '',
      '@image_path': data.image_path || '',
      '@ocr_text': data.ocr_text || ''
    }
  );
  const row = get(`SELECT last_insert_rowid() as id`);
  touchNote(data.note_id);
  return row?.id || 0;
}

function updateClip(id, data) {
  const fields = Object.keys(data);
  if (!fields.length) return;
  const assignments = fields.map((field) => `${field}=@${field}`).join(', ');
  run(
    `UPDATE clips SET ${assignments} WHERE id=@id`,
    { '@id': id, ...Object.fromEntries(fields.map((k) => [`@${k}`, data[k]])) }
  );
  persist();
}

function getClip(id) {
  return get(`SELECT * FROM clips WHERE id=@id`, { '@id': id });
}

function listNotes(limit = 200) {
  return all(`SELECT * FROM notes ORDER BY updated_at DESC LIMIT @limit`, { '@limit': limit });
}

function searchNotes(query) {
  if (!query || !query.trim()) return listNotes();
  const q = query.toLowerCase();

  if (ftsEnabled) {
    const clipHits = all(
      `SELECT rowid as id, bm25(fts_clips) as score FROM fts_clips WHERE fts_clips MATCH @q LIMIT 200`,
      { '@q': query }
    );
    const noteScores = new Map();
    for (const hit of clipHits) {
      const clip = get(`SELECT note_id FROM clips WHERE id=@id`, { '@id': hit.id });
      if (!clip?.note_id) continue;
      const score = 1 / (1 + Math.abs(hit.score || 0));
      const current = noteScores.get(clip.note_id) || 0;
      noteScores.set(clip.note_id, Math.max(current, score));
    }
    const noteIds = [...noteScores.keys()];
    if (!noteIds.length) return [];
    const placeholders = noteIds.map((_, i) => `@id${i}`).join(',');
    const params = Object.fromEntries(noteIds.map((id, i) => [`@id${i}`, id]));
    const notes = all(`SELECT * FROM notes WHERE id IN (${placeholders})`, params);
    notes.sort((a, b) => (noteScores.get(b.id) || 0) - (noteScores.get(a.id) || 0));
    return notes;
  }

  const notes = listNotes(500);
  return notes.filter((note) =>
    [note.title, note.summary, note.keywords, note.author, note.source_url, note.source_app, note.source_window, note.note_key]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(q))
  );
}

function getNote(noteId) {
  const note = get(`SELECT * FROM notes WHERE id=@id`, { '@id': noteId });
  if (!note) return null;
  const clips = all(`SELECT * FROM clips WHERE note_id=@id ORDER BY sequence ASC`, { '@id': noteId });
  return { ...note, clips };
}

function insertBookmark(data) {
  run(
    `INSERT OR IGNORE INTO bookmarks (url, title) VALUES (@url, @title)`
    ,
    { '@url': data.url, '@title': data.title || '' }
  );
  persist();
}

function listBookmarks() {
  return all(`SELECT * FROM bookmarks ORDER BY created_at DESC`);
}

module.exports = {
  initDb,
  getNoteByKey,
  createNote,
  updateNote,
  touchNote,
  getNextSequence,
  insertClip,
  updateClip,
  getClip,
  listNotes,
  searchNotes,
  getNote,
  insertBookmark,
  listBookmarks
};
