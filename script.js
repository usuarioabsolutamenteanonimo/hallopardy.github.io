/* =======================================================
   JEOPARTY MUSIC — script.js (actualizado)
   - Corrige nombres de carpetas (ej. culturapopular)
   - Resetea pista secundaria cada vez que se abre la pregunta
   - Si se paga la secundaria, puede reproducirse ilimitadamente durante ese turno en esa pregunta
   - Resolver abre un modal con el vídeo (o muestra mensaje si falta)
   - Al resolver o pasar se cambia de turno automáticamente con animación y sonido
   - Mejores comprobaciones y logs para depuración
   ======================================================= */

/* ---------- CONFIG --------- */
// Nombres visibles (se muestran en tablero)
const CATEGORIES = [
  "Anime",
  "Cultura popular",
  "Rock / Metal",
  "Meme o cultura digital",
  "Videojuegos",
  "???"
];
// Carpetas (correspondientes y en minúsculas, SIN espacios)
const CATEGORY_KEYS = [
  "anime",
  "culturapopular",
  "rockmetal",
  "memeoculturadigital",
  "videojuegos",
  "random"
];

const VALUES = [200, 400, 600, 800, 1000];

/* ---------- ESTADO ---------- */
let teams = [];
let currentTeam = 0;
let usedQuestions = {}; // { "catKey-value": true }
let LS_KEY = "jeoparty_state_v3";

/* ---------- SELECTORES DOM ---------- */
const setupScreen = document.getElementById("setup");
const numTeamsInput = document.getElementById("num-teams");
const teamsNamesDiv = document.getElementById("teams-names");
const btnCreate = document.getElementById("btn-create");
const btnNewGame = document.getElementById("btn-new-game");
const btnReset = document.getElementById("btn-reset");

const boardEl = document.getElementById("board");
const teamsList = document.getElementById("teams-list");
const currentIndicator = document.getElementById("current-team-indicator");

const qModal = document.getElementById("question-modal");
const qTitle = document.getElementById("q-title");
const qValueEl = document.getElementById("q-value");
const audioMain = document.getElementById("audio-main");
const audioSecondary = document.getElementById("audio-secondary");
const playMainBtn = document.getElementById("play-main");
const paySecondaryBtn = document.getElementById("pay-secondary");
const playSecondaryBtn = document.getElementById("play-secondary");
const secondaryStatus = document.getElementById("secondary-status");
const btnResolve = document.getElementById("btn-resolve");
const btnPass = document.getElementById("btn-pass");
const btnBack = document.getElementById("btn-back");
const closeQuestionBtn = document.getElementById("close-question");

const answerModal = document.getElementById("answer-modal");
const answerVideo = document.getElementById("answer-video");
const closeAnswerBtn = document.getElementById("close-answer");
const answerBackBtn = document.getElementById("answer-back");

const turnBanner = document.getElementById("turn-banner");
const turnBannerText = document.getElementById("turn-banner-text");
const changeTurnAudio = document.getElementById("change-turn-audio");

/* ---------- UTIL ---------- */
function saveState() {
  const st = { teams, currentTeam, usedQuestions };
  localStorage.setItem(LS_KEY, JSON.stringify(st));
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const st = JSON.parse(raw);
      teams = st.teams || teams;
      currentTeam = typeof st.currentTeam === "number" ? st.currentTeam : currentTeam;
      usedQuestions = st.usedQuestions || usedQuestions;
    }
  } catch (e) {
    console.warn("Error cargando estado:", e);
  }
}

/* ---------- INICIALIZACIÓN UI ---------- */
function renderTeamInputs(n) {
  teamsNamesDiv.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `<label>Nombre equipo ${i + 1}: <input class="team-name-input" data-index="${i}" type="text" value="Equipo ${i + 1}" /></label>`;
    teamsNamesDiv.appendChild(div);
  }
}
numTeamsInput.addEventListener("change", () => renderTeamInputs(numTeamsInput.value));

btnCreate.addEventListener("click", () => {
  const inputs = document.querySelectorAll(".team-name-input");
  const t = Array.from(inputs).map(i => ({ name: i.value || "Equipo", score: 0 }));
  teams = t;
  currentTeam = 0;
  usedQuestions = {};
  saveState();
  setupScreen.classList.add("hidden");
  renderAll();
});

btnNewGame?.addEventListener("click", () => {
  setupScreen.classList.remove("hidden");
});

btnReset?.addEventListener("click", () => {
  if (!confirm("¿Reiniciar el tablero? Esto pondrá las puntuaciones a 0 y volverá a habilitar todas las preguntas.")) return;
  teams.forEach(t => t.score = 0);
  usedQuestions = {};
  currentTeam = 0;
  saveState();
  renderAll();
});

/* ---------- RENDER ---------- */
function renderAll() {
  renderTeamsList();
  renderBoard();
  updateTurnIndicator();
}

function renderTeamsList() {
  teamsList.innerHTML = "";
  teams.forEach((t, idx) => {
    const div = document.createElement("div");
    div.className = "team" + (idx === currentTeam ? " current" : "");
    div.innerHTML = `<div class="name">${t.name}</div><div class="score">${t.score}</div>`;
    div.addEventListener("click", () => {
      currentTeam = idx;
      saveState();
      renderAll();
    });
    teamsList.appendChild(div);
  });
}

function updateTurnIndicator() {
  currentIndicator.textContent = `Turno: ${teams[currentTeam] ? teams[currentTeam].name : '-'}`;
}

/* ---------- TABLERO ---------- */
function renderBoard() {
  boardEl.innerHTML = "";
  // categorías (header row)
  CATEGORIES.forEach(cat => {
    const el = document.createElement("div");
    el.className = "category";
    el.textContent = cat;
    boardEl.appendChild(el);
  });
  // filas de valores
  VALUES.forEach(val => {
    CATEGORY_KEYS.forEach((key, idx) => {
      const cell = document.createElement("div");
      cell.className = "value-cell";
      const qKey = `${key}-${val}`;
      cell.dataset.qkey = qKey;
      cell.dataset.catIndex = idx;
      cell.dataset.val = val;
      cell.textContent = usedQuestions[qKey] ? "" : val;
      if (!usedQuestions[qKey]) {
        cell.addEventListener("click", () => openQuestionModal(idx, val));
      } else {
        cell.classList.add("disabled");
      }
      boardEl.appendChild(cell);
    });
  });
}

/* ---------- TURN ANIMATION & AUDIO ---------- */
function showTurnChangeAnimation() {
  // set text and play audio
  const name = teams[currentTeam] ? teams[currentTeam].name : "—";
  if (turnBannerText) turnBannerText.textContent = `Turno de ${name}`;
  if (changeTurnAudio) {
    try {
      changeTurnAudio.currentTime = 0;
      changeTurnAudio.play().catch(()=>{/* autoplay may be blocked, that's OK */});
    } catch (e) { /* ignore */ }
  }
  if (turnBanner) {
    turnBanner.classList.remove("hidden");
    turnBanner.classList.add("show");
    // hide after animation duration (match CSS 2s)
    setTimeout(() => {
      turnBanner.classList.remove("show");
      turnBanner.classList.add("hidden");
    }, 2000);
  }
}

/* ---------- TURN CONTROL ---------- */
function nextTeam() {
  if (teams.length === 0) return;
  currentTeam = (currentTeam + 1) % teams.length;
  saveState();
  renderAll();
  showTurnChangeAnimation();
}

/* ---------- PREGUNTA: flujo ---------- */
let currentQuestion = null; // { catIndex, val, qKey, secondaryPaid }

function openQuestionModal(catIndex, val) {
  const catKey = CATEGORY_KEYS[catIndex];
  const qKey = `${catKey}-${val}`;
  if (usedQuestions[qKey]) return; // ya respondida

  // Reiniciar estado de pregunta abierta
  currentQuestion = { catIndex, val, qKey, secondaryPaid: false };

  // Actualizar UI del modal
  qTitle.textContent = `${CATEGORIES[catIndex]} — Pista (${val} pts)`;
  qValueEl.textContent = `${val} puntos`;

  // Rutas (asegúrate de que las carpetas siguen exactamente CATEGORY_KEYS)
  const mainPath = `assets/audio/${catKey}/${val}-main.mp3`;
  const secPath = `assets/audio/${catKey}/${val}-secondary.mp3`;
  const videoPath = `assets/videos/${catKey}-${val}.mp4`;

  audioMain.src = mainPath;
  audioSecondary.src = secPath;
  answerVideo.src = videoPath; // usado cuando se pulsa Resolver

  // Reset UI secundarios
  secondaryStatus.textContent = "(no pagada)";
  playSecondaryBtn.disabled = true;
  // ensure previous audio playback paused
  try { audioMain.pause(); audioSecondary.pause(); audioMain.currentTime = 0; audioSecondary.currentTime = 0; } catch(e){}

  // Mostrar modal
  qModal.classList.remove("hidden");

  // Set handlers (se reasignan cada vez para captura del currentQuestion en closure)
  playMainBtn.onclick = () => {
    audioMain.currentTime = 0;
    audioMain.play().catch(()=>{/* ignore autoplay blocks */});
  };

  paySecondaryBtn.onclick = () => {
    // cobrar 100 pts (puede quedar en negativo si el equipo no tiene puntos)
    const team = teams[currentTeam];
    if (!team) return alert("No hay equipo activo.");
    team.score -= 100;
    currentQuestion.secondaryPaid = true;
    secondaryStatus.textContent = "(pagada)";
    playSecondaryBtn.disabled = false;
    saveState();
    renderTeamsList();
    // start playback immediately
    audioSecondary.currentTime = 0;
    audioSecondary.play().catch(()=>{/*ignore*/});
  };

  playSecondaryBtn.onclick = () => {
    if (!currentQuestion.secondaryPaid) return alert("Primero pague la pista secundaria.");
    audioSecondary.currentTime = 0;
    audioSecondary.play().catch(()=>{/*ignore*/});
  };

  // Resolver: mostrar video (si existe) en modal de respuesta y marcar pregunta como usada
  btnResolve.onclick = () => {
    // Añadimos puntos al equipo actual
    const team = teams[currentTeam];
    if (!team) return alert("No hay equipo activo.");
    team.score += val;
    saveState();
    renderTeamsList();

    // marcar como respondida y actualizar tablero
    usedQuestions[qKey] = true;
    saveState();
    renderBoard();

    // cerrar modal de pregunta y abrir modal de respuesta con vídeo
    qModal.classList.add("hidden");
    openAnswerModalWithVideo(answerVideo.src);
    // después de resolver, pasar al siguiente equipo automáticamente
    nextTeam();
  };

  // Pasar turno sin marcar pregunta como respondida
  btnPass.onclick = () => {
    qModal.classList.add("hidden");
    // stop any audios
    try { audioMain.pause(); audioSecondary.pause(); } catch(e){}
    // pasar turno automático
    nextTeam();
  };

  btnBack.onclick = () => {
    qModal.classList.add("hidden");
    try { audioMain.pause(); audioSecondary.pause(); } catch(e){}
  };

  closeQuestionBtn.onclick = () => {
    qModal.classList.add("hidden");
    try { audioMain.pause(); audioSecondary.pause(); } catch(e){}
  };
}

/* ---------- MODAL RESPUESTA (vídeo o mensaje) ---------- */
function openAnswerModalWithVideo(videoSrc) {
  // limpiar modal anterior
  const modalInner = answerModal.querySelector(".modal");
  // remove any previous info-text
  const prevInfo = modalInner.querySelector(".answer-info-text");
  if (prevInfo) prevInfo.remove();

  // mostrar modal
  answerModal.classList.remove("hidden");

  // intentar cargar y reproducir video
  if (!videoSrc) {
    // no hay ruta
    showAnswerInfoText("No se ha proporcionado un vídeo para esta pregunta.");
    return;
  }

  // set video src (already set), try to play; on error show friendly message
  answerVideo.classList.remove("hidden");
  answerVideo.src = videoSrc;
  answerVideo.load();
  answerVideo.play().catch(() => {
    // Si autoplay bloqueado, simplemente permitimos que el usuario pulse play
  });

  // escucha error de carga para mostrar mensaje en su lugar
  answerVideo.onerror = () => {
    answerVideo.classList.add("hidden");
    showAnswerInfoText("No se encontró el vídeo de respuesta (archivo faltante).");
  };
}

function showAnswerInfoText(text) {
  const modalInner = answerModal.querySelector(".modal");
  const p = document.createElement("p");
  p.className = "answer-info-text";
  p.style.padding = "14px";
  p.style.background = "rgba(255,255,255,0.03)";
  p.style.borderRadius = "8px";
  p.textContent = text;
  modalInner.appendChild(p);
}

/* Cerrar modal de respuesta */
answerBackBtn.onclick = () => {
  answerModal.classList.add("hidden");
  try { answerVideo.pause(); answerVideo.currentTime = 0; } catch(e){}
};
closeAnswerBtn.onclick = () => {
  answerModal.classList.add("hidden");
  try { answerVideo.pause(); answerVideo.currentTime = 0; } catch(e){}
};

/* ---------- UTILIDADES DE DEPURACIÓN (opcional) ---------- */
function logRouteTest(catIndex, val) {
  const catKey = CATEGORY_KEYS[catIndex];
  console.log("Rutas probables para la pregunta:", {
    main: `assets/audio/${catKey}/${val}-main.mp3`,
    secondary: `assets/audio/${catKey}/${val}-secondary.mp3`,
    video: `assets/videos/${catKey}-${val}.mp4`
  });
}

/* ---------- START ---------- */
loadState();
// Si no hay equipos, abre setup
if (!teams || teams.length === 0) {
  setupScreen.classList.remove("hidden");
  renderTeamInputs(numTeamsInput.value || 2);
} else {
  setupScreen.classList.add("hidden");
  renderAll();
}
