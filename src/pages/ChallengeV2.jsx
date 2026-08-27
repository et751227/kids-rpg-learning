import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnswerPad from "../components/AnswerPad";
import LearningSessionGate from "../components/LearningSessionGate";
import WorldBackButton from "../components/WorldBackButton";
import { learningApi } from "../api/learningClient";
import {
  attackResult,
  monsterDamage,
  monsterMaxHp,
  playerMaxHp,
  randomMonsterTier,
  timingThresholds,
} from "../game/battleRulesV2";

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

const monsterVisualClasses = {
  normal: {
    card: "border-slate-500 bg-slate-900/80",
    icon: "text-5xl md:text-6xl",
    hp: "bg-red-500",
  },
  elite: {
    card: "border-amber-300 bg-amber-950/40 shadow-lg shadow-amber-500/30",
    icon: "text-6xl md:text-7xl",
    hp: "bg-amber-500",
  },
  boss: {
    card: "border-fuchsia-300 bg-fuchsia-950/40 shadow-xl shadow-fuchsia-500/40",
    icon: "text-7xl md:text-8xl animate-pulse",
    hp: "bg-fuchsia-500",
  },
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
  const [monsterTier, setMonsterTier] = useState(() => randomMonsterTier());
  const [monsterHp, setMonsterHp] = useState(1);
  const [rounds, setRounds] = useState(0);
  const [monsterHit, setMonsterHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const questionStartedAt = useRef(Date.now());
  const sessionKey = useRef(`battle-v2-${newId()}`);
  const attemptId = useRef(null);

  const maxPlayerHp = playerMaxHp(level, stats.vitality);
  const maxMonsterHp = monsterMaxHp(level, monsterTier);
  const thresholds = timingThresholds(stats.agility);
  const monsterVisual = monsterVisualClasses[monsterTier.key] || monsterVisualClasses.normal;

  const flashMonsterHit = () => {
    setMonsterHit(true);
    window.setTimeout(() => setMonsterHit(false), 320);
  };

  const flashPlayerHit = () => {
    setPlayerHit(true);
    window.setTimeout(() => setPlayerHit(false), 320);
  };

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
        setMonsterHp(monsterMaxHp(nextLevel, monsterTier));
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
        metadata: { battleRule: "v2", monsterTier: monsterTier.key },
      });
      const attempt = result.attempt || {};
      const correct = Boolean(attempt.correct);
      const attack = attackResult({ strength: stats.strength, agility: stats.agility, responseTimeMs, correct });
      const nextMonsterHp = Math.max(0, monsterHp - attack.damage);
      const nextRound = rounds + 1;
      setMonsterHp(nextMonsterHp);
      setRounds(nextRound);
      if (attack.damage > 0) flashMonsterHit();

      if (nextMonsterHp <= 0) {
        setFeedback(`🏆 擊敗${monsterTier.label}！第 ${nextRound} 題完成最後一擊，造成 ${attack.damage} 傷害。`);
        return;
      }

      const incoming = monsterDamage(level, monsterTier);
      const received = correct ? Math.max(1, Math.floor(incoming / 2)) : incoming;
      const nextPlayerHp = Math.max(0, playerHp - received);
      setPlayerHp(nextPlayerHp);
      flashPlayerHit();
      if (nextPlayerHp <= 0) {
        setFeedback(`💥 被${monsterTier.label}擊敗。這場共回答 ${nextRound} 題。`);
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
      }, 2000);
    } catch (_) {
      setFeedback("答案沒有成功儲存，請再按一次確認");
      setAnswerLocked(false);
    }
  };

  const restart = async () => {
    const nextTier = randomMonsterTier();
    sessionKey.current = `battle-v2-${newId()}`;
    attemptId.current = null;
    setMonsterTier(nextTier);
    setPlayerHp(maxPlayerHp);
    setMonsterHp(monsterMaxHp(level, nextTier));
    setRounds(0);
    setFeedback(`${nextTier.icon} 遭遇${nextTier.label}！`);
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
      <div className="w-full max-w-6xl grid gap-3 md:gap-4">
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
          <div className="flex gap-2 items-center">
            <WorldBackButton />
            <button onClick={() => navigate("/status-v2")} className="px-4 py-3 rounded-xl bg-slate-700 font-bold min-h-[48px]">🧙 角色狀態</button>
          </div>
          <div className="text-center text-xl md:text-2xl font-extrabold">🌲 森林戰鬥</div>
          <div className="text-right text-sm md:text-base">Lv.{level}　⚔️{stats.strength} ❤️{stats.vitality} ⚡{stats.agility}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl border-2 p-3 bg-slate-900/80 transition ${playerHit ? "border-red-300 scale-[0.98] bg-red-950/70" : "border-emerald-700"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-4xl md:text-5xl">🧙‍♀️</div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span>玩家</span><span>{playerHp}/{maxPlayerHp}</span></div>
                <div className="h-5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }} /></div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border-2 p-3 transition ${monsterVisual.card}`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`${monsterVisual.icon} transition-transform duration-300 ${monsterHit ? "scale-75 rotate-6" : "scale-100"}`} aria-label={monsterTier.label}>{monsterTier.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span>{monsterTier.label}</span><span>{monsterHp}/{maxMonsterHp}</span></div>
                <div className="h-6 bg-slate-800 rounded-full overflow-hidden border border-white/20"><div className={`h-full transition-all ${monsterVisual.hp}`} style={{ width: `${(monsterHp / maxMonsterHp) * 100}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-black/50 p-3 text-center font-bold min-h-[52px]">{feedback}</div>

        <div className="grid gap-3 min-h-0">
          <div className="text-center text-xl md:text-2xl font-extrabold bg-white text-blue-900 rounded-xl py-2 px-3">請拼出：「{question?.chinese || "—"}」</div>
          <div className="text-center text-sm text-slate-300">快速 ≤ {(thresholds.fastMs / 1000).toFixed(1)} 秒 · 普通 ≤ {(thresholds.normalMs / 1000).toFixed(1)} 秒</div>
          <AnswerPad
            input={input}
            answerLength={question?.answerLength || 0}
            disabled={controlsDisabled}
            onLetter={(char) => input.length < (question?.answerLength || 0) && setInput((value) => [...value, char])}
            onBackspace={() => setInput((value) => value.slice(0, -1))}
            onClear={() => setInput([])}
            onSubmit={submit}
          />
          <button onClick={restart} className="justify-self-end rounded-xl bg-indigo-600 text-lg font-bold min-h-[48px] px-5 py-2">再打一場</button>
        </div>
      </div>
    </div>
  );
}

export default function ChallengeV2() {
  return <LearningSessionGate><ChallengeContent /></LearningSessionGate>;
}
