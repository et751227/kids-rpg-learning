import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LearningSessionGate from "../components/LearningSessionGate";
import { learningApi } from "../api/learningClient";
import { attackResult, monsterDamage, monsterMaxHp, playerMaxHp, timingThresholds } from "../game/battleRulesV2";

const newId = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  if (!cryptoApi?.getRandomValues) throw new Error("secure_crypto_unavailable");
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

function ChallengeContent() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [stats, setStats] = useState({ strength: 1, vitality: 1, agility: 1 });
  const [question, setQuestion] = useState(null);
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("準備戰鬥！");
  const [loading, setLoading] = useState(true);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [playerHp, setPlayerHp] = useState(1);
  const [monsterHp, setMonsterHp] = useState(1);
  const [rounds, setRounds] = useState(0);
  const questionStartedAt = useRef(Date.now());
  const sessionKey = useRef(`battle-v2-${newId()}`);
  const attemptId = useRef(null);

  const maxPlayerHp = playerMaxHp(level, stats.vitality);
  const maxMonsterHp = monsterMaxHp(level);
  const thresholds = timingThresholds(stats.agility);

  const loadQuestion = async () => {
    const data = await learningApi.nextQuestion("challenge");
    setQuestion(data.question);
    setInput([]);
    setAnswerLocked(false);
    attemptId.current = newId();
    questionStartedAt.current = Date.now();
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const progress = await learningApi.progress();
        if (!active) return;
        const nextLevel = Number(progress.level || 1);
        const nextStats = {
          strength: Number(progress.stats?.strength || 1),
          vitality: Number(progress.stats?.vitality || 1),
          agility: Number(progress.stats?.agility || 1),
        };
        setLevel(nextLevel);
        setStats(nextStats);
        setPlayerHp(playerMaxHp(nextLevel, nextStats.vitality));
        setMonsterHp(monsterMaxHp(nextLevel));
        await loadQuestion();
      } catch (_) {
        if (active) setFeedback("角色或題庫載入失敗，請回角色狀態後再試");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const submit = async () => {
    if (answerLocked || !question || !input.length || playerHp <= 0 || monsterHp <= 0) return;
    if (!attemptId.current) {
      setFeedback("本題識別碼遺失，請重新載入題目");
      return;
    }
    setAnswerLocked(true);
    const responseTimeMs = Date.now() - questionStartedAt.current;
    const currentAttemptId = attemptId.current;
    try {
      const result = await learningApi.submitAttempt({
        attemptId: currentAttemptId,
        vocabularyId: question.vocabularyId,
        sessionKey: sessionKey.current,
        mode: "challenge",
        submittedAnswer: input.join(""),
        responseTimeMs,
        metadata: { battleRule: "v2" },
      });
      const attempt = result.attempt || {};
      const correct = Boolean(attempt.correct);
      const attack = attackResult({ strength: stats.strength, agility: stats.agility, responseTimeMs, correct });
      const nextMonsterHp = Math.max(0, monsterHp - attack.damage);
      const nextRound = rounds + 1;
      setMonsterHp(nextMonsterHp);
      setRounds(nextRound);

      if (nextMonsterHp <= 0) {
        setFeedback(`🏆 勝利！第 ${nextRound} 題擊敗怪物。最後一擊 ${attack.damage}。`);
        return;
      }

      const incoming = monsterDamage(level);
      const received = correct ? Math.max(1, Math.floor(incoming / 2)) : incoming;
      const nextPlayerHp = Math.max(0, playerHp - received);
      setPlayerHp(nextPlayerHp);
      if (nextPlayerHp <= 0) {
        setFeedback(`💥 戰敗。這場共回答 ${nextRound} 題。`);
        return;
      }

      const gradeText = attack.grade === "fast" ? "快速重擊" : attack.grade === "normal" ? "普通攻擊" : attack.grade === "slow" ? "慢速攻擊" : "沒有命中";
      setFeedback(correct
        ? `✅ ${gradeText}：${attack.damage} 傷害；格擋後受到 ${received} 傷害。`
        : `❌ 答錯，正確是 ${attempt.correctAnswer || "請看下一題再試"}；受到 ${received} 傷害。`);
      window.setTimeout(() => {
        loadQuestion().catch(() => {
          setFeedback("下一題載入失敗，請按再打一場重試");
          setAnswerLocked(false);
        });
      }, 900);
    } catch (_) {
      setFeedback("答案沒有成功儲存，請再按一次確認");
      setAnswerLocked(false);
    }
  };

  const restart = async () => {
    sessionKey.current = `battle-v2-${newId()}`;
    attemptId.current = null;
    setPlayerHp(maxPlayerHp);
    setMonsterHp(maxMonsterHp);
    setRounds(0);
    setFeedback("再試一次！");
    setAnswerLocked(true);
    try { await loadQuestion(); }
    catch (_) { setFeedback("題目載入失敗，請稍後再試"); setAnswerLocked(false); }
  };

  if (loading && !question) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-2xl">正在載入角色與題目…</div>;
  }

  const controlsDisabled = answerLocked || !question || playerHp <= 0 || monsterHp <= 0;
  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 md:p-5 flex items-center justify-center">
      <div className="w-full max-w-6xl grid gap-3 md:gap-4" style={{ gridTemplateRows: "auto auto auto 1fr" }}>
        <div className="grid grid-cols-3 gap-3 items-center">
          <button onClick={() => navigate("/status-v2")} className="justify-self-start px-4 py-3 rounded-xl bg-slate-700 font-bold">← 角色狀態</button>
          <div className="text-center text-xl md:text-2xl font-extrabold">🌲 森林 Battle v2</div>
          <div className="text-right text-sm md:text-base">Lv.{level}　⚔️{stats.strength} ❤️{stats.vitality} ⚡{stats.agility}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><div className="flex justify-between text-sm"><span>玩家</span><span>{playerHp}/{maxPlayerHp}</span></div><div className="h-5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }} /></div></div>
          <div><div className="flex justify-between text-sm"><span>怪物</span><span>{monsterHp}/{maxMonsterHp}</span></div><div className="h-5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${(monsterHp / maxMonsterHp) * 100}%` }} /></div></div>
        </div>

        <div className="rounded-xl bg-black/50 p-3 text-center font-bold min-h-[52px]">{feedback}</div>

        <div className="grid md:grid-cols-[1fr_180px] gap-4 min-h-0">
          <div className="rounded-2xl bg-slate-800 p-4 flex flex-col gap-3 min-h-0">
            <div className="text-center text-xl md:text-2xl font-extrabold bg-white text-blue-900 rounded-xl py-2 px-3">請拼出：「{question?.chinese || "—"}」</div>
            <div className="text-center text-sm text-slate-300">快速 ≤ {(thresholds.fastMs / 1000).toFixed(1)} 秒 · 普通 ≤ {(thresholds.normalMs / 1000).toFixed(1)} 秒</div>
            <div className="text-center text-3xl md:text-4xl tracking-widest font-mono bg-white text-slate-900 rounded-full py-2 px-4 min-h-[56px]">{input.join("") || "⋯"}</div>
            <div className="grid grid-cols-7 gap-2 flex-1 content-center">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
                <button key={char} onClick={() => input.length < (question?.answerLength || 0) && setInput((v) => [...v, char])} disabled={controlsDisabled} className="min-h-[48px] md:min-h-[56px] rounded-xl bg-yellow-300 text-slate-900 text-lg md:text-xl font-bold active:scale-95 disabled:opacity-40">{char}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-rows-4 gap-3">
            <button onClick={() => setInput((v) => v.slice(0, -1))} disabled={controlsDisabled} className="rounded-xl bg-slate-500 text-lg font-bold min-h-[56px] disabled:opacity-40">⬅ 退格</button>
            <button onClick={() => setInput([])} disabled={controlsDisabled} className="rounded-xl bg-slate-500 text-lg font-bold min-h-[56px] disabled:opacity-40">🔄 清除</button>
            <button onClick={submit} disabled={controlsDisabled || !input.length} className="rounded-xl bg-green-600 text-xl font-extrabold min-h-[64px] disabled:opacity-40">✅ 確認</button>
            <button onClick={restart} className="rounded-xl bg-indigo-600 text-lg font-bold min-h-[56px]">再打一場</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChallengeV2() {
  return <LearningSessionGate><ChallengeContent /></LearningSessionGate>;
}
