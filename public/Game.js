import { supabase } from './lib/supabaseClient.js'

let questions = []
let currentIndex = 0
let startTime, endTime
let inputMode = 'text'
let userAnswerWords = []
let isSubmitting = false

const stageSelect = document.getElementById('stage-select')
const game = document.getElementById('game')
const resultScreen = document.getElementById('result-screen')

const categorySelect = document.getElementById('category-select')
const subCategorySelect = document.getElementById('sub-category-select')
const levelSelect = document.getElementById('level-select')
const startBtn = document.getElementById('start-btn')

// --- サブカテゴリ定義 ---
const subCategories = {
  "現在形": ["現在形", "現在進行形", "現在完了形", "現在完了進行形"],
  "過去時制": ["過去形", "過去進行形", "過去完了形", "過去完了進行形"],
  "未来時制": ["未来形", "未来進行形", "未来完了形", "未来完了進行形"],
  "日常会話編": ["日常会話編"],
  "旅行編": ["旅行編"],
  "お店編": ["お店編"]
}

// --- サブカテゴリ更新 ---
function updateSubCategories() {
  const cat = categorySelect.value
  subCategorySelect.innerHTML = ''

  const subs = subCategories[cat] || []  // undefined なら空配列にする

  subs.forEach(sub => {
    const opt = document.createElement('option')
    opt.value = sub
    opt.textContent = sub
    subCategorySelect.appendChild(opt)
  })
}
categorySelect.addEventListener('change', updateSubCategories)
updateSubCategories()

// --- ゲーム開始 ---
startBtn.addEventListener('click', async () => {
  const category = categorySelect.value
  const subCategory = subCategorySelect.value
  const level = levelSelect.value
  inputMode = document.querySelector('input[name="mode"]:checked').value

  document.getElementById('difficulty').textContent = `カテゴリー: ${category} / ${subCategory} レベル: ${level}`

  stageSelect.style.display = 'none'
  await loadQuestions(category, subCategory, level)
})

// --- 問題取得 ---
async function loadQuestions(category, subCategory, level) {
  game.style.display = 'block'

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('category', category)
    .eq('sub_category', subCategory)
    .eq('level', level)

  if (error) {
    console.error('問題取得エラー:', error)
    alert('問題を取得できませんでした。')
    return
  }

  // 30問プールからランダム10問を抽出
  questions = shuffle(data).slice(0, 10)
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

// --- 単語ブロッククリック処理 ---
function toggleWord(word, btn) {
  const isSelected = btn.dataset.selected === 'true'

  if (isSelected) {
    btn.dataset.selected = 'false'
    btn.style.backgroundColor = ''
    btn.style.color = ''
    userAnswerWords = userAnswerWords.filter(w => w !== word)
  } else {
    btn.dataset.selected = 'true'
    btn.style.backgroundColor = '#a9a9a9'
    btn.style.color = 'white'
    userAnswerWords.push(word)
  }

  updateBlockDisplay()
}

// --- 単語ブロック表示更新 ---
function updateBlockDisplay() {
  const display = document.getElementById('user-block-display')
  display.textContent = userAnswerWords.join(' ')
}

// --- 配列シャッフル ---
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// --- 回答送信 ---
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

  const correctCount = window.answerHistory.filter(a => a.isCorrect).length
  const accuracy = ((correctCount / questions.length) * 100).toFixed(1)

  const summaryEl = document.getElementById('summary')
  summaryEl.innerHTML = `
    <div class="result-container">
      <div class="time-card">
        <div class="time-row">
          <span class="label">今回のタイム：</span>
          <span class="value now">${timeSec} 秒</span>
        </div>
      </div>
      <div class="time-card">
        <div class="time-row">
          <span class="label">今回の正答率：</span>
          <span class="value now">${accuracy}%</span>
        </div>
      </div>
    </div>
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
