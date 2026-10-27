import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ---------- Escena 3D ----------
const stage = document.getElementById('stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e1a);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 1.4, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
stage.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 7;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(3, 5, 4);
scene.add(key);

// Suelo
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3, 48),
  new THREE.MeshStandardMaterial({ color: 0x151932 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// ---------- Avatar ----------
const avatar = new THREE.Group();
scene.add(avatar);

const skin = new THREE.MeshStandardMaterial({ color: 0xe8b48a });
const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2f7fe0 });

// torso
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.7, 8, 16), shirtMat);
torso.position.y = 1.0;
avatar.add(torso);

// cabeza
const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), skin);
head.position.y = 1.85;
avatar.add(head);

// brazos
function arm(x) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.6, 6, 12), shirtMat);
  m.position.set(x, 1.1, 0);
  m.rotation.z = x > 0 ? -0.25 : 0.25;
  avatar.add(m);
  return m;
}
const armL = arm(-0.6);
const armR = arm(0.6);

// piernas
function leg(x) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a2f4a }));
  m.position.set(x, 0.25, 0);
  avatar.add(m);
}
leg(-0.22);
leg(0.22);

// ---------- Ropa ----------
const worn = { hat: null, cape: null };
const state = { hatItem: 'none', shirtColor: '#2f7fe0', cape: 'off' };

function clearHat() {
  if (worn.hat) { avatar.remove(worn.hat); worn.hat = null; }
}
function setHat(item) {
  clearHat();
  state.hatItem = item;
  if (item === 'cap') {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.37, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xe23b3b }));
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xe23b3b }));
    brim.position.set(0, 0, 0.35);
    g.add(dome, brim);
    g.position.y = 2.05;
    worn.hat = g;
    avatar.add(g);
  } else if (item === 'tophat') {
    const g = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 24),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    cyl.position.y = 0.3;
    g.add(cyl, brim);
    g.position.y = 2.1;
    worn.hat = g;
    avatar.add(g);
  }
}

function setShirt(color) {
  state.shirtColor = color;
  const c = new THREE.Color(color);
  shirtMat.color = c;
  armL.material.color = c;
  armR.material.color = c;
}

function setCape(on) {
  state.cape = on;
  if (worn.cape) { avatar.remove(worn.cape); worn.cape = null; }
  if (on === 'on') {
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 1.3, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a4fff, side: THREE.DoubleSide })
    );
    cape.position.set(0, 1.05, -0.4);
    cape.rotation.x = 0.1;
    worn.cape = cape;
    avatar.add(cape);
  }
}

// ---------- Botones ----------
document.querySelectorAll('.wear').forEach(btn => {
  btn.addEventListener('click', () => {
    const slot = btn.dataset.slot;
    const item = btn.dataset.item;
    document.querySelectorAll(`.wear[data-slot="${slot}"]`)
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (slot === 'hat') setHat(item === 'none' ? 'none' : item);
    if (slot === 'cape') setCape(item);
  });
});

document.querySelectorAll('.swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setShirt(btn.dataset.color);
  });
});

// ---------- Resize ----------
function resize() {
  const w = stage.clientWidth || 1;
  const h = stage.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

// ---------- Loop ----------
function animate() {
  requestAnimationFrame(animate);
  if (worn.cape) worn.cape.rotation.x = 0.1 + Math.sin(Date.now() * 0.002) * 0.04;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ---------- Chat con Ollama ----------
const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.2';

const statusEl = document.getElementById('ollama-status');
const log = document.getElementById('chatlog');
const form = document.getElementById('chatform');
const input = document.getElementById('chatinput');

function addMsg(who, text, isBot) {
  const p = document.createElement('p');
  p.className = 'msg' + (isBot ? ' bot' : '');
  p.innerHTML = `<span class="who">${who}:</span> `;
  p.appendChild(document.createTextNode(text));
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
  return p;
}

async function checkOllama() {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!r.ok) throw new Error();
    statusEl.textContent = 'Ollama conectado ✓';
    statusEl.className = 'status ok';
    return true;
  } catch {
    statusEl.textContent = 'Ollama no responde. Abre Ollama en tu PC.';
    statusEl.className = 'status bad';
    return false;
  }
}
checkOllama();

function lookDescription() {
  const hat = { none: 'sin sombrero', cap: 'gorra roja', tophat: 'sombrero de copa' }[state.hatItem];
  const cape = state.cape === 'on' ? 'con capa morada' : 'sin capa';
  return `El avatar lleva una camiseta de color ${state.shirtColor}, ${hat} y ${cape}.`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  addMsg('Tú', q, false);
  input.value = '';

  const ok = await checkOllama();
  if (!ok) {
    addMsg('Bot', 'No puedo responder: Ollama no está disponible.', true);
    return;
  }

  const botP = addMsg('Bot', '…', true);
  const prompt = `Eres un asistente de moda. ${lookDescription()} Pregunta del usuario: ${q}. Responde breve y en español.`;

  try {
    const r = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: true })
    });
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let acc = '';
    botP.lastChild.textContent = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.trim()) continue;
        try {
          const j = JSON.parse(line);
          if (j.response) {
            acc += j.response;
            botP.lastChild.textContent = acc;
            log.scrollTop = log.scrollHeight;
          }
        } catch {}
      }
    }
    if (!acc) botP.lastChild.textContent = '(sin respuesta)';
  } catch {
    botP.lastChild.textContent = 'Error al hablar con Ollama.';
  }
});
