import { supabase } from './lib/supabaseClient.js'

let questions = []
let currentIndex = 0
let startTime, endTime
let currentDifficulty = 'easy'
let currentMode = 'input'
let results = []

const stageSelect = document.getElementById('stage-select')
const game = document.getElementById('game')
const resultScreen = document.getElementById('result-screen')

// 難易度ボタン
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    currentDifficulty = btn.dataset.difficulty
    document.getElementById('difficulty').textContent = `難易度：${btn.textContent}`
    await loadQuestions(currentDifficulty)
  })
})

// モード選択
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    currentMode = radio.value
  })
})

// Supabaseから問題取得
async function loadQuestions(difficulty) {
  stageSelect.style.display = 'none'
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
  results = []
  startTime = new Date()
  showQuestion()
}

// 問題表示
function showQuestion() {
  if (currentIndex >= questions.length) {
    showResult()
    return
  }

  const q = questions[currentIndex]
  document.getElementById('question').textContent = q.question_jp
  document.getElementById('progress').textContent = `問題 ${currentIndex + 1} / ${questions.length}`
  document.getElementById('result').textContent = ''

  // モードによって表示切替
  if (currentMode === 'input') {
    document.getElementById('answer').style.display = 'block'
    document.getElementById('submit-btn').style.display = 'block'
    document.getElementById('block-area').style.display = 'none'
    document.getElementById('block-input').style.display = 'none'
  } else {
    // 単語ブロック
    document.getElementById('answer').style.display = 'none'
    document.getElementById('submit-btn').style.display = 'none'
    document.getElementById('block-area').style.display = 'block'
    document.getElementById('block-input').style.display = 'block'

    setupWordBlocks(q.answer_en)
  }
}

// 入力式回答
document.getElementById('submit-btn').addEventListener('click', () => {
  const userAnswer = document.getElementById('answer').value.trim()
  checkAnswer(userAnswer)
})

// 単語ブロック生成
function setupWordBlocks(answer) {
  const blockArea = document.getElementById('block-area')
  const blockInput = document.getElementById('block-input')
  blockArea.innerHTML = ''
  blockInput.value = ''

  const words = answer.split(' ')
  words.sort(() => Math.random() - 0.5) // シャッフル

  words.forEach(word => {
    const btn = document.createElement('button')
    btn.textContent = word
    btn.style.margin = '4px'
    btn.style.backgroundColor = '#f97316'
    btn.style.color = 'white'
    btn.style.fontSize = '16px'
    btn.addEventListener('click', () => {
      blockInput.value += (blockInput.value ? ' ' : '') + word
    })
    blockArea.appendChild(btn)
  })

  // 回答ボタンも追加
  let submitBtn = document.createElement('button')
  submitBtn.textContent = '回答'
  submitBtn.style.display = 'block'
  submitBtn.style.marginTop = '10px'
  submitBtn.addEventListener('click', () => {
    checkAnswer(blockInput.value.trim())
  })
  blockArea.appendChild(submitBtn)
}

// 判定関数
function checkAnswer(userAnswer) {
  const correctAnswer = questions[currentIndex].answer_en.trim()
  const normalize = str => str.toLowerCase().replace(/[.,!?]/g, '').trim()
  const isCorrect = normalize(userAnswer) === normalize(correctAnswer)

  document.getElementById('result').textContent = isCorrect ? '✅ 正解！' : '❌ 例：${correctAnswer}'

  results.push({
    question: questions[currentIndex].question_jp,
    user: userAnswer || '(未記入)',
    correct: correctAnswer,
    isCorrect
  })

  currentIndex++
  setTimeout(showQuestion, 1000)
}

// 結果表示
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
  results.forEach(r => {
    const li = document.createElement('li')
    li.textContent = `${r.question}\nあなたの答え: ${r.user}\n正解: ${r.correct}`
    li.className = r.isCorrect ? 'correct' : 'incorrect'
    ul.appendChild(li)
  })
}

// リスタート
document.getElementById('restart-btn').addEventListener('click', () => {
  resultScreen.style.display = 'none'
  stageSelect.style.display = 'block'
})
