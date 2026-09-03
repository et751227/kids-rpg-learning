import { useEffect, useState } from "react";
import { learningApi } from "../api/learningClient";

const TIER_LABELS = {
  normal: "一般怪",
  elite: "菁英怪",
  boss: "BOSS",
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
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    learningApi.progress()
      .then((data) => {
        if (active) setBattles(Array.isArray(data?.recentBattles) ? data.recentBattles : []);
      })
      .catch(() => {
        if (active) setError("戰鬥紀錄讀取失敗，請稍後再試");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-lg text-gray-700 bg-white/90 rounded-lg shadow-lg max-w-2xl mx-auto mt-6">正在讀取城堡戰鬥紀錄…</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-lg text-red-700 bg-white/90 rounded-lg shadow-lg max-w-2xl mx-auto mt-6">{error}</div>;
  }

  if (battles.length === 0) {
    return <div className="p-6 text-center text-lg text-gray-700 bg-white/90 rounded-lg shadow-lg max-w-2xl mx-auto mt-6">📝 尚無完成的森林戰鬥紀錄</div>;
  }

  return (
    <div className="p-5 bg-yellow-100/90 rounded-xl shadow-xl max-w-3xl mx-auto mt-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-yellow-900">📖 森林戰鬥紀錄</h2>
        <div className="text-sm text-yellow-800 mt-1">這裡顯示已完成並成功結算的正式戰鬥。</div>
      </div>

      <ul className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
        {battles.map((battle) => {
          const questions = Number(battle.questionCount || 0);
          const correct = Number(battle.correctCount || 0);
          const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
          const won = battle.outcome === "victory";
          return (
            <li key={battle.sessionKey} className="bg-white p-4 rounded-xl shadow border border-yellow-300">
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
    </div>
  );
}
