/*
  Jeoparty Music - script.js
  Reglas implementadas:
   - Configuración de equipos (nombre + puntuación)
   - Tablero 6 categorías x 5 valores (200..1000)
   - Modal de pregunta con audio principal y secundaria (la secundaria cuesta 100 puntos)
   - La secundaria se resetea cada vez que se abre la pregunta
   - Resolución muestra video de respuesta y suma puntos al equipo que resuelve
   - Pregunta deshabilitada permanentemente una vez resuelta
   - Estado persistente en localStorage
*/

// ----------------- CONFIG -----------------
const CATEGORIES = [
  {id: 'anime', name: 'Anime'},
  {id: 'cultura', name: 'Cultura popular'},
  {id: 'rock', name: 'Rock/Metal'},
  {id: 'meme', name: 'Meme / cultura digital'},
  {id: 'videojuegos', name: 'Videojuegos'},
  {id: 'random', name: '???'}
];
const VALUES = [200,400,600,800,1000];

// Preguntas: el usuario ha dicho que ya tiene los archivos. Aquí el sistema espera que los mp3 y mp4 sigan la convención:
// assets/audio/<categoria>/<categoria>-<value>-main.mp3
// assets/audio/<categoria>/<categoria>-<value>-sec.mp3
// assets/videos/<categoria>-<value>.mp4

// ----------------- ESTADO -----------------
let state = {
  teams: [], // {name, score}
  currentTeam: 0,
  answered: {}, // { 'anime-200': true }
};

const LS_KEY = 'jeoparty_state_v1';

// ----------------- SELECTORES -----------------
const setupScreen = document.getElementById('setup');
const teamsNamesDiv = document.getElementById('teams-names');
const numTeamsInput = document.getElementById('num-teams');
const btnCreate = document.getElementById('btn-create');
const btnNewGame = document.getElementById('btn-new-game');
const btnReset = document.getElementById('btn-reset');

const teamsList = document.getElementById('teams-list');
const currentIndicator = document.getElementById('current-team-indicator');
const btnPrevTeam = document.getElementById('btn-prev-team');
const btnNextTeam = document.getElementById('btn-next-team');

const boardEl = document.getElementById('board');

// Question modal
const qModal = document.getElementById('question-modal');
const qTitle = document.getElementById('q-title');
const qValue = document.getElementById('q-value');
const audioMain = document.getElementById('audio-main');
const audioSecondary = document.getElementById('audio-secondary');
const playMainBtn = document.getElementById('play-main');
const paySecondaryBtn = document.getElementById('pay-secondary');
const secondaryStatus = document.getElementById('secondary-status');
const closeQuestionBtn = document.getElementById('close-question');
const btnResolve = document.getElementById('btn-resolve');
const btnBack = document.getElementById('btn-back');

// Answer video modal
const answerModal = document.getElementById('answer-modal');
const answerVideo = document.getElementById('answer-video');
const closeAnswerBtn = document.getElementById('close-answer');
const answerBackBtn = document.getElementById('answer-back');

// State for current question open
let openQuestion = null; // {cat, value, key, secondaryPaid}

// ----------------- INIT -----------------
function loadState(){
  const raw = localStorage.getItem(LS_KEY);
  if(raw){
    try{ state = JSON.parse(raw); }catch(e){ console.warn('No se pudo parsear estado, iniciando nuevo'); }
  }
}

function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function start(){
  loadState();
  if(!state.teams || state.teams.length===0){
    openSetup();
  }else{
    renderAll();
  }
}

// ----------------- SETUP SCREEN -----------------
function openSetup(){
  setupScreen.classList.remove('hidden');
  teamsNamesDiv.innerHTML = '';
  renderTeamInputs(numTeamsInput.value);
}

function renderTeamInputs(n){
  teamsNamesDiv.innerHTML = '';
  for(let i=0;i<n;i++){
    const div = document.createElement('div');
    div.className='row';
    div.innerHTML = `<label>Nombre equipo ${i+1}: <input class="team-name-input" data-index="${i}" type="text" value="Equipo ${i+1}" /></label>`;
    teamsNamesDiv.appendChild(div);
  }
}
numTeamsInput.addEventListener('change', ()=> renderTeamInputs(numTeamsInput.value));

btnCreate.addEventListener('click', ()=>{
  const inputs = document.querySelectorAll('.team-name-input');
  const teams = Array.from(inputs).map(i=>({name: i.value||'Equipo', score:0}));
  state.teams = teams;
  state.currentTeam = 0;
  state.answered = {};
  saveState();
  setupScreen.classList.add('hidden');
  renderAll();
});

btnNewGame.addEventListener('click', ()=>{
  openSetup();
});

btnReset.addEventListener('click', ()=>{
  // Reinicia solo el tablero (no los nombres)
  if(!confirm('¿Reiniciar el tablero? Esto habilitará todas las preguntas y pondrá las puntuaciones a 0.')) return;
  state.teams.forEach(t=>t.score=0);
  state.answered = {};
  state.currentTeam = 0;
  saveState();
  renderAll();
});

// ----------------- RENDER -----------------
function renderAll(){
  renderTeamsList();
  renderBoard();
}

function renderTeamsList(){
  teamsList.innerHTML = '';
  state.teams.forEach((t,idx)=>{
    const div = document.createElement('div');
    div.className = 'team' + (idx===state.currentTeam? ' current':'');
    div.innerHTML = `<div class="name">${t.name}</div><div class="score">${t.score}</div>`;
    div.addEventListener('click', ()=>{ state.currentTeam = idx; saveState(); renderTeamsList(); renderBoard(); });
    teamsList.appendChild(div);
  });
  currentIndicator.textContent = `Turno: ${state.teams[state.currentTeam]?.name || '-'} `;
}

btnPrevTeam.addEventListener('click', ()=>{ state.currentTeam = (state.currentTeam - 1 + state.teams.length) % state.teams.length; saveState(); renderAll(); });
btnNextTeam.addEventListener('click', ()=>{ state.currentTeam = (state.currentTeam + 1) % state.teams.length; saveState(); renderAll(); });

function renderBoard(){
  boardEl.innerHTML = '';
  // categorías header
  CATEGORIES.forEach(cat=>{
    const c = document.createElement('div');
    c.className = 'category';
    c.innerHTML = `<h3>${cat.name}</h3>`;
    boardEl.appendChild(c);
  });
  // filas de valores
  VALUES.forEach(val=>{
    CATEGORIES.forEach(cat=>{
      const key = `${cat.id}-${val}`;
      const cell = document.createElement('div');
      cell.className = 'value-cell' + (state.answered[key]? ' disabled':'');
      cell.dataset.key = key;
      cell.dataset.cat = cat.id;
      cell.dataset.value = val;
      cell.textContent = state.answered[key]? '' : val;
      if(!state.answered[key]){
        cell.addEventListener('click', ()=> openQuestionModal(cat.id, val));
      }
      boardEl.appendChild(cell);
    });
  });
}

// ----------------- QUESTION FLOW -----------------
function openQuestionModal(cat, value){
  const key = `${cat}-${value}`;
  openQuestion = {cat, value, key, secondaryPaid:false};

  qTitle.textContent = `${getCategoryName(cat)} — Pista (${value} pts)`;
  qValue.textContent = `${value} puntos`;

  // Rutas de archivos (convention)
  const mainSrc = `assets/audio/${cat}/${cat}-${value}-main.mp3`;
  const secSrc = `assets/audio/${cat}/${cat}-${value}-sec.mp3`;
  const videoSrc = `assets/videos/${cat}-${value}.mp4`;

  audioMain.src = mainSrc;
  audioSecondary.src = secSrc;
  answerVideo.src = videoSrc;

  secondaryStatus.textContent = '(no pagada)';

  // setup buttons
  playMainBtn.onclick = ()=>{ audioMain.currentTime = 0; audioMain.play(); };
  paySecondaryBtn.onclick = ()=>{
    // charge current team 100 pts immediately
    const team = state.teams[state.currentTeam];
    if(!team) return alert('No hay equipo activo');
    if(team.score < 100){
      if(!confirm('El equipo no tiene suficientes puntos. Pagar igualmente dejará la puntuación en negativo. ¿Continuar?')) return;
    }
    team.score -= 100;
    openQuestion.secondaryPaid = true;
    secondaryStatus.textContent = '(pagada)';
    saveState();
    renderTeamsList();
    audioSecondary.currentTime = 0;
    audioSecondary.play();
  };

  // Resolve button: award points to team and mark answered
  btnResolve.onclick = ()=>{
    // award points to current team
    const team = state.teams[state.currentTeam];
    if(!team) return alert('No hay equipo activo');
    team.score += value;
    state.answered[key] = true;
    saveState();
    // show answer video
    qModal.classList.add('hidden');
    answerModal.classList.remove('hidden');
    answerVideo.currentTime = 0;
    answerVideo.play();
    renderAll();
  };

  // Back button (close question without awarding)
  btnBack.onclick = ()=>{
    // Note: the question stays enabled unless resolved. Requirement: "Cuando una pregunta se resuelva, ... esta pregunta sea deshabilitada". So failing doesn't disable.
    // We will simply close modal; secondaryPaid resets next time because openQuestion object will be replaced.
    closeQuestion();
  };

  closeQuestionBtn.onclick = closeQuestion;

  qModal.classList.remove('hidden');
}

function closeQuestion(){
  // stop audios
  audioMain.pause(); audioSecondary.pause();
  audioMain.currentTime = 0; audioSecondary.currentTime = 0;
  openQuestion = null;
  qModal.classList.add('hidden');
}

// ----------------- ANSWER FLOW -----------------
closeAnswerBtn.onclick = ()=>{
  answerVideo.pause(); answerVideo.currentTime = 0;
  answerModal.classList.add('hidden');
};
answerBackBtn.onclick = ()=>{
  answerVideo.pause(); answerVideo.currentTime = 0;
  answerModal.classList.add('hidden');
};

// ----------------- HELPERS -----------------
function getCategoryName(id){
  const c = CATEGORIES.find(x=>x.id===id);
  return c? c.name : id;
}

// ----------------- START APP -----------------
start();

// Optional: expose save / load to console for debugging
window.__jeoparty_state = state;
window.saveJeoparty = saveState;
