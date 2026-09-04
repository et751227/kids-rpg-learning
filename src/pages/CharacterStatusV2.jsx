import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LearningSessionGate from "../components/LearningSessionGate";
import { learningApi } from "../api/learningClient";
import { BASE_STATS, baseAttack, playerMaxHp, remainingStatPoints, timingThresholds } from "../game/battleRulesV2";

function CharacterStatusContent() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [nextLevelRequirement, setNextLevelRequirement] = useState(1);
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
        setNextLevelRequirement(Math.max(1, Number(data.nextLevelRequirement || 1)));
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
      baseAttack: Math.round(baseAttack(level, stats.strength)),
    };
  }, [level, stats]);

  const expPercent = Math.min(100, Math.max(0, (exp / nextLevelRequirement) * 100));
  const expRemaining = Math.max(0, nextLevelRequirement - exp);

  const changeStat = (key, delta) => {
    setStats((current) => {
      if (delta > 0 && remainingStatPoints(level, current) <= 0) return current;
      if (delta < 0 && current[key] <= 1) return current;
      return { ...current, [key]: current[key] + delta };
    });
  };

  const resetStats = async () => {
    if (!window.confirm("要重置全部屬性嗎？已使用的點數會全部退回，等級與 EXP 不會改變。")) return;
    setSaving(true);
    setMessage("");
    try {
      const saved = await learningApi.saveStats({ ...BASE_STATS });
      setStats(saved.stats || { ...BASE_STATS });
      setMessage("屬性已重置，點數已全部退回");
    } catch (_) {
      setMessage("屬性重置失敗，請再試一次");
    } finally {
      setSaving(false);
    }
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

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xl">正在讀取我的角色…</div>;

  const cards = [
    { key: "strength", label: "力量", icon: "⚔️", help: "提高每次答對時造成的傷害" },
    { key: "vitality", label: "體力", icon: "❤️", help: "提高戰鬥中的最大血量與減傷" },
    { key: "agility", label: "敏捷", icon: "⚡", help: "放寬攻擊時間門檻，答錯時也有機會閃避" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="px-4 py-2 rounded-lg bg-slate-700">← 回地圖</button>
          <div className="text-right">
            <div className="text-2xl font-bold">🧙 CHARACTER · 我的角色</div>
            <div className="text-sm text-slate-300">Lv.{level} · 剩餘點數 {remaining}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 p-4 mb-6 shadow-lg border border-indigo-400/30">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="font-bold text-lg">⭐ 升級進度</div>
            <div className="font-mono text-sm">EXP {exp} / {nextLevelRequirement}</div>
          </div>
          <div className="h-5 bg-slate-700 rounded-full overflow-hidden border border-white/10">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${expPercent}%` }} />
          </div>
          <div className="mt-2 text-sm text-slate-300 text-right">再獲得 {expRemaining} EXP 升到 Lv.{level + 1}</div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {cards.map((item) => (
            <div key={item.key} className="rounded-2xl bg-slate-800 p-5 shadow-lg">
              <div className="text-2xl font-bold mb-2">{item.icon} {item.label}</div>
              <div className="text-slate-300 min-h-[48px] mb-4">{item.help}</div>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => changeStat(item.key, -1)} disabled={stats[item.key] <= 1 || saving} className="w-12 h-12 text-2xl rounded-full bg-slate-600 disabled:opacity-40">−</button>
                <div className="text-4xl font-extrabold min-w-[56px] text-center">{stats[item.key]}</div>
                <button onClick={() => changeStat(item.key, 1)} disabled={remaining <= 0 || saving} className="w-12 h-12 text-2xl rounded-full bg-indigo-600 disabled:opacity-40">＋</button>
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
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={resetStats} disabled={saving} className="px-6 py-3 rounded-xl bg-slate-600 text-lg font-bold disabled:opacity-40">
            ♻️ 重置屬性
          </button>
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
