// 簡易的な問題データ（後でSupabaseから取得可能）
const questions = [
  { japanese: "私は学生です。", english: "I am a student." },
  { japanese: "彼は昨日ここに来ました。", english: "He came here yesterday." },
  { japanese: "あなたはコーヒーが好きですか？", english: "Do you like coffee?" }
]

let currentIndex = 0
let startTime
let selectedDifficulty = null

const stageSelect = document.getElementById("stage-select")
const quiz = document.getElementById("quiz")
const result = document.getElementById("result")

const questionEl = document.getElementById("japanese-question")
const inputEl = document.getElementById("english-answer")
const feedbackEl = document.getElementById("feedback")
const nextBtn = document.getElementById("next-question")
const elapsedTimeEl = document.getElementById("elapsed-time")

// 難易度選択
document.querySelectorAll("#stage-select button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedDifficulty = parseInt(btn.dataset.difficulty)
    startQuiz()
  })
})

function startQuiz() {
  stageSelect.classList.add("hidden")
  quiz.classList.remove("hidden")
  currentIndex = 0
  startTime = Date.now()
  showQuestion()
}

function showQuestion() {
  const q = questions[currentIndex]
  questionEl.textContent = q.japanese
  inputEl.value = ""
  feedbackEl.textContent = ""
  nextBtn.classList.add("hidden")
}

document.getElementById("submit-answer").addEventListener("click", () => {
  const userAnswer = inputEl.value.trim().toLowerCase()
  const correctAnswer = questions[currentIndex].english.toLowerCase()

  if (userAnswer === correctAnswer || userAnswer.includes(correctAnswer.split(" ")[0])) {
    feedbackEl.textContent = "✅ 正解！"
    feedbackEl.style.color = "green"
  } else {
    feedbackEl.textContent = `❌ 不正解。正解は: ${questions[currentIndex].english}`
    feedbackEl.style.color = "red"
  }

  nextBtn.classList.remove("hidden")
})

nextBtn.addEventListener("click", () => {
  currentIndex++
  if (currentIndex < questions.length) {
    showQuestion()
  } else {
    endQuiz()
  }
})

function endQuiz() {
  quiz.classList.add("hidden")
  result.classList.remove("hidden")

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1)
  elapsedTimeEl.textContent = elapsedSec
}

// リトライ
document.getElementById("retry").addEventListener("click", () => {
  result.classList.add("hidden")
  stageSelect.classList.remove("hidden")
})
