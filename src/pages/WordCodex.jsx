import React, { useEffect, useMemo, useState } from "react";
import WorldBackButton from "../components/WorldBackButton";
import { learningApi } from "../api/learningClient";

export default function WordCodex() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    learningApi.codex()
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError("單字圖鑑載入失敗，請稍後再試"); });
    return () => { active = false; };
  }, []);

  const items = useMemo(() => {
    const list = data?.items || [];
    if (filter === "unlocked") return list.filter((item) => item.unlocked);
    if (filter === "locked") return list.filter((item) => !item.unlocked);
    return list;
  }, [data, filter]);

  const tranche = data?.tranche;
  const collections = data?.collections || [];
  const progress = tranche ? Math.min(100, (tranche.unlockedCount / Math.max(1, tranche.target)) * 100) : 0;

  if (error) {
    return <div className="min-h-screen bg-slate-950 text-white p-6"><WorldBackButton /><div className="mt-10 text-center text-xl">{error}</div></div>;
  }
  if (!data) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-2xl">📖 正在打開魔法單字圖鑑…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-950 to-black text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <WorldBackButton />
          <div className="text-center flex-1">
            <h1 className="text-3xl md:text-4xl font-black">📖 魔法單字圖鑑</h1>
            <p className="text-indigo-200 mt-1">Learn to Unlock, Unlock to Explore</p>
          </div>
          <div className="w-[110px]" />
        </div>

        <section className="rounded-2xl bg-white/10 border border-white/15 p-4 md:p-5 shadow-xl">
          <div>
            <div className="text-3xl font-black text-amber-300">✨ {tranche.unlockedCount} / {tranche.target}</div>
            <div className="text-sm text-slate-300 mt-1">已解鎖單字 / 第一階段 300 字</div>
          </div>
          <div className="h-4 bg-black/40 rounded-full overflow-hidden mt-4 border border-white/10">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </section>

        {collections.length > 0 && (
          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">🏅 收藏套組</h2>
              <div className="text-sm text-indigo-200">完成套組可以拿到獎勵</div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {collections.map((collection) => {
                const percent = Math.min(100, (collection.unlockedCount / Math.max(1, collection.requiredCount)) * 100);
                return (
                  <article
                    key={collection.id}
                    className={`rounded-2xl border p-4 shadow-xl ${collection.completed ? "bg-amber-50 text-slate-900 border-amber-300" : "bg-white/10 border-white/15"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xl md:text-2xl font-black">{collection.completed ? "✅" : "🔒"} {collection.title}</div>
                        <div className={`mt-1 text-sm ${collection.completed ? "text-slate-600" : "text-slate-300"}`}>{collection.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-black">{collection.unlockedCount} / {collection.requiredCount}</div>
                        <div className={`text-xs ${collection.completed ? "text-green-700" : "text-indigo-200"}`}>{collection.completed ? "已完成" : "繼續解鎖"}</div>
                      </div>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden mt-3 ${collection.completed ? "bg-amber-200" : "bg-black/35"}`}>
                      <div className={`h-full transition-all ${collection.completed ? "bg-green-500" : "bg-indigo-400"}`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className={`mt-4 rounded-xl px-4 py-3 flex items-center gap-3 ${collection.completed ? "bg-amber-100 border border-amber-300" : "bg-black/25 border border-white/10"}`}>
                      <div className="text-3xl">{collection.reward?.icon || "🏅"}</div>
                      <div>
                        <div className="text-xs font-bold opacity-70">完成獎勵</div>
                        <div className="text-lg font-black">{collection.reward?.name || "神秘徽章"}</div>
                      </div>
                      <div className="ml-auto text-sm font-black">{collection.reward?.earned ? "已獲得" : "未獲得"}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          {[
            ["all", "全部"],
            ["unlocked", "✨ 已解鎖"],
            ["locked", "🔒 未解鎖"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full font-bold border ${filter === key ? "bg-indigo-500 border-indigo-300" : "bg-white/10 border-white/20"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <article
              key={item.vocabularyId}
              className={`min-h-[145px] rounded-2xl p-4 border flex flex-col items-center justify-center text-center shadow-lg ${item.unlocked ? "bg-amber-50 text-slate-900 border-amber-300" : "bg-slate-900/80 text-slate-400 border-slate-700"}`}
            >
              {item.unlocked ? (
                <>
                  <div className="text-3xl mb-1">✨</div>
                  <div className="text-xl md:text-2xl font-black break-words">{item.word}</div>
                  <div className="mt-1 text-base font-bold text-indigo-700">{item.chinese}</div>
                  <div className="mt-2 text-xs text-slate-500">{item.category || "word"}</div>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">🔒</div>
                  <div className="text-2xl font-black tracking-widest">???</div>
                  <div className="mt-2 text-xs">繼續學習來解鎖</div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
