import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  attackResult,
  monsterDamage,
  monsterMaxHp,
  playerMaxHp,
  timingThresholds,
} from "../game/battleRulesV2";

const QUESTION_URL = "https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main";
const STATS_KEY = "battleV2DraftStats";

function readStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || "null") || { strength: 1, vitality: 1, agility: 1 };
  } catch (_) {
    return { strength: 1, vitality: 1, agility: 1 };
  }
}

export default function ChallengeV2() {
  const navigate = useNavigate();
  const level = Number(localStorage.getItem("level") || 1);
  const stats = useMemo(readStats, []);
  const [bank, setBank] = useState([]);
  const [question, setQuestion] = useState(null);
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("準備戰鬥！");
  const [loading, setLoading] = useState(true);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [playerHp, setPlayerHp] = useState(() => playerMaxHp(level, stats.vitality));
  const [monsterHp, setMonsterHp] = useState(() => monsterMaxHp(level));
  const [rounds, setRounds] = useState(0);
  const questionStartedAt = useRef(Date.now());

  const maxPlayerHp = playerMaxHp(level, stats.vitality);
  const maxMonsterHp = monsterMaxHp(level);
  const thresholds = timingThresholds(stats.agility);

  useEffect(() => {
    fetch(QUESTION_URL)
      .then((res) => res.json())
      .then((data) => {
        const clean = data.filter((item) => item?.chinese && item?.english).map((item) => ({
          chinese: item.chinese.trim(),
          english: item.english.trim(),
        }));
        setBank(clean);
        if (clean.length) pickNext(clean);
        else setFeedback("沒有可用題目");
      })
      .catch(() => setFeedback("題庫載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  const pickNext = (source = bank) => {
    if (!source.length) return;
    const next = source[Math.floor(Math.random() * source.length)];
    setQuestion(next);
    setInput([]);
    setAnswerLocked(false);
    questionStartedAt.current = Date.now();
  };

  const submit = () => {
    if (answerLocked || !question || !input.length || playerHp <= 0 || monsterHp <= 0) return;
    setAnswerLocked(true);

    const responseTimeMs = Date.now() - questionStartedAt.current;
    const correct = input.join("").toLowerCase() === question.english.toLowerCase();
    const attack = attackResult({ strength: stats.strength, agility: stats.agility, responseTimeMs, correct });
    const nextMonsterHp = Math.max(0, monsterHp - attack.damage);
    setMonsterHp(nextMonsterHp);
    setRounds((n) => n + 1);

    if (nextMonsterHp <= 0) {
      setFeedback(`🏆 勝利！第 ${rounds + 1} 題擊敗怪物。最後一擊 ${attack.damage}。`);
      return;
    }

    const incoming = monsterDamage(level);
    const received = correct ? Math.max(1, Math.floor(incoming / 2)) : incoming;
    const nextPlayerHp = Math.max(0, playerHp - received);
    setPlayerHp(nextPlayerHp);

    if (nextPlayerHp <= 0) {
      setFeedback(`💥 戰敗。這場共回答 ${rounds + 1} 題。`);
      return;
    }

    const gradeText = attack.grade === "fast" ? "快速重擊" : attack.grade === "normal" ? "普通攻擊" : attack.grade === "slow" ? "慢速攻擊" : "沒有命中";
    setFeedback(correct
      ? `✅ ${gradeText}：${attack.damage} 傷害；格擋後受到 ${received} 傷害。`
      : `❌ 答錯，正確是 ${question.english}；受到 ${received} 傷害。`);

    setTimeout(() => pickNext(), 900);
  };

  const restart = () => {
    setPlayerHp(maxPlayerHp);
    setMonsterHp(maxMonsterHp);
    setRounds(0);
    setFeedback("再試一次！");
    setAnswerLocked(false);
    pickNext();
  };

  if (loading && !question) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-2xl">載入 Battle v2 測試中…</div>;
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
            <div className="text-center text-xl md:text-2xl font-extrabold bg-white text-blue-900 rounded-xl py-2 px-3">
              請拼出：「{question?.chinese || "—"}」
            </div>
            <div className="text-center text-sm text-slate-300">快速 ≤ {(thresholds.fastMs / 1000).toFixed(1)} 秒 · 普通 ≤ {(thresholds.normalMs / 1000).toFixed(1)} 秒</div>
            <div className="text-center text-3xl md:text-4xl tracking-widest font-mono bg-white text-slate-900 rounded-full py-2 px-4 min-h-[56px]">
              {input.join("") || "⋯"}
            </div>
            <div className="grid grid-cols-7 gap-2 flex-1 content-center">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
                <button
                  key={char}
                  onClick={() => input.length < (question?.english.length || 0) && setInput((v) => [...v, char])}
                  disabled={controlsDisabled}
                  className="min-h-[48px] md:min-h-[56px] rounded-xl bg-yellow-300 text-slate-900 text-lg md:text-xl font-bold active:scale-95 disabled:opacity-40"
                >
                  {char}
                </button>
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
