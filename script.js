const viewport = document.getElementById('viewport');
const canvas = document.getElementById('canvas');

// Camera state
let camX = 0, camY = 0;   // canvas translation
let scale = 1;
const BOUND = 900;        // soft bound radius for camera offset
const MIN_SCALE = 0.5, MAX_SCALE = 1.8;

let isDragging = false;
let startX = 0, startY = 0;
let camStartX = 0, camStartY = 0;

function softClamp(value, limit){
  // smoothly resists beyond `limit` without a hard wall
  if (Math.abs(value) <= limit) return value;
  const over = Math.abs(value) - limit;
  const eased = limit + over / (1 + over / limit) * 0.6;
  return value < 0 ? -eased : eased;
}

function applyTransform(){
  canvas.style.transform = `translate(-50%, -50%) translate(${camX}px, ${camY}px) scale(${scale})`;
  viewport.style.setProperty('--bg-x', `${camX}px`);
  viewport.style.setProperty('--bg-y', `${camY}px`);
}

function settle(){
  // ease back if outside soft bounds (called after release)
  const clampedX = softClamp(camX, BOUND);
  const clampedY = softClamp(camY, BOUND);
  camX = clampedX;
  camY = clampedY;
  applyTransform();
}

viewport.addEventListener('mousedown', (e) => {
  isDragging = true;
  viewport.classList.add('dragging');
  startX = e.clientX;
  startY = e.clientY;
  camStartX = camX;
  camStartY = camY;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  let nx = camStartX + dx;
  let ny = camStartY + dy;
  nx = softClamp(nx, BOUND);
  ny = softClamp(ny, BOUND);
  camX = nx;
  camY = ny;
  applyTransform();
});

window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  viewport.classList.remove('dragging');
  settle();
});

// touch support
viewport.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  isDragging = true;
  startX = t.clientX;
  startY = t.clientY;
  camStartX = camX;
  camStartY = camY;
}, { passive: true });

viewport.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const t = e.touches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;
  camX = softClamp(camStartX + dx, BOUND);
  camY = softClamp(camStartY + dy, BOUND);
  applyTransform();
}, { passive: true });

viewport.addEventListener('touchend', () => {
  isDragging = false;
  settle();
});

// zoom with wheel
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = -e.deltaY * 0.0012;
  scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
  applyTransform();
}, { passive: false });

// navbar interactions: set active + smooth pan to panel
document.querySelectorAll('.nav-links li').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    item.classList.add('active');

    const target = document.getElementById(item.dataset.target);
    if (!target) return;
    const tx = parseFloat(getComputedStyle(target).getPropertyValue('--x')) || 0;
    const ty = parseFloat(getComputedStyle(target).getPropertyValue('--y')) || 0;

    // animate camera to center that panel
    const destX = softClamp(-tx, BOUND);
    const destY = softClamp(-ty, BOUND);
    animateCamera(destX, destY);
  });
});

function animateCamera(destX, destY){
  const startCamX = camX, startCamY = camY;
  const duration = 500;
  const start = performance.now();

  function step(now){
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    camX = startCamX + (destX - startCamX) * ease;
    camY = startCamY + (destY - startCamY) * ease;
    applyTransform();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

applyTransform();
