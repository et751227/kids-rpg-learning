import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LearningSessionGate from "../components/LearningSessionGate";
import { learningApi } from "../api/learningClient";
import { BASE_STATS, playerMaxHp, remainingStatPoints, timingThresholds } from "../game/battleRulesV2";

function CharacterStatusContent() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [stats, setStats] = useState({ ...BASE_STATS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const remaining = remainingStatPoints(level, stats);

  useEffect(() => {
    learningApi.progress()
      .then((data) => {
        setLevel(Number(data.level || 1));
        setExp(Number(data.exp || 0));
        setStats({
          strength: Number(data.stats?.strength || 1),
          vitality: Number(data.stats?.vitality || 1),
          agility: Number(data.stats?.agility || 1),
        });
      })
      .catch(() => setMessage("角色資料讀取失敗"))
      .finally(() => setLoading(false));
  }, []);

  const preview = useMemo(() => {
    const thresholds = timingThresholds(stats.agility);
    return {
      hp: playerMaxHp(level, stats.vitality),
      fastSeconds: (thresholds.fastMs / 1000).toFixed(1),
      normalSeconds: (thresholds.normalMs / 1000).toFixed(1),
      baseAttack: Math.round(8 + stats.strength * 1.5),
    };
  }, [level, stats]);

  const changeStat = (key, delta) => {
    setStats((current) => {
      if (delta > 0 && remainingStatPoints(level, current) <= 0) return current;
      if (delta < 0 && current[key] <= 1) return current;
      return { ...current, [key]: current[key] + delta };
    });
  };

  const saveAndBattle = async () => {
    setSaving(true);
    setMessage("");
    try {
      const saved = await learningApi.saveStats(stats);
      setStats(saved.stats || stats);
      navigate("/challenge");
    } catch (error) {
      setMessage(error.body?.error === "stat_budget_exceeded" ? "配點超過目前等級可用點數" : "角色能力儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xl">正在讀取角色狀態…</div>;

  const cards = [
    { key: "strength", label: "力量", icon: "⚔️", help: "提高每次答對時造成的傷害" },
    { key: "vitality", label: "體力", icon: "❤️", help: "提高戰鬥中的最大血量" },
    { key: "agility", label: "敏捷", icon: "⚡", help: "放寬快速與普通攻擊的時間門檻" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/")} className="px-4 py-2 rounded-lg bg-slate-700">← 回地圖</button>
          <div className="text-right">
            <div className="text-2xl font-bold">角色狀態</div>
            <div className="text-sm text-slate-300">Lv.{level} · EXP {exp} · 剩餘點數 {remaining}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {cards.map((item) => (
            <div key={item.key} className="rounded-2xl bg-slate-800 p-5 shadow-lg">
              <div className="text-2xl font-bold mb-2">{item.icon} {item.label}</div>
              <div className="text-slate-300 min-h-[48px] mb-4">{item.help}</div>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => changeStat(item.key, -1)} disabled={stats[item.key] <= 1} className="w-12 h-12 text-2xl rounded-full bg-slate-600 disabled:opacity-40">−</button>
                <div className="text-4xl font-extrabold min-w-[56px] text-center">{stats[item.key]}</div>
                <button onClick={() => changeStat(item.key, 1)} disabled={remaining <= 0} className="w-12 h-12 text-2xl rounded-full bg-indigo-600 disabled:opacity-40">＋</button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white text-slate-900 p-5 mb-6">
          <div className="text-xl font-bold mb-3">實際差異預覽</div>
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-red-50 p-3"><div className="text-sm">最大 HP</div><div className="text-3xl font-bold">{preview.hp}</div></div>
            <div className="rounded-xl bg-amber-50 p-3"><div className="text-sm">基礎攻擊</div><div className="text-3xl font-bold">{preview.baseAttack}</div></div>
            <div className="rounded-xl bg-blue-50 p-3"><div className="text-sm">快速 / 普通門檻</div><div className="text-xl font-bold">{preview.fastSeconds}s / {preview.normalSeconds}s</div></div>
          </div>
        </div>

        {message && <div className="text-center text-amber-300 mb-4">{message}</div>}
        <div className="flex justify-center">
          <button onClick={saveAndBattle} disabled={saving} className="px-8 py-3 rounded-xl bg-green-600 text-lg font-bold disabled:opacity-40">
            {saving ? "儲存中…" : "儲存能力並去打怪"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CharacterStatusV2() {
  return <LearningSessionGate><CharacterStatusContent /></LearningSessionGate>;
}
