import { supabase } from './lib/supabaseClient.js'

let questions = []
let currentIndex = 0
let startTime, endTime
let currentDifficulty = 'easy'
let inputMode = 'text'
let userAnswerWords = []
let isSubmitting = false // 連打防止フラグ

// 要素取得
const stageSelect = document.getElementById('stage-select')
const modeSelect = document.getElementById('mode-select')
const game = document.getElementById('game')
const resultScreen = document.getElementById('result-screen')

// 難易度選択
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentDifficulty = btn.dataset.difficulty
    document.getElementById('difficulty').textContent = `難易度：${btn.textContent}`
    stageSelect.style.display = 'none'
    modeSelect.style.display = 'block'
  })
})

// モード選択
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    inputMode = btn.dataset.mode
    modeSelect.style.display = 'none'
    await loadQuestions(currentDifficulty)
  })
})

// --- 問題取得 ---
async function loadQuestions(difficulty) {
  game.style.display = 'block'

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

  document.getElementById('result').textContent = ''
  document.getElementById('answer').value = ''
  document.getElementById('user-block-display').textContent = ''
  document.getElementById('word-blocks').innerHTML = ''
  userAnswerWords = []
  isSubmitting = false

  const q = questions[currentIndex]
  document.getElementById('question').textContent = q.question_jp
  document.getElementById('progress').textContent = `問題 ${currentIndex + 1} / ${questions.length}`

  if (inputMode === 'text') {
    document.getElementById('text-input-area').style.display = 'block'
    document.getElementById('block-input-area').style.display = 'none'
    setTimeout(() => document.getElementById('answer').focus(), 100)
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
    btn.addEventListener('click', () => selectWord(word, btn))
    blocks.appendChild(btn)
  })
  updateBlockDisplay()
}

// --- ブロック選択と解除機能 ---
function selectWord(word, btn) {
  userAnswerWords.push({ word, btn })
  btn.disabled = true
  updateBlockDisplay()
}

function updateBlockDisplay() {
  const display = document.getElementById('user-block-display')
  display.innerHTML = ''

  userAnswerWords.forEach((item, index) => {
    const selectedBtn = document.createElement('button')
    selectedBtn.textContent = item.word
    selectedBtn.className = 'selected-word-btn'
    selectedBtn.addEventListener('click', () => {
      // クリックで元に戻す
      item.btn.disabled = false
      userAnswerWords.splice(index, 1)
      updateBlockDisplay()
    })
    display.appendChild(selectedBtn)
  })
}

// --- 配列シャッフル ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// --- 回答判定 ---
// テキスト入力
document.getElementById('submit-btn').addEventListener('click', () => {
  if (isSubmitting) return
  isSubmitting = true
  const btn = document.getElementById('submit-btn')
  btn.disabled = true

  const userAnswer = document.getElementById('answer').value.trim()
  checkAnswer(userAnswer)

  setTimeout(() => {
    btn.disabled = false
    isSubmitting = false
  }, 1200)
})

// Enterキーで回答
document.getElementById('answer').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()
    document.getElementById('submit-btn').click()
  }
})

// ブロック回答
document.getElementById('block-submit-btn').addEventListener('click', () => {
  if (isSubmitting) return
  isSubmitting = true
  const btn = document.getElementById('block-submit-btn')
  btn.disabled = true
  checkAnswer(userAnswerWords.map(w => w.word).join(' '))
  setTimeout(() => {
    btn.disabled = false
    isSubmitting = false
  }, 1200)
})

// --- 答え判定 ---
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
  game.style.display = 'none'
  resultScreen.style.display = 'block'

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

// --- 戻るボタン ---
document.getElementById('back-to-stage-btn2').addEventListener('click', () => {
  game.style.display = 'none'
  modeSelect.style.display = 'none'
  resultScreen.style.display = 'none'
  stageSelect.style.display = 'block'
  window.answerHistory = []
})

document.getElementById('back-to-stage-btn-result').addEventListener('click', () => {
  game.style.display = 'none'
  modeSelect.style.display = 'none'
  resultScreen.style.display = 'none'
  stageSelect.style.display = 'block'
  window.answerHistory = []
})
