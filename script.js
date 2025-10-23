/* =======================================================
   JEOPARTY MUSIC — script.js (versión funcional)a
   ======================================================= */

const CATEGORIES = [
  "Anime",
  "Cultura popular",
  "Rock / Metal",
  "Cultura digital",
  "Banda sonora",
  "???"
];
const CATEGORY_KEYS = [
  "anime",
  "culturapopular",
  "rockmetal",
  "memeoculturadigital",
  "videojuegos",
  "random"
];
const VALUES = [200, 400, 600, 800, 1000];

let teams = [];
let currentTeam = 0;
let usedQuestions = {};
const LS_KEY = "jeoparty_state_v4";

const setupScreen = document.getElementById("setup");
const gameScreen = document.getElementById("game");
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
const answerModal = document.getElementById("answer-modal");
const answerVideo = document.getElementById("answer-video");
const answerBackBtn = document.getElementById("answer-back");
const turnBanner = document.getElementById("turn-banner");
const turnBannerText = document.getElementById("turn-banner-text");
const changeTurnAudio = document.getElementById("change-turn-audio");

/* ---------- SETUP ---------- */
function renderTeamInputs(n) {
  teamsNamesDiv.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `<label>Equipo ${i + 1}: <input class="team-name-input" value="Equipo ${i + 1}" /></label>`;
    teamsNamesDiv.appendChild(div);
  }
}
numTeamsInput.addEventListener("input", () => renderTeamInputs(numTeamsInput.value));

btnCreate.addEventListener("click", () => {
  const inputs = document.querySelectorAll(".team-name-input");
  teams = Array.from(inputs).map(inp => ({ name: inp.value.trim() || "Equipo", score: 0 }));
  currentTeam = 0;
  usedQuestions = {};
  saveState();
  setupScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  renderAll();
});

btnNewGame.addEventListener("click", () => {
  localStorage.removeItem(LS_KEY);
  gameScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
  renderTeamInputs(numTeamsInput.value || 2);
});

btnReset.addEventListener("click", () => {
  if (!confirm("¿Reiniciar puntuaciones y preguntas?")) return;
  teams.forEach(t => t.score = 0);
  usedQuestions = {};
  currentTeam = 0;
  saveState();
  renderAll();
});

/* ---------- GUARDAR/RECUPERAR ---------- */
function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify({ teams, currentTeam, usedQuestions }));
}
function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return false;
  try {
    const st = JSON.parse(raw);
    teams = st.teams || [];
    currentTeam = st.currentTeam || 0;
    usedQuestions = st.usedQuestions || {};
    return true;
  } catch {
    return false;
  }
}

/* ---------- RENDER ---------- */
function renderAll() {
  renderTeamsList();
  renderBoard();
  updateTurnIndicator();
}
function renderTeamsList() {
  teamsList.innerHTML = "";
  teams.forEach((t, idx) => {
    const el = document.createElement("div");
    el.className = "team" + (idx === currentTeam ? " current" : "");
    el.innerHTML = `<div class="name">${t.name}</div><div class="score">${t.score} pts</div>`;
    teamsList.appendChild(el);
  });
}
function updateTurnIndicator() {
  currentIndicator.textContent = `Turno: ${teams[currentTeam]?.name || "-"}`;
}

/* ---------- TABLERO ---------- */
function renderBoard() {
  boardEl.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const el = document.createElement("div");
    el.className = "category";
    el.textContent = cat;
    boardEl.appendChild(el);
  });
  VALUES.forEach(val => {
    CATEGORY_KEYS.forEach((key, idx) => {
      const qKey = `${key}-${val}`;
      const cell = document.createElement("div");
      cell.className = "value-cell";
      if (usedQuestions[qKey]) {
        cell.classList.add("disabled");
      } else {
        cell.textContent = val;
        cell.addEventListener("click", () => openQuestionModal(idx, val));
      }
      boardEl.appendChild(cell);
    });
  });
}

/* ---------- PREGUNTAS ---------- */
let currentQuestion = null;

function openQuestionModal(catIndex, val) {
  const catKey = CATEGORY_KEYS[catIndex];
  const qKey = `${catKey}-${val}`;
  if (usedQuestions[qKey]) return;
  currentQuestion = { catIndex, val, qKey, secondaryPaid: false };

  const mainPath = `assets/audio/${catKey}/${val}-main.mp3`;
  const secPath = `assets/audio/${catKey}/${val}-secondary.mp3`;
  const videoPath = `assets/videos/${catKey}-${val}.mp4`;
  console.log("🎵", mainPath, secPath, videoPath);

  qTitle.textContent = `${CATEGORIES[catIndex]} — ${val} pts`;
  qValueEl.textContent = `${val} puntos`;
  audioMain.src = mainPath;
  audioSecondary.src = secPath;
  answerVideo.src = videoPath;
  secondaryStatus.textContent = "(no pagada)";
  playSecondaryBtn.disabled = true;
  qModal.classList.remove("hidden");

  playMainBtn.onclick = () => { audioMain.currentTime = 0; audioMain.play(); };
  paySecondaryBtn.onclick = () => {
    teams[currentTeam].score -= 100;
    currentQuestion.secondaryPaid = true;
    secondaryStatus.textContent = "(pagada)";
    playSecondaryBtn.disabled = false;
    renderTeamsList();
    saveState();
    audioSecondary.currentTime = 0;
    audioSecondary.play();
  };
  playSecondaryBtn.onclick = () => {
    if (currentQuestion.secondaryPaid) {
      audioSecondary.currentTime = 0;
      audioSecondary.play();
    }
  };
  btnResolve.onclick = () => {
    teams[currentTeam].score += val;
    usedQuestions[qKey] = true;
    saveState();
    renderAll();
    qModal.classList.add("hidden");
    openAnswerModal(answerVideo.src);
    nextTeam();
  };
  btnPass.onclick = () => {
    qModal.classList.add("hidden");
    nextTeam();
  };
  btnBack.onclick = () => { qModal.classList.add("hidden"); };
}

/* ---------- RESPUESTA ---------- */
function openAnswerModal(videoSrc) {
  answerModal.classList.remove("hidden");
  answerVideo.src = videoSrc;
  answerVideo.load();
}
answerBackBtn.onclick = () => {
  answerModal.classList.add("hidden");
  try { answerVideo.pause(); } catch {}
};

/* ---------- TURNOS ---------- */
function nextTeam() {
  if (teams.length === 0) return;
  currentTeam = (currentTeam + 1) % teams.length;
  showTurnChange();
  renderAll();
  saveState();
}
function showTurnChange() {
  turnBannerText.textContent = `Turno de ${teams[currentTeam].name}`;
  changeTurnAudio.currentTime = 0;
  changeTurnAudio.play().catch(()=>{});
  turnBanner.classList.remove("hidden");
  turnBanner.classList.add("show");
  setTimeout(() => {
    turnBanner.classList.remove("show");
    turnBanner.classList.add("hidden");
  }, 2000);
}

/* ---------- INICIO ---------- */
if (loadState() && teams.length > 0) {
  setupScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  renderAll();
} else {
  setupScreen.classList.remove("hidden");
  renderTeamInputs(numTeamsInput.value || 2);
}
