const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

// Perguntas usadas na primeira execução (o dono pode mudar depois com /formulario)
const DEFAULT_QUESTIONS = [
  { id: 'q_nome', label: 'Nome do personagem', style: 'short', placeholder: 'Ex: João Silva', required: true },
  { id: 'q_id', label: 'ID no servidor (in-game)', style: 'short', placeholder: 'Ex: 1234', required: true },
  { id: 'q_tel', label: 'Telefone in-game', style: 'short', placeholder: 'Ex: 555-0123', required: true },
  { id: 'q_recrutador', label: 'Quem te recrutou?', style: 'short', placeholder: 'Nome de quem te recrutou', required: true },
  { id: 'q_obs', label: 'Observações', style: 'paragraph', placeholder: 'Algo que a liderança precise saber', required: false },
];

function read(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function write(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ================= PERGUNTAS =================
function getQuestions() {
  return read(QUESTIONS_FILE, DEFAULT_QUESTIONS);
}

function getQuestion(id) {
  return getQuestions().find((q) => q.id === id);
}

function saveQuestions(questions) {
  write(QUESTIONS_FILE, questions);
}

function addQuestion(question) {
  const questions = getQuestions();
  questions.push({ id: `q_${Date.now()}`, ...question });
  saveQuestions(questions);
}

// Altera só os campos informados em "changes"
function updateQuestion(id, changes) {
  const questions = getQuestions().map((q) => (q.id === id ? { ...q, ...changes } : q));
  saveQuestions(questions);
}

function removeQuestion(id) {
  const questions = getQuestions().filter((q) => q.id !== id);
  saveQuestions(questions);
}

// ================= REGISTROS =================
// Estrutura: { "<idDaMensagemDeAnalise>": { userId, answers, status, ... } }
function getRegistration(messageId) {
  return read(REGISTRATIONS_FILE, {})[messageId];
}

function saveRegistration(messageId, data) {
  const all = read(REGISTRATIONS_FILE, {});
  all[messageId] = data;
  write(REGISTRATIONS_FILE, all);
}

// Impede que a mesma pessoa mande vários pedidos ao mesmo tempo
function hasPendingRegistration(userId) {
  const all = read(REGISTRATIONS_FILE, {});
  return Object.values(all).some((r) => r.userId === userId && r.status === 'pending');
}

module.exports = {
  getQuestions,
  getQuestion,
  addQuestion,
  updateQuestion,
  removeQuestion,
  getRegistration,
  saveRegistration,
  hasPendingRegistration,
};