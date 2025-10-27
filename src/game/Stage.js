import { getQuestions } from './api'; // APIから問題を取得する関数（仮）
import Phaser from 'phaser';

class Stage {
  constructor(game, difficulty, stageNumber) {
    this.game = game;
    this.difficulty = difficulty;
    this.stageNumber = stageNumber;
    this.questions = []; // ステージに表示する問題リスト
    this.currentQuestionIndex = 0; // 現在の問題番号
    this.score = 0; // 現在のスコア
    this.timeElapsed = 0; // 各問題にかかる時間（秒）
    this.timeLimit = 20; // 各問題の制限時間（秒）
    this.timer = null; // タイマーインターバル
  }

  // ステージ開始時に問題をロードする
  async start() {
    this.questions = await getQuestions(this.difficulty, this.stageNumber); // APIから問題を取得
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.timeElapsed = 0;
    this.startTimer();
    this.showNextQuestion();
  }

  // 次の問題を表示する
  showNextQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endStage();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];

    // 問題を表示する処理
    this.game.showQuestion(question.japanese, question.english);

    // 次の問題に進む
    this.currentQuestionIndex++;
  }

  // 正解を判定してスコアを加算
  answerCorrect() {
    this.score += 10; // 例えば正解ごとに10ポイント追加
    this.showNextQuestion();
  }

  // 不正解の場合
  answerIncorrect() {
    // 何もしないか、次の問題に進むオプションを提供
    this.showNextQuestion();
  }

  // タイマーをストップウォッチのように開始
  startTimer() {
    this.timeElapsed = 0; // タイマーをリセット
    this.timer = setInterval(() => {
      this.timeElapsed++; // 秒数が増える
      this.game.updateTimer(this.timeElapsed); // タイマー表示を更新
      if (this.timeElapsed >= this.timeLimit) {
        clearInterval(this.timer); // タイマー停止
        this.showNextQuestion(); // 制限時間終了で次の問題へ進む
      }
    }, 1000); // 1秒ごとにカウントアップ
  }

  // ステージ終了処理
  endStage() {
    this.game.showEndScreen(this.score); // 終了画面を表示（スコア表示）
    this.saveScore(); // スコアを保存
  }

  // スコアを保存する（Supabaseに送信）
  async saveScore() {
    const sessionId = this.game.sessionId; // ランダムセッションIDを使う
    await fetch('/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        score: this.score,
        difficulty: this.difficulty,
        stage: this.stageNumber,
        time: this.timeElapsed,  // 経過時間を保存
        created_at: new Date().toISOString()
      })
    });
  }
}

export default Stage;
