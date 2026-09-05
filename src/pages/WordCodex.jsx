import React, { useEffect, useMemo, useState } from "react";
import WorldBackButton from "../components/WorldBackButton";
import { learningApi } from "../api/learningClient";
import { getWordBelonging, presentCollection } from "../game/codexPresentation";

const COLLECTION_SHELVES = [
  { key: "transport", icon: "🚗", title: "交通旅行", description: "汽車、公車、火車與城市旅行" },
  { key: "nature", icon: "🐾", title: "動物自然", description: "動物、森林、天氣與自然世界" },
  { key: "daily", icon: "🏠", title: "生活校園", description: "食物、家庭、學校、身體與穿搭" },
  { key: "expression", icon: "🎨", title: "感覺創意", description: "動作、心情、顏色、形狀與描述" },
  { key: "numbers", icon: "🔢", title: "數字時間", description: "數字、時間與順序相關收藏" },
  { key: "magic", icon: "🪄", title: "魔法語言", description: "角色、句子與語言魔法收藏" },
];

const MANUAL_COLLECTION_SHELVES = {
  "adventure-companions-v1": "magic",
  "fruit-basket-v1": "daily",
  "home-helper-v1": "daily",
  "school-bag-v1": "daily",
  "family-circle-v1": "daily",
  "animal-friends-v1": "nature",
  "nature-ranger-v1": "nature",
  "weather-wizard-v1": "nature",
  "body-hero-v1": "daily",
  "fashion-star-v1": "daily",
  "city-traveler-v1": "transport",
  "action-hero-v1": "expression",
  "emotion-stars-v1": "expression",
  "color-spark-v1": "expression",
  "shape-builder-v1": "expression",
  "number-rookie-v1": "numbers",
};

const CATEGORY_SHELVES = {
  food: "daily",
  home: "daily",
  school: "daily",
  people: "daily",
  body: "daily",
  clothes: "daily",
  animal: "nature",
  nature: "nature",
  weather: "nature",
  transport: "transport",
  place: "transport",
  action: "expression",
  feeling: "expression",
  adjective: "expression",
  color: "expression",
  shape: "expression",
  number: "numbers",
  time: "numbers",
};

function collectionShelfKey(collection) {
  const id = String(collection?.id || "");
  if (MANUAL_COLLECTION_SHELVES[id]) return MANUAL_COLLECTION_SHELVES[id];
  const match = id.match(/^category-(.+)-pack-\d+-v\d+$/);
  const category = match?.[1]?.replace(/_/g, " ") || "";
  return CATEGORY_SHELVES[category] || "magic";
}

export default function WordCodex() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("collections");
  const [filter, setFilter] = useState("unlocked");
  const [activeShelf, setActiveShelf] = useState(null);
  const [expandedCollectionId, setExpandedCollectionId] = useState(null);

  useEffect(() => {
    let active = true;
    learningApi.codex()
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError("單字圖鑑載入失敗，請稍後再試"); });
    return () => { active = false; };
  }, []);

  const items = useMemo(() => {
    const list = data?.items || [];
    if (filter === "unlocked") return list.filter((item) => item.discovered ?? item.unlocked);
    return list.filter((item) => !(item.discovered ?? item.unlocked));
  }, [data, filter]);

  const collections = useMemo(
    () => (data?.collections || []).map((collection) => presentCollection(collection)),
    [data],
  );

  const shelfCounts = useMemo(() => {
    const counts = Object.fromEntries(COLLECTION_SHELVES.map((shelf) => [shelf.key, 0]));
    collections.forEach((collection) => { counts[collectionShelfKey(collection)] += 1; });
    return counts;
  }, [collections]);

  const visibleCollections = useMemo(
    () => activeShelf ? collections.filter((collection) => collectionShelfKey(collection) === activeShelf) : [],
    [collections, activeShelf],
  );

  const activeShelfMeta = COLLECTION_SHELVES.find((shelf) => shelf.key === activeShelf) || null;
  const tranche = data?.tranche;
  const encounteredCount = tranche?.discoveredCount ?? tranche?.unlockedCount ?? 0;
  const exploredCount = tranche?.learningPoolCount ?? 0;
  const totalCount = tranche?.target ?? 0;
  const progress = totalCount > 0 ? Math.min(100, (encounteredCount / totalCount) * 100) : 0;

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
            <p className="text-indigo-200 mt-1">收藏冒險成果，也可以回頭查看已發現的魔法詞</p>
          </div>
          <div className="w-[110px]" />
        </div>

        <section className="rounded-2xl bg-white/10 border border-white/15 p-4 md:p-5 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-black/25 border border-white/10 p-4 text-center">
              <div className="text-4xl font-black text-slate-100">{totalCount}</div>
              <div className="text-sm font-black mt-2">總字詞</div>
            </div>
            <div className="rounded-xl bg-black/25 border border-white/10 p-4 text-center">
              <div className="text-4xl font-black text-violet-300">{exploredCount}</div>
              <div className="text-sm font-black mt-2">已探索字詞</div>
            </div>
            <div className="rounded-xl bg-black/25 border border-white/10 p-4 text-center">
              <div className="text-4xl font-black text-amber-300">{encounteredCount}</div>
              <div className="text-sm font-black mt-2">已對決字詞</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold text-indigo-100">
            <span>圖鑑進度</span>
            <span>{encounteredCount} / {totalCount}</span>
          </div>
          <div className="h-4 bg-black/40 rounded-full overflow-hidden mt-2 border border-white/10">
            <div className="h-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <nav className="grid grid-cols-2 gap-3" aria-label="圖鑑主要導覽">
          <button
            type="button"
            onClick={() => setView("collections")}
            className={`min-h-[72px] rounded-2xl border text-xl font-black transition ${view === "collections" ? "bg-amber-400 text-slate-950 border-amber-200 shadow-lg" : "bg-white/10 border-white/20 text-white"}`}
          >
            🏅 收藏
          </button>
          <button
            type="button"
            onClick={() => setView("codex")}
            className={`min-h-[72px] rounded-2xl border text-xl font-black transition ${view === "codex" ? "bg-indigo-500 border-indigo-300 shadow-lg" : "bg-white/10 border-white/20 text-white"}`}
          >
            📖 圖鑑
          </button>
        </nav>

        {view === "collections" && collections.length > 0 && (
          <section className="grid gap-4">
            {!activeShelf ? (
              <>
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black">🏅 想找哪一區的收藏？</h2>
                  <div className="text-sm text-indigo-200 mt-1">先選主題，再看裡面的收藏；不用從整座圖書館慢慢往下找。</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {COLLECTION_SHELVES.map((shelf) => (
                    <button
                      key={shelf.key}
                      type="button"
                      onClick={() => { setActiveShelf(shelf.key); setExpandedCollectionId(null); }}
                      className="min-h-[150px] rounded-2xl bg-white/10 border border-white/15 p-4 text-left shadow-xl transition hover:bg-white/15"
                    >
                      <div className="text-4xl">{shelf.icon}</div>
                      <div className="mt-2 text-xl font-black">{shelf.title}</div>
                      <div className="mt-1 text-sm text-indigo-200">{shelf.description}</div>
                      <div className="mt-3 text-xs font-black text-amber-300">{shelfCounts[shelf.key]} 個收藏套組 →</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black">{activeShelfMeta.icon} {activeShelfMeta.title}</h2>
                    <div className="text-sm text-indigo-200 mt-1">{activeShelfMeta.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActiveShelf(null); setExpandedCollectionId(null); }}
                    className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 font-black"
                  >
                    ← 所有收藏主題
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {visibleCollections.map((collection) => {
                    const count = collection.discoveredCount ?? collection.unlockedCount ?? 0;
                    const percent = Math.min(100, (count / Math.max(1, collection.requiredCount)) * 100);
                    const expanded = expandedCollectionId === collection.id;
                    return (
                      <article
                        key={collection.id}
                        className={`rounded-2xl border p-4 shadow-xl ${collection.completed ? "bg-amber-50 text-slate-900 border-amber-300" : "bg-white/10 border-white/15"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedCollectionId(expanded ? null : collection.id)}
                          className="w-full text-left"
                          aria-expanded={expanded}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xl md:text-2xl font-black">{collection.completed ? "✅" : "🔒"} {collection.title}</div>
                              <div className={`mt-1 text-sm ${collection.completed ? "text-slate-600" : "text-slate-300"}`}>{collection.description}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xl font-black">{count} / {collection.requiredCount}</div>
                              <div className={`text-xs ${collection.completed ? "text-green-700" : "text-indigo-200"}`}>{collection.completed ? "已完成" : "尚未集齊"}</div>
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
                            <div className="ml-auto text-sm font-black">{collection.reward?.earned ? "已獲得" : "🔒 未獲得"}</div>
                          </div>
                          <div className={`mt-3 text-center text-sm font-bold ${collection.completed ? "text-slate-600" : "text-indigo-200"}`}>
                            {expanded ? "收起單字組成 ▲" : "查看單字組成 ▼"}
                          </div>
                        </button>

                        {expanded ? (
                          <div className={`mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-2 ${collection.completed ? "border-amber-300" : "border-white/15"}`}>
                            {(collection.members || []).map((member, index) => (
                              <div
                                key={member.vocabularyId || `${collection.id}-${index}`}
                                className={`min-h-[88px] rounded-xl border px-3 py-2 flex flex-col items-center justify-center text-center ${member.discovered ? (collection.completed ? "bg-white border-amber-300" : "bg-white/10 border-indigo-300/40") : (collection.completed ? "bg-slate-200 border-slate-300" : "bg-black/30 border-white/10")}`}
                              >
                                {member.discovered ? (
                                  <>
                                    <div className="text-sm font-black break-words">{member.word}</div>
                                    <div className={`text-xs mt-1 ${collection.completed ? "text-indigo-700" : "text-indigo-200"}`}>{member.chinese}</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-2xl">🔒</div>
                                    <div className="text-xs mt-1 opacity-70">尚未在村莊／森林發現</div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {view === "codex" && (
          <section className="grid gap-4">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-black">📖 單字圖鑑</h2>
              <div className="text-sm text-indigo-200 mt-1">先用「已發現 / 未發現」找你現在想看的內容。</div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-xl w-full mx-auto">
              {[
                ["unlocked", "✨ 已發現"],
                ["locked", "🔒 未發現"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`min-h-[60px] px-4 py-3 rounded-2xl text-lg font-black border ${filter === key ? "bg-indigo-500 border-indigo-300" : "bg-white/10 border-white/20"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((item) => {
                const discovered = item.discovered ?? item.unlocked;
                return (
                  <article
                    key={item.vocabularyId}
                    className={`min-h-[145px] rounded-2xl p-4 border flex flex-col items-center justify-center text-center shadow-lg ${discovered ? "bg-amber-50 text-slate-900 border-amber-300" : "bg-slate-900/80 text-slate-400 border-slate-700"}`}
                  >
                    {discovered ? (
                      <>
                        <div className="text-3xl mb-1">✨</div>
                        <div className="text-xl md:text-2xl font-black break-words">{item.word}</div>
                        <div className="mt-1 text-base font-bold text-indigo-700">{item.chinese}</div>
                        <div className="mt-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">{getWordBelonging(item.category)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">🔒</div>
                        <div className="text-2xl font-black tracking-widest">???</div>
                        <div className="mt-2 text-xs">去村莊或森林遇見它</div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
