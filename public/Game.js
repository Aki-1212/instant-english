import { supabase } from './lib/supabaseClient.js'

let questions = []
let currentIndex = 0
let startTime, endTime
let currentDifficulty = 'easy'

// 回答履歴
let answerHistory = []

// 要素取得
const stageSelect = document.getElementById('stage-select')
const game = document.getElementById('game')
const resultScreen = document.getElementById('result-screen')
const summaryEl = document.getElementById('summary')

// 難易度選択ボタン
document.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    currentDifficulty = btn.dataset.difficulty
    document.getElementById('difficulty').textContent = `難易度：${btn.textContent}`
    await loadQuestions(currentDifficulty)
  })
})

// 問題をSupabaseから取得
async function loadQuestions(difficulty) {
  stageSelect.style.display = 'none'
  game.style.display = 'block'

  answerHistory = [] // 前回の履歴をクリア
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
  showQuestion()
}

// 問題を表示
function showQuestion() {
  if (currentIndex >= questions.length) {
    showResult()
    return
  }

  const q = questions[currentIndex]
  document.getElementById('question').textContent = q.question_jp
  document.getElementById('answer').value = ''
  const resultEl = document.getElementById('result')
  resultEl.textContent = ''

  // 全問数と残り問数を表示
  const total = questions.length
  document.getElementById('progress').textContent = `問題 ${currentIndex + 1} / ${total}`
}

// 回答ボタン押下
document.getElementById('submit-btn').addEventListener('click', () => {
  const userAnswer = document.getElementById('answer').value.trim()
  const correctAnswer = questions[currentIndex].answer_en.trim()

  const normalize = (str) => str.toLowerCase().replace(/[.,!?]/g, '').trim()
  const isCorrect = normalize(userAnswer) === normalize(correctAnswer)

  // 正誤表示（ゲーム中のみ）
  const resultEl = document.getElementById('result')
  resultEl.textContent = isCorrect
    ? '✅ 正解！'
    : `❌ 不正解\n正しい答え: ${correctAnswer}`
  resultEl.className = isCorrect ? 'correct' : 'incorrect'

  // 履歴に追加（結果画面用）
  answerHistory.push({
    question: questions[currentIndex].question_jp,
    userAnswer,
    correctAnswer,
    isCorrect
  })

  currentIndex++
  setTimeout(showQuestion, 1500)
})

// 結果表示
function showResult() {
  endTime = new Date()
  const timeSec = ((endTime - startTime) / 1000).toFixed(2)
  game.style.display = 'none'
  resultScreen.style.display = 'block'

  // 結果画面に全履歴表示
  let historyHtml = '<ul>'
  answerHistory.forEach((a, i) => {
    historyHtml += `<li class="${a.isCorrect ? 'correct' : 'incorrect'}">
      Q${i + 1}: ${a.question} <br>
      あなたの答え: ${a.userAnswer} <br>
      正解: ${a.correctAnswer} (${a.isCorrect ? '〇' : '×'})
    </li>`
  })
  historyHtml += '</ul>'

  summaryEl.innerHTML = `
    全${questions.length}問完了！<br>
    経過時間：${timeSec} 秒
    <h3>回答履歴</h3>
    ${historyHtml}
  `
}

// リスタート
document.getElementById('restart-btn').addEventListener('click', () => {
  resultScreen.style.display = 'none'
  stageSelect.style.display = 'block'
})
