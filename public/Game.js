import { supabase } from './lib/supabaseClient.js'

let questions = []
let currentIndex = 0
let startTime, endTime
let currentDifficulty = 'easy'
let inputMode = 'text' // 'text' or 'block'
let userAnswerWords = []

// 要素取得
const stageSelect = document.getElementById('stage-select')
const modeSelect = document.getElementById('mode-select')
const game = document.getElementById('game')
const resultScreen = document.getElementById('result-screen')

// ✅ 共通：画面切り替え関数（ちらつき防止）
function showScreen(target) {
  [stageSelect, modeSelect, game, resultScreen].forEach(el => (el.style.display = 'none'))
  target.style.display = 'block'
}

// --- 難易度選択 ---
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentDifficulty = btn.dataset.difficulty
    document.getElementById('difficulty').textContent = `難易度：${btn.textContent}`
    showScreen(modeSelect)
  })
})

// --- モード選択 ---
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    inputMode = btn.dataset.mode
    showScreen(game)
    await loadQuestions(currentDifficulty)
  })
})

// --- Supabaseから問題取得 ---
async function loadQuestions(difficulty) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('difficulty', difficulty)
    .order('id', { ascending: true })

  if (error) {
    console.error('問題取得エラー:', error)
    alert('問題を取得できませんでした。')
    return
  }

  questions = data
  currentIndex = 0
  startTime = new Date()
  window.answerHistory = []
  showQuestion()
}

// --- 問題表示 ---
function showQuestion() {
  if (currentIndex >= questions.length) {
    showResult()
    return
  }

  // 初期化
  document.getElementById('result').textContent = ''
  document.getElementById('answer').value = ''
  document.getElementById('user-block-display').textContent = ''
  document.getElementById('word-blocks').innerHTML = ''
  userAnswerWords = []

  const q = questions[currentIndex]
  document.getElementById('question').textContent = q.question_jp
  document.getElementById('progress').textContent = `問題 ${currentIndex + 1} / ${questions.length}`

  if (inputMode === 'text') {
    document.getElementById('text-input-area').style.display = 'block'
    document.getElementById('block-input-area').style.display = 'none'
  } else {
    document.getElementById('text-input-area').style.display = 'none'
    document.getElementById('block-input-area').style.display = 'block'
    setupWordBlocks(q.answer_en)
  }
}

// --- 単語ブロック生成 ---
function setupWordBlocks(answer) {
  userAnswerWords = []
  const display = document.getElementById('user-block-display')
  const blocks = document.getElementById('word-blocks')
  display.textContent = ''
  blocks.innerHTML = ''

  const words = answer.split(' ')
  const shuffled = shuffle([...words])
  shuffled.forEach(word => {
    const btn = document.createElement('button')
    btn.textContent = word
    btn.className = 'word-btn'
    btn.addEventListener('click', () => {
      userAnswerWords.push(word)
      updateBlockDisplay()
      btn.disabled = true
    })
    blocks.appendChild(btn)
  })
}

function updateBlockDisplay() {
  document.getElementById('user-block-display').textContent = userAnswerWords.join(' ')
}

// --- 配列シャッフル ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// --- 回答判定（通常入力） ---
document.getElementById('submit-btn').addEventListener('click', () => {
  const userAnswer = document.getElementById('answer').value.trim()
  checkAnswer(userAnswer)
})

// --- 回答判定（ブロック入力） ---
document.getElementById('block-submit-btn').addEventListener('click', () => {
  checkAnswer(userAnswerWords.join(' '))
})

function checkAnswer(userAnswer) {
  const correctAnswer = questions[currentIndex].answer_en.trim()
  const normalize = str => str.toLowerCase().replace(/[.,!?]/g, '').trim()
  const isCorrect = normalize(userAnswer) === normalize(correctAnswer)
  let resultText

  if (!userAnswer) {
    resultText = `❌ 例: ${correctAnswer}`
  } else if (isCorrect) {
    resultText = '✅ 正解！'
  } else {
    resultText = `❌ 例: ${correctAnswer}`
  }

  const resultEl = document.getElementById('result')
  resultEl.textContent = resultText
  resultEl.style.color = !userAnswer ? '#dc2626' : isCorrect ? '#059669' : '#dc2626'

  window.answerHistory.push({
    question: questions[currentIndex].question_jp,
    userAnswer: userAnswer || '未記入',
    correctAnswer: correctAnswer,
    isCorrect
  })

  currentIndex++
  setTimeout(showQuestion, 1000)
}

// --- 結果表示 ---
function showResult() {
  endTime = new Date()
  const timeSec = ((endTime - startTime) / 1000).toFixed(2)
  showScreen(resultScreen)

  document.getElementById('summary').innerHTML = `
    全${questions.length}問完了！<br>
    経過時間：${timeSec} 秒
  `

  const ul = document.getElementById('resultsUl')
  ul.innerHTML = ''
  window.answerHistory.forEach(item => {
    const li = document.createElement('li')
    li.textContent = `Q: ${item.question}\nあなた: ${item.userAnswer}\n正解: ${item.correctAnswer}`
    li.className = item.isCorrect ? 'correct' : 'incorrect'
    ul.appendChild(li)
  })
}

// --- 戻るボタン（ゲーム画面・結果画面共通） ---
document.getElementById('back-to-stage-btn2').addEventListener('click', () => {
  window.answerHistory = []
  showScreen(stageSelect)
})

document.getElementById('back-to-stage-btn-result').addEventListener('click', () => {
  window.answerHistory = []
  showScreen(stageSelect)
})
