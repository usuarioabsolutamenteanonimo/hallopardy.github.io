/* =======================================================
   JEOPARTY MUSIC — script.js
   ======================================================= */

// ======= VARIABLES GLOBALES =======
const categories = [
  "Anime",
  "Cultura popular",
  "Rock / Metal",
  "Meme o cultura digital",
  "Videojuegos",
  "???",
];
const values = [200, 400, 600, 800, 1000];

let teams = [];
let currentTeam = 0;
let usedQuestions = {};
let secondaryPaid = {}; // Controla si la pista secundaria fue pagada este turno

// Elementos principales
const setup = document.getElementById("setup");
const numTeamsInput = document.getElementById("num-teams");
const teamsNamesDiv = document.getElementById("teams-names");
const btnCreate = document.getElementById("btn-create");
const boardEl = document.getElementById("board");
const teamsList = document.getElementById("teams-list");
const currentIndicator = document.getElementById("current-team-indicator");
const changeTurnAudio = document.getElementById("change-turn-audio");
const turnBanner = document.getElementById("turn-banner");
const turnBannerText = document.getElementById("turn-banner-text");

// Modales
const questionModal = document.getElementById("question-modal");
const answerModal = document.getElementById("answer-modal");

const qTitle = document.getElementById("q-title");
const qValue = document.getElementById("q-value");
const audioMain = document.getElementById("audio-main");
const audioSecondary = document.getElementById("audio-secondary");
const playMain = document.getElementById("play-main");
const paySecondary = document.getElementById("pay-secondary");
const playSecondary = document.getElementById("play-secondary");
const secondaryStatus = document.getElementById("secondary-status");
const btnResolve = document.getElementById("btn-resolve");
const btnPass = document.getElementById("btn-pass");
const btnBack = document.getElementById("btn-back");
const closeQuestion = document.getElementById("close-question");

const answerVideo = document.getElementById("answer-video");
const answerBack = document.getElementById("answer-back");
const closeAnswer = document.getElementById("close-answer");

// ======= FUNCIONES =======

// Crear campos de nombres de equipo
numTeamsInput.addEventListener("change", () => {
  const n = parseInt(numTeamsInput.value);
  teamsNamesDiv.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Equipo ${i + 1}`;
    input.id = `team-${i}`;
    teamsNamesDiv.appendChild(input);
  }
});

btnCreate.addEventListener("click", () => {
  const n = parseInt(numTeamsInput.value);
  teams = [];
  for (let i = 0; i < n; i++) {
    const name = document.getElementById(`team-${i}`)?.value || `Equipo ${i + 1}`;
    teams.push({ name, score: 0 });
  }
  currentTeam = 0;
  usedQuestions = {};
  localStorage.setItem("jeoparty_teams", JSON.stringify(teams));
  setup.classList.add("hidden");
  renderBoard();
  renderTeams();
  updateTurnIndicator();
});

// Renderizar tablero
function renderBoard() {
  boardEl.innerHTML = "";
  categories.forEach((cat, catIndex) => {
    const title = document.createElement("div");
    title.className = "category";
    title.textContent = cat;
    boardEl.appendChild(title);

    values.forEach((val) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.textContent = val;
      cell.dataset.cat = catIndex;
      cell.dataset.value = val;

      if (usedQuestions[`${catIndex}-${val}`]) {
        cell.classList.add("used");
      }

      cell.addEventListener("click", () => openQuestion(catIndex, val));
      boardEl.appendChild(cell);
    });
  });
}

// Renderizar lista de equipos
function renderTeams() {
  teamsList.innerHTML = "";
  teams.forEach((t, i) => {
    const div = document.createElement("div");
    div.textContent = `${t.name}: ${t.score} pts`;
    if (i === currentTeam) div.style.fontWeight = "bold";
    teamsList.appendChild(div);
  });
}

// Actualizar indicador de turno
function updateTurnIndicator() {
  currentIndicator.textContent = `Turno de: ${teams[currentTeam].name}`;
}

// Mostrar animación y sonido de cambio de turno
function showTurnChangeAnimation() {
  changeTurnAudio.currentTime = 0;
  changeTurnAudio.play();
  turnBannerText.textContent = `Turno de ${teams[currentTeam].name}`;
  turnBanner.classList.remove("hidden");
  turnBanner.classList.add("show");

  setTimeout(() => {
    turnBanner.classList.remove("show");
    turnBanner.classList.add("hidden");
  }, 2000);
}

// Cambiar turno automáticamente
function nextTurn() {
  currentTeam = (currentTeam + 1) % teams.length;
  renderTeams();
  updateTurnIndicator();
  showTurnChangeAnimation();
}

// Abrir pregunta
function openQuestion(catIndex, val) {
  const key = `${catIndex}-${val}`;
  if (usedQuestions[key]) return;

  qTitle.textContent = `${categories[catIndex]} (${val} pts)`;
  qValue.textContent = `Valor: ${val} puntos`;

  audioMain.src = `assets/audio/${categories[catIndex].toLowerCase().replace(/\\s+/g, '')}/${val}-main.mp3`;
  audioSecondary.src = `assets/audio/${categories[catIndex].toLowerCase().replace(/\\s+/g, '')}/${val}-secondary.mp3`;
  answerVideo.src = `assets/videos/${categories[catIndex].toLowerCase().replace(/\\s+/g, '')}-${val}.mp4`;

  questionModal.classList.remove("hidden");
  secondaryPaid[key] = false;
  secondaryStatus.textContent = "";
  playSecondary.disabled = true;
}

// Pagar pista secundaria
paySecondary.addEventListener("click", () => {
  const cat = qTitle.textContent.split(" ")[0];
  const val = parseInt(qValue.textContent.match(/\\d+/)[0]);
  const key = `${categories.indexOf(cat)}-${val}`;

  if (!secondaryPaid[key]) {
    teams[currentTeam].score -= 100;
    secondaryPaid[key] = true;
    playSecondary.disabled = false;
    secondaryStatus.textContent = "Pista secundaria desbloqueada.";
    renderTeams();
  }
});

// Reproducir pistas
playMain.addEventListener("click", () => {
  audioMain.play();
});

playSecondary.addEventListener("click", () => {
  if (secondaryPaid) {
    audioSecondary.play();
  }
});

// Resolver pregunta (acierto)
btnResolve.addEventListener("click", () => {
  const val = parseInt(qValue.textContent.match(/\\d+/)[0]);
  teams[currentTeam].score += val;
  renderTeams();
  markQuestionUsed();
  questionModal.classList.add("hidden");
  showAnswer();
});

// Pasar turno
btnPass.addEventListener("click", () => {
  questionModal.classList.add("hidden");
  nextTurn();
});

// Volver sin resolver
btnBack.addEventListener("click", () => {
  questionModal.classList.add("hidden");
});

// Marcar pregunta usada
function markQuestionUsed() {
  const catIndex = categories.findIndex((c) => qTitle.textContent.includes(c));
  const val = parseInt(qValue.textContent.match(/\\d+/)[0]);
  const key = `${catIndex}-${val}`;
  usedQuestions[key] = true;
  renderBoard();
  nextTurn();
}

// Mostrar respuesta
function showAnswer() {
  questionModal.classList.add("hidden");
  answerModal.classList.remove("hidden");
  answerVideo.play();
}

// Cerrar respuesta
answerBack.addEventListener("click", () => {
  answerModal.classList.add("hidden");
  answerVideo.pause();
});

closeAnswer.addEventListener("click", () => {
  answerModal.classList.add("hidden");
  answerVideo.pause();
});

closeQuestion.addEventListener("click", () => {
  questionModal.classList.add("hidden");
});

// Botones de control manual de turno (opcional)
document.getElementById("btn-next-team")?.addEventListener("click", nextTurn);
document.getElementById("btn-prev-team")?.addEventListener("click", () => {
  currentTeam = (currentTeam - 1 + teams.length) % teams.length;
  renderTeams();
  updateTurnIndicator();
  showTurnChangeAnimation();
});
