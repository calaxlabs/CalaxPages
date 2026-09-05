async function loadGames(){
  const manifestRes = await fetch('data/games/index.json');
  const filenames = await manifestRes.json();

  const games = await Promise.all(
    filenames.map(async (filename) => {
      const res = await fetch(`data/games/${filename}`);
      return res.json();
    })
  );

  return games;
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

  const title = document.createElement('span');
  title.textContent = game.title;

  const dateSpan = document.createElement('span');
  dateSpan.className = 'muted';
  if (game.status === 'released'){
    dateSpan.textContent = `Released: ${formatDate(game.releaseDate)}`;
  } else {
    dateSpan.textContent = `Expected: ${formatDate(game.predictedReleaseDate)}`;
  }

  row.appendChild(title);
  row.appendChild(dateSpan);
  row.appendChild(buildActionEl(game.action));

  if (game.description){
    row.title = game.description; // shows as a tooltip on hover
  }

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
});
