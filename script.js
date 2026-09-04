// Loads games.json and renders the grid. Adding a game = adding one
// object to games.json — no HTML editing needed.

function getFavorites(){
  try{
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  }catch(e){
    return [];
  }
}

function setFavorites(list){
  localStorage.setItem('favorites', JSON.stringify(list));
}

function toggleFavorite(title){
  const favs = getFavorites();
  const idx = favs.indexOf(title);
  if (idx === -1) favs.push(title); else favs.splice(idx, 1);
  setFavorites(favs);
  return favs;
}

function renderCard(game){
  const favs = getFavorites();
  const isFav = favs.includes(game.title);

  const card = document.createElement('div');
  card.className = 'game-card';
  card.innerHTML = `
    <div class="game-cover" style="--c1:${game.c1 || '#2a3f5a'}; --c2:${game.c2 || '#1b2838'}">
      <span>${game.icon || '🎮'}</span>
    </div>
    <div class="game-info">
      <h3>${game.title}</h3>
      <div class="game-meta">
        <span class="game-tag">${game.tag}</span>
        <span>${game.hours}h played</span>
        <button class="fav-btn ${isFav ? 'is-fav' : ''}" data-title="${game.title}">★</button>
      </div>
    </div>
  `;

  card.querySelector('.fav-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const updated = toggleFavorite(game.title);
    btn.classList.toggle('is-fav', updated.includes(game.title));
    document.dispatchEvent(new Event('favorites-changed'));
  });

  return card;
}

async function loadGames(){
  const res = await fetch('games.json');
  return res.json();
}

async function renderGameGrid(el, filterFn){
  const games = await loadGames();
  const list = filterFn ? games.filter(filterFn) : games;
  el.innerHTML = '';
  if (list.length === 0){
    el.innerHTML = '<p class="empty">No games here yet.</p>';
    return;
  }
  list.forEach(g => el.appendChild(renderCard(g)));
}
