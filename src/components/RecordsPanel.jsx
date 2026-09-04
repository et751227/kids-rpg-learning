import { useEffect, useMemo, useState } from "react";
import { learningApi } from "../api/learningClient";

const TIER_LABELS = {
  normal: "一般怪",
  elite: "菁英怪",
  boss: "BOSS",
};

const WEAKNESS_LABELS = {
  struggling: "需要多練幾次",
  needs_practice: "再熟悉一下",
  watch: "下次再挑戰",
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RecordsPanel() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    learningApi.progress()
      .then((data) => {
        if (active) setProgress(data);
      })
      .catch(() => {
        if (active) setError("冒險紀錄讀取失敗，請稍後再試");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const battles = Array.isArray(progress?.recentBattles) ? progress.recentBattles : [];
  const weaknessWords = Array.isArray(progress?.wordWeakness?.words) ? progress.wordWeakness.words : [];

  const summary = useMemo(() => {
    const battlesCount = battles.length;
    const wins = battles.filter((battle) => battle.outcome === "victory").length;
    const questions = battles.reduce((sum, battle) => sum + Number(battle.questionCount || 0), 0);
    const correct = battles.reduce((sum, battle) => sum + Number(battle.correctCount || 0), 0);
    const exp = battles.reduce((sum, battle) => sum + Number(battle.earnedExp || 0), 0);
    const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
    return { battlesCount, wins, questions, correct, exp, accuracy };
  }, [battles]);

  if (loading) {
    return <div className="p-6 text-center text-lg text-gray-700 bg-white/90 rounded-lg shadow-lg max-w-2xl mx-auto mt-6">正在整理你的冒險故事…</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-lg text-red-700 bg-white/90 rounded-lg shadow-lg max-w-2xl mx-auto mt-6">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 grid gap-5">
      <section className="p-5 bg-yellow-100/95 rounded-2xl shadow-xl border border-yellow-300">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-black text-yellow-950">🗺️ 我的冒險成果</h2>
            <div className="text-sm text-yellow-800 mt-1">看看最近的森林冒險累積了多少力量。</div>
          </div>
          <div className="font-black text-violet-800">Lv.{Number(progress?.level || 1)}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">完成戰鬥</div><div className="text-2xl font-black">{summary.battlesCount}</div></div>
          <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">打贏怪物</div><div className="text-2xl font-black">{summary.wins}</div></div>
          <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">答題正確率</div><div className="text-2xl font-black">{summary.accuracy}%</div></div>
          <div className="rounded-xl bg-white p-3"><div className="text-xs text-slate-500">獲得 EXP</div><div className="text-2xl font-black">+{summary.exp}</div></div>
        </div>
      </section>

      <section className="p-5 bg-violet-950/95 text-white rounded-2xl shadow-xl border border-violet-300/40">
        <div className="mb-4">
          <h2 className="text-2xl font-black">🪄 需要再挑戰的魔法詞</h2>
          <div className="text-sm text-violet-200 mt-1">這些字最近曾經答錯，不代表不會，只是值得再遇見幾次。</div>
        </div>
        {weaknessWords.length === 0 ? (
          <div className="rounded-xl bg-white/10 p-4 text-center text-violet-100">目前沒有需要特別提醒的單字，繼續自由冒險就好。</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {weaknessWords.slice(0, 6).map((word) => (
              <div key={word.vocabularyId} className="rounded-xl bg-white/10 border border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-2xl font-black text-amber-300">{word.english}</div>
                    <div className="font-bold text-violet-100">{word.chinese}</div>
                  </div>
                  <div className="text-xs rounded-full bg-black/30 px-2 py-1">{WEAKNESS_LABELS[word.state] || "再挑戰"}</div>
                </div>
                <div className="mt-3 text-sm text-violet-200">最近 {word.attempts} 次遇見 · 答對 {word.correctCount} 次</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="p-5 bg-white/95 rounded-2xl shadow-xl border border-yellow-300">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-yellow-900">📖 森林戰鬥紀錄</h2>
          <div className="text-sm text-yellow-800 mt-1">已完成並成功結算的正式戰鬥。</div>
        </div>

        {battles.length === 0 ? (
          <div className="p-5 text-center text-gray-700">📝 尚無完成的森林戰鬥紀錄</div>
        ) : (
          <ul className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
            {battles.map((battle) => {
              const questions = Number(battle.questionCount || 0);
              const correct = Number(battle.correctCount || 0);
              const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
              const won = battle.outcome === "victory";
              return (
                <li key={battle.sessionKey} className="bg-white p-4 rounded-xl shadow border border-yellow-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="font-bold text-lg text-slate-800">
                      {won ? "🏆 勝利" : "💥 戰敗"} · {TIER_LABELS[battle.monsterTier] || battle.monsterTier}
                    </div>
                    <div className="text-sm text-slate-500">🕒 {formatTime(battle.completedAt)}</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-blue-50 p-2"><div className="text-xs text-slate-500">答對</div><div className="font-bold">{correct}/{questions}</div></div>
                    <div className="rounded-lg bg-emerald-50 p-2"><div className="text-xs text-slate-500">正確率</div><div className="font-bold">{accuracy}%</div></div>
                    <div className="rounded-lg bg-amber-50 p-2"><div className="text-xs text-slate-500">獲得 EXP</div><div className="font-bold">+{Number(battle.earnedExp || 0)}</div></div>
                    <div className="rounded-lg bg-violet-50 p-2"><div className="text-xs text-slate-500">等級</div><div className="font-bold">Lv.{battle.levelBefore} → {battle.levelAfter}</div></div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
