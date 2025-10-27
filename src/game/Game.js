// src/game/Game.js

import { saveScore } from '../../api/score'; // スコア保存関数をインポート
import Stage from './Stage'; // Stageクラスをインポート

class Game {
  constructor() {
    this.difficulty = 1;  // 難易度（仮）
    this.stage = 1;       // ステージ（仮）
    this.time = 0;        // プレイヤーがクリアしたタイム（仮）
    this.score = 0;       // スコア（仮）
    this.sessionId = this.generateSessionId(); // セッションID
    this.stageInstance = null; // 現在のステージインスタンス
  }

  // ランダムなセッションIDを生成する関数
  generateSessionId() {
    return 'session-' + Math.random().toString(36).substr(2, 9); // ランダムなIDを生成
  }

  // ゲーム開始時に呼ばれる
  startGame(difficulty) {
    this.difficulty = difficulty;
    this.stage = 1; // ステージ番号をリセット（必要であれば変更）
    console.log("ゲームを開始します。難易度: " + this.difficulty);

    // 新しいステージを初期化して開始
    this.stageInstance = new Stage(this, this.difficulty, this.stage);
    this.stageInstance.start(); // ステージ開始
  }

  // 問題を表示する（ステージ内で呼ばれる）
  showQuestion(japanese, english) {
    const questionText = document.getElementById('question-text');
    questionText.innerText = japanese;

    const answerOptions = document.getElementById('answer-options');
    answerOptions.innerHTML = ''; // 既存の選択肢をクリア

    // 例: 英語の正解文をボタンとして表示（必要に応じて変更）
    const optionButton = document.createElement('button');
    optionButton.innerText = english;
    optionButton.onclick = () => this.handleAnswer(english);
    answerOptions.appendChild(optionButton);
  }

  // ユーザーの入力を受け付ける処理（仮）
  handleAnswer(answer) {
    console.log("ユーザーの回答:", answer);
    
    // 正解判定（仮で英語の問題文がそのまま正解とする）
    const currentQuestion = this.stageInstance.questions[this.stageInstance.currentQuestionIndex - 1];
    if (answer === currentQuestion.english) {
      this.stageInstance.answerCorrect();
    } else {
      this.stageInstance.answerIncorrect();
    }
  }

  // ゲーム画面にタイマーを表示
  updateTimer(time) {
    const timeLeft = document.getElementById('time-left');
    timeLeft.innerText = time;
  }

  // ステージクリア画面を表示する
  showEndScreen(score) {
    alert(`ステージクリア！ あなたのスコアは ${score} です。`);
    this.saveGameScore(score); // スコアを保存
  }

  // スコアを保存する
  async saveGameScore(score) {
    const result = await saveScore(score, this.difficulty, this.stage, this.time);
    if (result) {
      console.log('スコアが保存されました', result);
    } else {
      console.error('スコア保存に失敗しました');
    }
  }

  // ゲームをリセットする（必要に応じて）
  resetGame() {
    this.difficulty = 1;
    this.stage = 1;
    this.score = 0;
    this.time = 0;
    this.sessionId = this.generateSessionId();
    console.log('ゲームをリセットしました。');
  }
}

export default Game;
