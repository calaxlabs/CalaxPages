const GITHUB_BASE = 'https://raw.githubusercontent.com/calaxlabs/CalaxPages/main/data/games';

async function loadGames(){
  const manifestRes = await fetch(`${GITHUB_BASE}/index.json`);
  const filenames = await manifestRes.json();

  const results = await Promise.allSettled(
    filenames.map(async (filename) => {
      const res = await fetch(`${GITHUB_BASE}/${filename}`);
      if (!res.ok) throw new Error(`${filename} → ${res.status}`);
      return res.json();
    })
  );

  results
    .filter(r => r.status === 'rejected')
    .forEach(r => console.warn('Skipped a game file:', r.reason));

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

// ---------- Single game / single field lookup ----------

const gameCache = new Map(); // filename -> parsed JSON (so repeated lookups don't re-fetch)

async function getGame(filename){
  if (gameCache.has(filename)) return gameCache.get(filename);

  const res = await fetch(`${GITHUB_BASE}/${filename}`);
  if (!res.ok) throw new Error(`${filename} → ${res.status}`);
  const data = await res.json();

  gameCache.set(filename, data);
  return data;
}

// Supports dot paths for nested values, e.g. "action.percent" or "action.url"
function getField(obj, path){
  return path.split('.').reduce((val, key) => (val == null ? undefined : val[key]), obj);
}

async function getGameField(filename, fieldPath){
  const game = await getGame(filename);
  return getField(game, fieldPath);
}

// Scans the page for elements like:
// <span data-game="gameTemplate.json" data-field="title"></span>
// and fills each one in with that game's value at that field.
async function renderGameFields(){
  const elements = document.querySelectorAll('[data-game][data-field]');
  await Promise.all(
    Array.from(elements).map(async (el) => {
      const filename = el.dataset.game;
      const fieldPath = el.dataset.field;
      try{
        const value = await getGameField(filename, fieldPath);
        el.textContent = (value === undefined || value === null) ? '' : value;
      }catch(err){
        console.warn(`Could not load ${fieldPath} from ${filename}:`, err);
        el.textContent = '';
      }
    })
  );
}

function formatDate(dateStr){
  if (!dateStr) return 'TBA';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildActionEl(action){
  if (!action) return document.createTextNode('');

  if (action.type === 'download'){
    const a = document.createElement('a');
    a.href = action.url || '#';
    a.className = 'amount positive';
    a.textContent = 'Download';
    return a;
  }

  if (action.type === 'progress'){
    const span = document.createElement('span');
    span.className = 'amount';
    span.textContent = `${action.percent ?? 0}% complete`;
    return span;
  }

  return document.createTextNode('');
}

function buildRow(game){
  const row = document.createElement('div');
  row.className = 'row';

  const info = document.createElement('div');
  info.className = 'row-info';

  const title = document.createElement('span');
  title.className = 'row-title';
  title.textContent = game.title;
  info.appendChild(title);

  if (game.description){
    const desc = document.createElement('span');
    desc.className = 'row-desc muted';
    desc.textContent = game.description;
    info.appendChild(desc);
  }

  const dateSpan = document.createElement('span');
  dateSpan.className = 'muted';
  if (game.status === 'released'){
    dateSpan.textContent = `Released: ${formatDate(game.releaseDate)}`;
  } else {
    dateSpan.textContent = `Expected: ${formatDate(game.predictedReleaseDate)}`;
  }

  row.appendChild(info);
  row.appendChild(dateSpan);
  row.appendChild(buildActionEl(game.action));

  return row;
}

async function renderGamesList(containerId){
  const container = document.getElementById(containerId);
  if (!container) return;
  const games = await loadGames();
  container.innerHTML = '';
  games.forEach(g => container.appendChild(buildRow(g)));
}

document.addEventListener('DOMContentLoaded', () => {
  renderGamesList('games-list');
  renderGameFields();
});
