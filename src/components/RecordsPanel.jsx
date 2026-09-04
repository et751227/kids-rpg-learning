import { useEffect, useMemo, useState } from "react";
import { learningApi } from "../api/learningClient";
import { MONSTER_ARCHETYPES } from "../game/battleRulesV2";

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

const FILTERS = [
  ["all", "全部"],
  ["victory", "🏆 勝利"],
  ["boss", "🐉 BOSS"],
  ["perfect", "⭐⭐⭐ PERFECT"],
  ["defeat", "💥 戰敗"],
];

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

const starText = (stars) => `${"⭐".repeat(Math.max(0, Math.min(3, stars)))}${"☆".repeat(Math.max(0, 3 - stars))}`;

export default function RecordsPanel() {
  const [progress, setProgress] = useState(null);
  const [battleHistory, setBattleHistory] = useState([]);
  const [battleSummary, setBattleSummary] = useState(null);
  const [battlePage, setBattlePage] = useState(null);
  const [historyAvailable, setHistoryAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      const [progressResult, historyResult] = await Promise.allSettled([
        learningApi.progress(),
        learningApi.battleHistory({ offset: 0, limit: 50 }),
      ]);

      if (!active) return;
      if (progressResult.status === "rejected") {
        setError("冒險紀錄讀取失敗，請稍後再試");
        setLoading(false);
        return;
      }
      setProgress(progressResult.value);

      if (historyResult.status === "fulfilled") {
        setBattleHistory(Array.isArray(historyResult.value?.lifetimeBattleHistory) ? historyResult.value.lifetimeBattleHistory : []);
        setBattleSummary(historyResult.value?.lifetimeBattleSummary || null);
        setBattlePage(historyResult.value?.battleHistoryPage || null);
        setHistoryAvailable(true);
      } else {
        setHistoryError("完整歷史目前暫時無法讀取，下面只顯示近期紀錄；不要把這個數字當成總成就。");
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const battles = historyAvailable
    ? battleHistory
    : (Array.isArray(progress?.recentBattles) ? progress.recentBattles : []);
  const weaknessWords = Array.isArray(progress?.wordWeakness?.words) ? progress.wordWeakness.words : [];

  const computedSummary = useMemo(() => {
    const battlesCount = battles.length;
    const wins = battles.filter((battle) => battle.outcome === "victory").length;
    const bossBattles = battles.filter((battle) => battle.monsterTier === "boss").length;
    const bossWins = battles.filter((battle) => battle.monsterTier === "boss" && battle.outcome === "victory").length;
    const questions = battles.reduce((sum, battle) => sum + Number(battle.questionCount || 0), 0);
    const correct = battles.reduce((sum, battle) => sum + Number(battle.correctCount || 0), 0);
    const exp = battles.reduce((sum, battle) => sum + Number(battle.earnedExp || 0), 0);
    const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
    return { battlesCount, wins, bossBattles, bossWins, questions, correct, exp, accuracy };
  }, [battles]);

  const summary = battleSummary ? {
    battlesCount: Number(battleSummary.battles || 0),
    wins: Number(battleSummary.victories || 0),
    bossBattles: Number(battleSummary.bosses?.encountered || 0),
    bossWins: Number(battleSummary.bosses?.victories || 0),
    questions: Number(battleSummary.questions || 0),
    correct: Number(battleSummary.correct || 0),
    exp: Number(battleSummary.earnedExp || 0),
    accuracy: Number(battleSummary.questions || 0) > 0
      ? Math.round((Number(battleSummary.correct || 0) / Number(battleSummary.questions || 0)) * 100)
      : 0,
  } : computedSummary;

  const recentGlory = useMemo(() => {
    const moments = [];
    const latestPerfect = battles.find((battle) => battle.mastery?.perfect);
    const latestBossWin = battles.find((battle) => battle.monsterTier === "boss" && battle.outcome === "victory");
    const latestLevelUp = battles.find((battle) => Number(battle.levelAfter || 1) > Number(battle.levelBefore || 1));

    if (latestPerfect) {
      moments.push({ icon: "⭐⭐⭐", title: "完成 PERFECT", detail: `${MONSTER_ARCHETYPES[latestPerfect.monsterArchetype]?.label || "森林戰鬥"} · ${formatTime(latestPerfect.completedAt)}` });
    }
    if (latestBossWin) {
      moments.push({ icon: "🐉", title: "擊敗王者巨龍", detail: `${starText(Number(latestBossWin.mastery?.stars || 0))} · ${formatTime(latestBossWin.completedAt)}` });
    }
    if (latestLevelUp) {
      moments.push({ icon: "✨", title: `升上 Lv.${latestLevelUp.levelAfter}`, detail: formatTime(latestLevelUp.completedAt) });
    }
    return moments.slice(0, 3);
  }, [battles]);

  const monsterHall = useMemo(() => {
    return Object.values(MONSTER_ARCHETYPES).map((monster) => {
      const encounters = battles.filter((battle) => battle.monsterArchetype === monster.key);
      const victories = encounters.filter((battle) => battle.outcome === "victory");
      const bestStars = encounters.reduce((best, battle) => Math.max(best, Number(battle.mastery?.stars || 0)), 0);
      const bestCombo = encounters.reduce((best, battle) => Math.max(best, Number(battle.mastery?.maxCombo || 0)), 0);
      const perfect = encounters.some((battle) => Boolean(battle.mastery?.perfect));
      return { monster, encounters: encounters.length, victories: victories.length, bestStars, bestCombo, perfect };
    });
  }, [battles]);

  const filteredBattles = useMemo(() => battles.filter((battle) => {
    if (historyFilter === "victory") return battle.outcome === "victory";
    if (historyFilter === "boss") return battle.monsterTier === "boss";
    if (historyFilter === "perfect") return Boolean(battle.mastery?.perfect);
    if (historyFilter === "defeat") return battle.outcome === "defeat";
    return true;
  }), [battles, historyFilter]);

  const loadMore = async () => {
    if (!historyAvailable || !battlePage?.hasMore || loadingMore) return;
    setLoadingMore(true);
    setHistoryError("");
    try {
      const next = await learningApi.battleHistory({ offset: battlePage.nextOffset, limit: 50 });
      const incoming = Array.isArray(next?.lifetimeBattleHistory) ? next.lifetimeBattleHistory : [];
      setBattleHistory((current) => {
        const seen = new Set(current.map((battle) => battle.sessionKey));
        return [...current, ...incoming.filter((battle) => !seen.has(battle.sessionKey))];
      });
      setBattleSummary(next?.lifetimeBattleSummary || battleSummary);
      setBattlePage(next?.battleHistoryPage || null);
    } catch {
      setHistoryError("更早的冒險紀錄暫時載入失敗，已載入的歷史不受影響，請稍後再試。");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-lg text-gray-700 bg-white/90 rounded-lg shadow-lg max-w-2xl mx-auto mt-6">正在打開你的冒險城堡…</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-lg text-red-700 bg-white/90 rounded-lg shadow-lg max-w-2xl mx-auto mt-6">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 grid gap-5">
      <section className="p-5 md:p-6 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 rounded-3xl shadow-2xl border-2 border-amber-300">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-black tracking-[0.25em] text-amber-700">TROPHY HALL</div>
            <h2 className="mt-1 text-3xl md:text-4xl font-black text-amber-950">🏆 我的榮耀大廳</h2>
            <div className="text-amber-800 mt-2 font-bold">不是報表，是我一路走到現在留下來的成就。</div>
          </div>
          <div className="rounded-2xl bg-amber-950 text-amber-100 px-5 py-3 text-center shadow-lg">
            <div className="text-xs font-bold">現在的我</div>
            <div className="text-3xl font-black">Lv.{Number(progress?.level || 1)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mt-5">
          <div className="rounded-2xl bg-white/90 p-4 shadow"><div className="text-xs text-slate-500">🏆 總勝利</div><div className="text-3xl font-black text-slate-900">{summary.wins}</div></div>
          <div className="rounded-2xl bg-white/90 p-4 shadow"><div className="text-xs text-slate-500">⚔️ 冒險戰鬥</div><div className="text-3xl font-black text-slate-900">{summary.battlesCount}</div></div>
          <div className="rounded-2xl bg-amber-50 p-4 shadow border border-amber-300"><div className="text-xs text-amber-800">🐉 BOSS 勝利</div><div className="text-3xl font-black text-amber-950">{summary.bossWins}</div></div>
          <div className="rounded-2xl bg-white/90 p-4 shadow"><div className="text-xs text-slate-500">📖 歷史正確率</div><div className="text-3xl font-black text-slate-900">{summary.accuracy}%</div></div>
        </div>
        <div className="mt-3 text-center text-sm font-bold text-amber-800">一路累積了 +{summary.exp} EXP · 遭遇過 {summary.bossBattles} 場 BOSS 戰</div>

        {!historyAvailable && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-300 p-3 text-sm font-bold text-amber-900">
            {historyError || "完整歷史目前暫時無法讀取；不要把近期數字當成總成就。"}
          </div>
        )}
      </section>

      <section className="p-5 bg-slate-950/95 text-white rounded-3xl shadow-xl border border-amber-300/40">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-black tracking-[0.2em] text-amber-300">GLORY MOMENTS</div>
            <h2 className="text-2xl md:text-3xl font-black mt-1">✨ 最近的榮耀</h2>
            <div className="text-sm text-slate-300 mt-1">城堡會替你記住最近值得紀念的冒險時刻。</div>
          </div>
        </div>
        {recentGlory.length === 0 ? (
          <div className="rounded-2xl bg-white/10 p-5 text-center text-slate-200">下一個值得收藏的榮耀，正在森林裡等你。</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {recentGlory.map((moment) => (
              <article key={`${moment.title}-${moment.detail}`} className="rounded-2xl bg-white/10 border border-white/10 p-4 shadow-lg">
                <div className="text-3xl">{moment.icon}</div>
                <div className="mt-2 text-lg font-black text-amber-200">{moment.title}</div>
                <div className="mt-1 text-sm text-slate-300">{moment.detail}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="p-5 bg-indigo-950/95 text-white rounded-3xl shadow-xl border border-indigo-300/40">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-black tracking-[0.2em] text-indigo-200">MONSTER HALL</div>
            <h2 className="text-2xl md:text-3xl font-black mt-1">🐉 怪物殿堂</h2>
            <div className="text-sm text-indigo-200 mt-1">每一種怪物，都留下你目前已經翻到的最佳 Mastery。</div>
          </div>
          <div className="text-xs text-indigo-200 max-w-sm md:text-right">
            {battlePage?.hasMore ? "載入更早的冒險後，殿堂會繼續補上舊紀錄；不會把前 50 場誤當成人生最佳。" : "已經翻到第一次森林冒險，這裡現在就是完整的怪物 Mastery 紀錄。"}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {monsterHall.map(({ monster, encounters, victories, bestStars, bestCombo, perfect }) => (
            <article key={monster.key} className={`rounded-2xl border p-4 text-center min-h-[190px] flex flex-col justify-center ${encounters > 0 ? "bg-white/10 border-indigo-300/30" : "bg-black/25 border-white/10 text-slate-400"}`}>
              <div className="text-5xl">{encounters > 0 ? monster.icon : "🔒"}</div>
              <div className="mt-2 font-black text-lg">{encounters > 0 ? monster.label : "尚未遇見"}</div>
              {encounters > 0 ? (
                <>
                  <div className="mt-2 text-xl tracking-wide">{starText(bestStars)}</div>
                  <div className={`mt-1 text-xs font-black ${perfect ? "text-amber-300" : "text-indigo-200"}`}>{perfect ? "PERFECT" : `最佳 Mastery ${bestStars}/3`}</div>
                  <div className="mt-2 text-xs text-slate-300">勝利 {victories} · 最長 Combo {bestCombo}</div>
                </>
              ) : <div className="mt-3 text-xs">去森林找找看</div>}
            </article>
          ))}
        </div>
      </section>

      <section className="p-5 bg-white/95 rounded-3xl shadow-xl border border-yellow-300">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-black tracking-[0.2em] text-yellow-700">CHRONICLE</div>
            <h2 className="text-2xl md:text-3xl font-black text-yellow-950 mt-1">📜 我的冒險故事</h2>
            <div className="text-sm text-yellow-800 mt-1">不是一串系統 Log；每一場都是你走過的冒險。</div>
          </div>
          <div className="text-sm font-bold text-yellow-800">已翻到 {battles.length} 場</div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setHistoryFilter(key)}
              className={`rounded-full px-4 py-2 text-sm font-black border transition ${historyFilter === key ? "bg-yellow-500 text-yellow-950 border-yellow-600" : "bg-white text-slate-700 border-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredBattles.length === 0 ? (
          <div className="p-5 text-center text-gray-700 rounded-2xl bg-yellow-50">這個分類目前還沒有冒險故事。</div>
        ) : (
          <ul className="space-y-3 max-h-[760px] overflow-y-auto pr-2">
            {filteredBattles.map((battle) => {
              const questions = Number(battle.questionCount || 0);
              const correct = Number(battle.correctCount || 0);
              const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
              const won = battle.outcome === "victory";
              const isBoss = battle.monsterTier === "boss";
              const archetype = battle.monsterArchetype ? MONSTER_ARCHETYPES[battle.monsterArchetype] : null;
              const stars = Number(battle.mastery?.stars || 0);
              return (
                <li key={battle.sessionKey} className={`bg-white p-4 rounded-2xl shadow border ${isBoss ? "border-amber-400 ring-1 ring-amber-200" : "border-yellow-200"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className={`font-black text-lg ${isBoss ? "text-amber-900" : "text-slate-800"}`}>
                      {won ? "🏆 勝利" : "💥 戰敗"} · {archetype ? `${archetype.icon} ${archetype.label}` : `${isBoss ? "🐉 " : ""}${TIER_LABELS[battle.monsterTier] || battle.monsterTier}`}
                    </div>
                    <div className="text-sm text-slate-500">🕒 {formatTime(battle.completedAt)}</div>
                  </div>
                  {battle.mastery && (
                    <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="font-black text-amber-900">{starText(stars)} Mastery</div>
                      <div className="text-xs font-bold text-amber-800">{battle.mastery.perfect ? "PERFECT" : `最高 Combo ${Number(battle.mastery.maxCombo || 0)}`}</div>
                    </div>
                  )}
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

        {historyAvailable && battlePage?.hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-4 w-full min-h-[54px] rounded-xl bg-yellow-500 text-yellow-950 font-black text-lg disabled:opacity-50"
          >
            {loadingMore ? "正在翻找更早的冒險…" : "📜 繼續翻找更久以前的故事"}
          </button>
        )}

        {historyAvailable && !battlePage?.hasMore && battles.length > 0 && (
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center font-black text-emerald-800">
            ✨ 這是你第一次走進森林的那一天。城堡已經收藏了完整的冒險故事。
          </div>
        )}

        {historyError && historyAvailable && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-300 p-3 text-sm font-bold text-amber-900">
            {historyError}
          </div>
        )}
      </section>

      <section className="p-5 bg-violet-950/95 text-white rounded-3xl shadow-xl border border-violet-300/40">
        <div className="mb-4">
          <div className="text-xs font-black tracking-[0.2em] text-violet-200">MAGIC ROOM</div>
          <h2 className="text-2xl md:text-3xl font-black mt-1">🪄 魔法書房</h2>
          <div className="text-sm text-violet-200 mt-1">這些不是「不會的字」，而是你還在慢慢掌握的魔法。</div>
        </div>
        {weaknessWords.length === 0 ? (
          <div className="rounded-xl bg-white/10 p-4 text-center text-violet-100">目前沒有需要特別提醒的魔法詞，繼續自由冒險就好。</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {weaknessWords.slice(0, 6).map((word) => (
              <div key={word.vocabularyId} className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-2xl font-black text-amber-300">{word.english}</div>
                    <div className="font-bold text-violet-100">{word.chinese}</div>
                  </div>
                  <div className="text-xs rounded-full bg-black/30 px-2 py-1">{WEAKNESS_LABELS[word.state] || "再挑戰"}</div>
                </div>
                <div className="mt-3 text-sm text-violet-200">最近 {word.attempts} 次遇見 · 答對 {word.correctCount} 次</div>
                {Number(word.currentCorrectStreak || 0) > 0 && (
                  <div className="mt-2 text-xs font-black text-emerald-300">✨ 已經連續答對 {Number(word.currentCorrectStreak || 0)} 次，正在掌握它。</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}