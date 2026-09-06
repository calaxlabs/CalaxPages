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

function buildActionButton(action){
  if (!action) return null;

  if (action.type === 'play'){
    const a = document.createElement('a');
    a.href = action.url || '#';
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'btn btn-play';
    a.textContent = 'Play Now';
    return a;
  }

  if (action.type === 'download'){
    const a = document.createElement('a');
    a.href = action.url || '#';
    a.className = 'btn btn-download';
    a.textContent = 'Download';
    return a;
  }

  if (action.type === 'progress'){
    const wrap = document.createElement('div');
    wrap.className = 'progress-wrap';
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = `${action.percent ?? 0}%`;
    bar.appendChild(fill);
    const label = document.createElement('span');
    label.className = 'progress-label';
    label.textContent = `${action.percent ?? 0}% complete`;
    wrap.appendChild(bar);
    wrap.appendChild(label);
    return wrap;
  }

  return null;
}

function getActionsList(game){
  if (Array.isArray(game.actions)) return game.actions;
  if (game.action) return [game.action]; // backward-compatible with older single-action games
  return [];
}
function dateLabel(game){
  return game.status === 'released'
    ? `Released: ${formatDate(game.releaseDate)}`
    : `Expected: ${formatDate(game.predictedReleaseDate)}`;
}

function buildGameCard(game){
  const card = document.createElement('div');
  card.className = 'game-card';

  const cover = document.createElement('div');
  cover.className = 'game-card-cover';
  if (game.cover){
    cover.style.backgroundImage = `url('${game.cover}')`;
  }
  card.appendChild(cover);

  const body = document.createElement('div');
  body.className = 'game-card-body';

  const title = document.createElement('h3');
  title.textContent = game.title;
  body.appendChild(title);

  if (game.description){
    const desc = document.createElement('p');
    desc.className = 'muted';
    desc.textContent = game.description;
    body.appendChild(desc);
  }

  const date = document.createElement('span');
  date.className = 'muted game-card-date';
  date.textContent = dateLabel(game);
  body.appendChild(date);

  const actions = document.createElement('div');
  actions.className = 'game-card-actions';

  getActionsList(game).forEach(action => {
    const btn = buildActionButton(action);
    if (btn) actions.appendChild(btn);
  });

  const viewBtn = document.createElement('button');
  viewBtn.className = 'btn btn-view';
  viewBtn.textContent = 'View';
  viewBtn.addEventListener('click', () => openGameModal(game));
  actions.appendChild(viewBtn);

  body.appendChild(actions);
  card.appendChild(body);

  return card;
}

// ---------- Steam-style expanded view (modal) ----------

let modalEl = null;

function ensureModal(){
  if (modalEl) return modalEl;

  modalEl = document.createElement('div');
  modalEl.className = 'game-modal-overlay';
  modalEl.innerHTML = `
    <div class="game-modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      <div class="modal-hero"></div>
      <div class="modal-body">
        <h2 class="modal-title"></h2>
        <span class="muted modal-date"></span>
        <p class="modal-desc"></p>
        <div class="modal-actions"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modalEl);

  modalEl.querySelector('.modal-close').addEventListener('click', closeGameModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeGameModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeGameModal();
  });

  return modalEl;
}

function openGameModal(game){
  const modal = ensureModal();

  const hero = modal.querySelector('.modal-hero');
  hero.style.backgroundImage = game.cover ? `url('${game.cover}')` : 'none';

  modal.querySelector('.modal-title').textContent = game.title;
  modal.querySelector('.modal-date').textContent = dateLabel(game);
  modal.querySelector('.modal-desc').textContent = game.longDescription || game.description || '';

  const actionsWrap = modal.querySelector('.modal-actions');
  actionsWrap.innerHTML = '';
  getActionsList(game).forEach(action => {
    const btn = buildActionButton(action);
    if (btn){
      btn.classList.add('btn-large');
      actionsWrap.appendChild(btn);
    }
  });

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGameModal(){
  if (!modalEl) return;
  modalEl.classList.remove('open');
  document.body.style.overflow = '';
}

async function renderGamesList(containerId){
  const container = document.getElementById(containerId);
  if (!container) return;
  container.classList.add('game-card-grid');
  const games = await loadGames();
  container.innerHTML = '';
  games.forEach(g => container.appendChild(buildGameCard(g)));
}

// Renders ONE specific game's full card into ONE specific container.
// Use this when you want a dedicated slot per game instead of the shared list.
// <div id="game-slot-1"></div>  +  renderSingleGame('game-slot-1', 'gameTemplate.json')
async function renderSingleGame(containerId, filename){
  const container = document.getElementById(containerId);
  if (!container) return;
  try{
    const game = await getGame(filename);
    container.innerHTML = '';
    container.appendChild(buildGameCard(game));
  }catch(err){
    console.warn(`Could not load game ${filename} into #${containerId}:`, err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderGamesList('games-list');
  renderGameFields();
});
