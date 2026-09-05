import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnswerPad from "../components/AnswerPad";
import LearningSessionGate from "../components/LearningSessionGate";
import { learningApi } from "../api/learningClient";
import {
  attackResult,
  didEvade,
  masteryPreview,
  monsterArchetypeForSession,
  monsterMaxHp,
  playerMaxHp,
  randomMonsterTier,
  receivedMonsterDamage,
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

const createBattleIdentity = () => {
  const sessionKey = `battle-v2-${newId()}`;
  const tier = randomMonsterTier();
  const archetype = monsterArchetypeForSession(sessionKey, tier.key);
  return { sessionKey, tier, archetype };
};

const monsterVisualClasses = {
  normal: { card: "border-slate-500 bg-slate-900/80", icon: "text-5xl md:text-6xl", hp: "bg-red-500" },
  elite: { card: "border-amber-300 bg-amber-950/40 shadow-lg shadow-amber-500/30", icon: "text-6xl md:text-7xl", hp: "bg-amber-500" },
  boss: { card: "border-fuchsia-300 bg-fuchsia-950/40 shadow-xl shadow-fuchsia-500/40", icon: "text-7xl md:text-8xl animate-pulse", hp: "bg-fuchsia-500" },
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
  const [battleIdentity, setBattleIdentity] = useState(() => createBattleIdentity());
  const [monsterHp, setMonsterHp] = useState(1);
  const [rounds, setRounds] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctHits, setCorrectHits] = useState(0);
  const [fastCorrectCount, setFastCorrectCount] = useState(0);
  const [monsterHit, setMonsterHit] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [settlementError, setSettlementError] = useState(false);
  const questionStartedAt = useRef(Date.now());
  const attemptId = useRef(null);
  const battleLockArmed = useRef(false);

  const monsterTier = battleIdentity.tier;
  const archetype = battleIdentity.archetype;
  const maxPlayerHp = playerMaxHp(level, stats.vitality);
  const maxMonsterHp = monsterMaxHp(level, monsterTier);
  const thresholds = timingThresholds(stats.agility);
  const monsterVisual = monsterVisualClasses[monsterTier.key] || monsterVisualClasses.normal;
  const battleEnded = playerHp <= 0 || monsterHp <= 0;
  const activeBattle = !loading && Boolean(question) && !battleEnded && !battleResult;

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

  const finalizeBattle = async (leadText = "戰鬥完成！") => {
    if (settlementSaving) return;
    setSettlementSaving(true);
    setSettlementError(false);
    try {
      const result = await learningApi.completeBattle(battleIdentity.sessionKey);
      const battle = result?.battle;
      if (!battle?.exp || !battle?.level) throw new Error("invalid_battle_result");
      setBattleResult(battle);
      setLevel(Number(battle.level.after || level));
      const levelText = Number(battle.level.gained || 0) > 0
        ? ` ✨ 升到 Lv.${battle.level.after}，獲得 ${battle.level.statPointsGained} 點屬性點！`
        : "";
      const stars = Number(battle.mastery?.stars ?? 0);
      const masteryText = battle.outcome === "victory" ? ` ${"⭐".repeat(stars)}${"☆".repeat(Math.max(0, 3 - stars))}` : "";
      setFeedback(`${leadText} +${battle.exp.earned} EXP。${masteryText}${levelText}`);
    } catch (_) {
      setSettlementError(true);
      setFeedback("戰鬥已結束，但成長結算尚未成功。請按「重試結算」，不會重複計算 EXP。");
    } finally {
      setSettlementSaving(false);
    }
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
        if (active) setFeedback("角色或題庫載入失敗，請重新進入森林再試");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!activeBattle) {
      if (battleLockArmed.current && window.history.state?.kidsBattleLock) {
        battleLockArmed.current = false;
        window.history.back();
      }
      return undefined;
    }

    if (!battleLockArmed.current) {
      window.history.pushState({ ...(window.history.state || {}), kidsBattleLock: true }, "", window.location.href);
      battleLockArmed.current = true;
    }

    const keepBattle = () => {
      window.history.pushState({ ...(window.history.state || {}), kidsBattleLock: true }, "", window.location.href);
      setFeedback("🔒 戰鬥已開始！擊敗怪物或戰敗後才能回世界。");
    };
    const blockUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("popstate", keepBattle);
    window.addEventListener("beforeunload", blockUnload);
    return () => {
      window.removeEventListener("popstate", keepBattle);
      window.removeEventListener("beforeunload", blockUnload);
    };
  }, [activeBattle]);

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
        sessionKey: battleIdentity.sessionKey,
        mode: "challenge",
        submittedAnswer: input.join(""),
        responseTimeMs,
        metadata: { battleRule: "v4", monsterTier: battleIdentity.tier.key, monsterArchetype: battleIdentity.archetype.key },
      });
      const attempt = result.attempt || {};
      const correct = Boolean(attempt.correct);
      const nextCombo = correct ? combo + 1 : 0;
      const nextMaxCombo = Math.max(maxCombo, nextCombo);
      const nextCorrectHits = correct ? correctHits + 1 : correctHits;
      const isFastCorrect = correct && responseTimeMs <= thresholds.fastMs;
      const nextFastCorrectCount = fastCorrectCount + (isFastCorrect ? 1 : 0);
      setCombo(nextCombo);
      setMaxCombo(nextMaxCombo);
      setCorrectHits(nextCorrectHits);
      setFastCorrectCount(nextFastCorrectCount);

      const attack = attackResult({
        level,
        strength: stats.strength,
        agility: stats.agility,
        responseTimeMs,
        correct,
        streak: nextCombo,
        archetype,
        correctHitIndex: nextCorrectHits,
      });
      const nextMonsterHp = Math.max(0, monsterHp - attack.damage);
      const nextRound = rounds + 1;
      setMonsterHp(nextMonsterHp);
      setRounds(nextRound);
      if (attack.damage > 0) flashMonsterHit();

      if (nextMonsterHp <= 0) {
        const comboText = nextCombo >= 3 ? ` 🔥 ${nextCombo} COMBO！` : "";
        await finalizeBattle(`🏆 擊敗${archetype.label}！第 ${nextRound} 題完成最後一擊。${comboText}`);
        return;
      }

      const evaded = didEvade(battleIdentity.sessionKey, currentAttemptId, stats.agility, correct);
      const received = receivedMonsterDamage(level, stats.vitality, monsterTier, correct, evaded, archetype, nextMonsterHp / maxMonsterHp);
      const nextPlayerHp = Math.max(0, playerHp - received);
      setPlayerHp(nextPlayerHp);
      if (received > 0) flashPlayerHit();
      if (nextPlayerHp <= 0) {
        await finalizeBattle(`💥 被${archetype.label}擊敗。這場共回答 ${nextRound} 題。`);
        return;
      }

      const gradeText = attack.grade === "fast" ? "快速重擊" : attack.grade === "normal" ? "普通攻擊" : attack.grade === "slow" ? "慢速攻擊" : "沒有命中";
      const comboText = nextCombo >= 3 ? ` 🔥 ${nextCombo} COMBO ×${attack.comboMultiplier.toFixed(1)}` : "";
      const traitText = attack.archetypeMultiplier < 1
        ? archetype.key === "golem" || archetype.key === "dragon" ? " 🛡️ 護盾減傷！" : " 👻 特性削弱了這一擊！"
        : attack.archetypeMultiplier > 1 ? " 🐺 連擊特性增傷！" : "";
      setFeedback(correct
        ? `✅ ${gradeText}：${attack.damage} 傷害；答對成功阻止怪物攻擊！${comboText}${traitText}`
        : evaded
          ? `❌ 答錯，Combo 歸零；正確是 ${attempt.correctAnswer || "請看下一題再試"}；⚡ 敏捷閃避成功，沒有受到傷害！`
          : `❌ 答錯，Combo 歸零；正確是 ${attempt.correctAnswer || "請看下一題再試"}；受到 ${received} 傷害。${archetype.key === "serpent" ? " ☠️ 毒牙加重傷害！" : archetype.key === "dragon" && nextMonsterHp / maxMonsterHp <= 0.35 ? " 🔥 巨龍狂暴！" : ""}`);
      window.setTimeout(() => {
        loadQuestion().catch(() => {
          setFeedback("下一題載入失敗，請稍後再試");
          setAnswerLocked(false);
        });
      }, 2000);
    } catch (_) {
      setFeedback("答案沒有成功儲存，請再按一次確認");
      setAnswerLocked(false);
    }
  };

  const restart = async () => {
    const nextBattleIdentity = createBattleIdentity();
    attemptId.current = null;
    setBattleIdentity(nextBattleIdentity);
    setPlayerHp(playerMaxHp(level, stats.vitality));
    setMonsterHp(monsterMaxHp(level, nextBattleIdentity.tier));
    setRounds(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectHits(0);
    setFastCorrectCount(0);
    setBattleResult(null);
    setSettlementError(false);
    setFeedback(`${nextBattleIdentity.archetype.icon} 遭遇${nextBattleIdentity.archetype.label}！${nextBattleIdentity.archetype.trait}`);
    setAnswerLocked(true);
    try { await loadQuestion(); }
    catch (_) { setFeedback("題目載入失敗，請稍後再試"); setAnswerLocked(false); }
  };

  if (loading && !question) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-2xl">正在載入角色與題目…</div>;
  }

  const controlsDisabled = answerLocked || !question || battleEnded;
  const leveledUp = Number(battleResult?.level?.gained || 0) > 0;
  const mastery = battleResult?.mastery || masteryPreview({
    outcome: monsterHp <= 0 ? "victory" : playerHp <= 0 ? "defeat" : "unfinished",
    archetype,
    questionCount: rounds,
    correctCount: Math.max(0, rounds - (rounds - correctHits)),
    maxCombo,
    fastCorrectCount,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 md:p-5 flex items-center justify-center">
      <div className="w-full max-w-6xl grid gap-3 md:gap-4">
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
          <div className="min-w-[150px]">
            {activeBattle ? (
              <div className="px-3 py-2 rounded-xl bg-red-950 border border-red-400/50 text-red-100 font-black text-sm">🔒 戰鬥中 · 無法離開</div>
            ) : <div />}
          </div>
          <div className="text-center text-xl md:text-2xl font-extrabold">🌲 森林戰鬥</div>
          <div className="text-right text-sm md:text-base">Lv.{level}　⚔️{stats.strength} ❤️{stats.vitality} ⚡{stats.agility}</div>
        </div>

        <div className="rounded-xl bg-indigo-950/70 border border-indigo-300/30 px-4 py-3 text-center">
          <div className="text-xl font-black">{archetype.icon} {archetype.label} <span className="text-sm font-bold text-indigo-200">· {monsterTier.label}</span></div>
          <div className="text-sm text-indigo-100 mt-1">特性：{archetype.trait}</div>
          <div className="text-xs text-amber-200 mt-1">⭐ 挑戰：{archetype.mastery} · ⭐⭐⭐ Perfect</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl border-2 p-3 bg-slate-900/80 transition ${playerHit ? "border-red-300 scale-[0.98] bg-red-950/70" : "border-emerald-700"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-4xl md:text-5xl">🧙‍♀️</div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span>玩家</span><span>{playerHp}/{maxPlayerHp}</span></div>
                <div className="h-5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (playerHp / maxPlayerHp) * 100)}%` }} /></div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border-2 p-3 transition ${monsterVisual.card}`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`${monsterVisual.icon} transition-transform duration-300 ${monsterHit ? "scale-75 rotate-6" : "scale-100"}`} aria-label={archetype.label}>{archetype.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1"><span>{archetype.label}</span><span>{monsterHp}/{maxMonsterHp}</span></div>
                <div className="h-6 bg-slate-800 rounded-full overflow-hidden border border-white/20"><div className={`h-full transition-all ${monsterVisual.hp}`} style={{ width: `${Math.min(100, (monsterHp / maxMonsterHp) * 100)}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className={`rounded-full px-4 py-1.5 font-extrabold ${combo >= 3 ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300"}`}>
            🔥 Combo {combo}{combo >= 3 ? ` · ×${attackResult({ level, strength: stats.strength, agility: stats.agility, responseTimeMs: thresholds.normalMs, correct: true, streak: combo, archetype, correctHitIndex: Math.max(1, correctHits) }).comboMultiplier.toFixed(1)}` : ""}
          </div>
        </div>

        <div className="rounded-xl bg-black/50 p-3 text-center font-bold min-h-[52px]">{settlementSaving ? "正在結算這場學習成果…" : feedback}</div>

        {battleResult && (
          <div className={`rounded-2xl border p-5 text-center ${leveledUp ? "border-amber-300 bg-amber-950/40" : "border-emerald-400/50 bg-emerald-950/40"}`}>
            <div className="text-2xl md:text-3xl font-black">{leveledUp ? `✨ LEVEL UP！Lv.${battleResult.level.after}` : "🎉 戰鬥結算完成"}</div>
            <div className="mt-2 text-3xl tracking-widest">{"⭐".repeat(Number(mastery?.stars || 0))}{"☆".repeat(Math.max(0, 3 - Number(mastery?.stars || 0)))}</div>
            <div className="mt-2 text-sm font-bold text-amber-200">{mastery?.perfect ? "PERFECT！完全征服這場戰鬥" : `Mastery ${Number(mastery?.stars || 0)} / 3`}</div>
            <div className="mt-3 text-lg font-bold">本場 +{battleResult.exp.earned} EXP</div>
            <div className="mt-1 text-slate-200">{battleResult.correctCount}/{battleResult.questionCount} 題答對</div>
            {leveledUp && <div className="mt-3 text-amber-200 font-bold">獲得 {battleResult.level.statPointsGained} 點能力點，可以讓角色變強。</div>}
          </div>
        )}

        {!battleEnded ? (
          <div className="grid gap-3 min-h-0">
            <div className="text-center text-xl md:text-2xl font-extrabold bg-white text-blue-900 rounded-xl py-2 px-3">請拼出：「{question?.chinese || "—"}」</div>
            <div className="text-center text-sm text-slate-300">快速 ≤ {(thresholds.fastMs / 1000).toFixed(1)} 秒 · 普通 ≤ {(thresholds.normalMs / 1000).toFixed(1)} 秒 · 連續答對 3 題開始增加傷害</div>
            <AnswerPad
              input={input}
              answerLength={question?.answerLength || 0}
              disabled={controlsDisabled}
              onLetter={(char) => input.length < (question?.answerLength || 0) && setInput((value) => [...value, char])}
              onBackspace={() => setInput((value) => value.slice(0, -1))}
              onClear={() => setInput([])}
              onSubmit={submit}
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3 rounded-2xl bg-slate-900/80 border border-white/10 p-4">
            {settlementError ? (
              <button
                onClick={() => finalizeBattle()}
                disabled={settlementSaving}
                className="sm:col-span-3 rounded-xl bg-amber-500 text-slate-950 text-lg font-black min-h-[56px] px-6 py-3 disabled:opacity-40"
              >
                {settlementSaving ? "結算中…" : "重試結算"}
              </button>
            ) : (
              <>
                <button onClick={() => navigate("/", { replace: true })} disabled={!battleResult} className="rounded-xl bg-emerald-600 text-lg font-black min-h-[56px] px-6 py-3 disabled:opacity-40">🌍 返回世界</button>
                <button
                  onClick={() => navigate("/status-v2")}
                  disabled={!battleResult}
                  className={`rounded-xl text-lg font-black min-h-[56px] px-6 py-3 disabled:opacity-40 ${leveledUp ? "bg-amber-400 text-slate-950" : "bg-slate-700 text-white"}`}
                >
                  {leveledUp ? `✨ 去分配 ${battleResult?.level?.statPointsGained || 0} 點能力點` : "🧙 查看我的角色"}
                </button>
                <button onClick={restart} disabled={!battleResult || settlementSaving} className="rounded-xl bg-indigo-600 text-lg font-black min-h-[56px] px-6 py-3 disabled:opacity-40">⚔️ 再打一場</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChallengeV2() {
  return (
    <LearningSessionGate>
      <ChallengeContent />
    </LearningSessionGate>
  );
}
