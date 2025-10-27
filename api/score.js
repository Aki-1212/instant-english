// api/score.js

import supabase from '../public/lib/supabaseClient';

// ランダムなセッションIDを生成
function generateSessionId() {
  // より一意性を高めたUUIDを生成
  return crypto.randomUUID();  // 一意なUUIDを生成
}

// スコアをSupabaseに保存する関数
async function saveScore(score, difficulty, stage, time) {
  const sessionId = generateSessionId();  // 一意のセッションIDを生成

  try {
    const { data, error } = await supabase
      .from('scores')
      .insert([
        {
          session_id: sessionId,
          score: score,
          difficulty: difficulty,
          stage: stage,
          time: time
        }
      ]);

    if (error) {
      throw error;  // エラーがあれば例外をスロー
    }

    console.log('スコアが保存されました:', data);
    return data;
  } catch (error) {
    console.error('Error saving score:', error);
    // ここでユーザー向けにエラーメッセージを表示することも可能
    return null;
  }
}

export { saveScore };
