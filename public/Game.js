import { supabase } from './lib/supabaseClient.js'

let questions = []
let currentIndex = 0
let startTime, endTime
let currentDifficulty = 'easy'
let inputMode = 'text'
let userAnswerWords = [] // { word, btn, selected }
let isSubmitting = false

// 要素取得
const stageSelect = document.getElementById('stage-select')
const game = document.getElementById('game')
const resultScreen = document.getElementById('result-screen')

// --- 難易度ボタンで即ゲーム開始 ---
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value
    currentDifficulty = btn.dataset.difficulty
    inputMode = selectedMode

    document.getElementById('difficulty').textContent =
      `難易度：${currentDifficulty === 'easy' ? '初級' : currentDifficulty === 'normal' ? '中級' : '上級'}`

    stageSelect.style.display = 'none'
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

// --- ブロック生成 ---
function setupWordBlocks(answer) {
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
    btn.dataset.selected = 'false'
    btn.addEventListener('click', () => toggleWord(word, btn))
    blocks.appendChild(btn)
  })
}

// --- ブロック押下でテキスト文更新 ---
function toggleWord(word, btn) {
  const isSelected = btn.dataset.selected === 'true'

  if (isSelected) {
    // 選択解除
    btn.dataset.selected = 'false'
    btn.style.backgroundColor = ''
    btn.style.color = ''
    userAnswerWords = userAnswerWords.filter(w => w !== word)
  } else {
    // 選択追加
    btn.dataset.selected = 'true'
    btn.style.backgroundColor = '#f97316'
    btn.style.color = 'white'
    userAnswerWords.push(word)
  }

  updateBlockDisplay()
}

// --- テキスト文を更新して上に表示 ---
function updateBlockDisplay() {
  const display = document.getElementById('user-block-display')
  display.textContent = userAnswerWords.join(' ')
}

// --- シャッフル ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// --- 回答チェック ---
document.getElementById('submit-btn').addEventListener('click', handleSubmit)
document.getElementById('block-submit-btn').addEventListener('click', handleSubmit)
document.getElementById('answer').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleSubmit()
  }
})

function handleSubmit() {
  if (isSubmitting) return
  isSubmitting = true

  const userAnswer =
    inputMode === 'text'
      ? document.getElementById('answer').value.trim()
      : userAnswerWords.join(' ')

  checkAnswer(userAnswer)
  setTimeout(() => (isSubmitting = false), 500)
}

// --- 答え判定 ---
function checkAnswer(userAnswer) {
  const correctAnswer = questions[currentIndex].answer_en.trim()
  const normalize = str => str.toLowerCase().replace(/[.,!?]/g, '').trim()
  const isCorrect = normalize(userAnswer) === normalize(correctAnswer)

  const resultEl = document.getElementById('result')
  if (!userAnswer) {
    resultEl.textContent = `❌ 例: ${correctAnswer}`
    resultEl.style.color = '#dc2626'
  } else if (isCorrect) {
    resultEl.textContent = '✅ 正解！'
    resultEl.style.color = '#059669'
  } else {
    resultEl.textContent = `❌ 例: ${correctAnswer}`
    resultEl.style.color = '#dc2626'
  }

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
document.getElementById('back-to-stage-btn2').addEventListener('click', resetToStage)
document.getElementById('back-to-stage-btn-result').addEventListener('click', resetToStage)

function resetToStage() {
  game.style.display = 'none'
  resultScreen.style.display = 'none'
  stageSelect.style.display = 'block'
  window.answerHistory = []
}
