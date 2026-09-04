import { useEffect, useMemo, useState } from "react";
import { learningApi } from "../api/learningClient";

const STATE_LABELS = {
  struggling: "需要優先陪練",
  needs_practice: "需要再練習",
  watch: "持續觀察",
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

export default function ParentDashboard() {
  const [authState, setAuthState] = useState("checking");
  const [accessKey, setAccessKey] = useState("");
  const [authError, setAuthError] = useState("");
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  const loadProgress = async () => {
    setLoading(true);
    setDataError("");
    try {
      setProgress(await learningApi.progress());
    } catch {
      setDataError("目前無法讀取孩子的學習資料，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    learningApi.adminSession()
      .then(async (result) => {
        if (!active) return;
        if (result?.authenticated) {
          setAuthState("ready");
          await loadProgress();
        } else {
          setAuthState("login");
        }
      })
      .catch(() => {
        if (active) setAuthState("login");
      });
    return () => { active = false; };
  }, []);

  const login = async (event) => {
    event.preventDefault();
    if (!accessKey.trim()) return;
    setAuthState("signing-in");
    setAuthError("");
    try {
      await learningApi.adminLogin(accessKey.trim());
      setAccessKey("");
      setAuthState("ready");
      await loadProgress();
    } catch (error) {
      setAuthError(error?.status === 401 ? "家長密碼不正確。" : "家長登入尚未設定完成。");
      setAuthState("login");
    }
  };

  const logout = async () => {
    try { await learningApi.adminLogout(); } catch {}
    setProgress(null);
    setAuthState("login");
  };

  const battles = Array.isArray(progress?.recentBattles) ? progress.recentBattles : [];
  const weaknessWords = Array.isArray(progress?.wordWeakness?.words) ? progress.wordWeakness.words : [];

  const summary = useMemo(() => {
    const questions = battles.reduce((sum, battle) => sum + Number(battle.questionCount || 0), 0);
    const correct = battles.reduce((sum, battle) => sum + Number(battle.correctCount || 0), 0);
    const wins = battles.filter((battle) => battle.outcome === "victory").length;
    const exp = battles.reduce((sum, battle) => sum + Number(battle.earnedExp || 0), 0);
    return {
      battles: battles.length,
      questions,
      correct,
      accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0,
      wins,
      exp,
    };
  }, [battles]);

  if (authState === "checking") {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-600 text-xl">正在確認家長權限…</div>;
  }

  if (authState !== "ready") {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-12">
        <form onSubmit={login} className="mx-auto max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="text-sm font-semibold text-indigo-600">Parent Learning Dashboard</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">家長學習觀察</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">這裡只呈現孩子的學習與冒險資料，不會出現在孩子的世界地圖。</p>
          <label htmlFor="parent-key" className="mt-6 block text-sm font-medium text-slate-700">家長密碼</label>
          <input
            id="parent-key"
            type="password"
            value={accessKey}
            onChange={(event) => setAccessKey(event.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />
          {authError && <div className="mt-3 text-sm font-medium text-red-600">{authError}</div>}
          <button type="submit" className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">
            {authState === "signing-in" ? "登入中…" : "進入家長後台"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl grid gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-indigo-600">Parent Learning Dashboard</div>
            <h1 className="text-3xl font-black">家長學習觀察</h1>
            <p className="mt-1 text-sm text-slate-500">資料直接來自孩子的 canonical learning evidence，不另外建立手動紀錄。</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadProgress} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40">重新整理</button>
            <button onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">登出</button>
          </div>
        </header>

        {dataError && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">{dataError}</div>}

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Metric label="目前等級" value={`Lv.${Number(progress?.level || 1)}`} />
          <Metric label="近期戰鬥" value={summary.battles} />
          <Metric label="近期答題" value={summary.questions} />
          <Metric label="近期正確率" value={`${summary.accuracy}%`} />
          <Metric label="近期獲得 EXP" value={`+${summary.exp}`} />
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-black">逐字弱點分析</h2>
              <p className="mt-1 text-sm text-slate-500">每個字只看最近 {Number(progress?.wordWeakness?.recentAttemptWindowPerWord || 10)} 次作答，避免很久以前的錯誤永久拖累判斷。</p>
            </div>
            <div className="text-xs text-slate-400">最後遊玩：{formatTime(progress?.lastPlayedAt)}</div>
          </div>

          {weaknessWords.length === 0 ? (
            <div className="rounded-xl bg-emerald-50 p-5 text-center text-emerald-800">目前沒有偵測到需要特別關注的單字。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">單字</th>
                    <th className="px-4 py-3">狀態</th>
                    <th className="px-4 py-3">最近作答</th>
                    <th className="px-4 py-3">答錯</th>
                    <th className="px-4 py-3">正確率</th>
                    <th className="px-4 py-3">Village / Forest</th>
                    <th className="px-4 py-3">最後遇到</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weaknessWords.map((word) => (
                    <tr key={word.vocabularyId} className="align-top">
                      <td className="px-4 py-3">
                        <div className="font-black text-lg">{word.english}</div>
                        <div className="text-slate-500">{word.chinese}</div>
                      </td>
                      <td className="px-4 py-3"><span className="rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-bold">{STATE_LABELS[word.state] || "持續觀察"}</span></td>
                      <td className="px-4 py-3 font-semibold">{word.attempts}</td>
                      <td className="px-4 py-3 font-semibold text-red-700">{word.wrongCount}</td>
                      <td className="px-4 py-3 font-semibold">{word.accuracy}%</td>
                      <td className="px-4 py-3">{Number(word.modeAttempts?.practice || 0)} / {Number(word.modeAttempts?.challenge || 0)}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTime(word.lastAnsweredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-xl font-black">怎麼看這份資料</h2>
          <div className="mt-3 grid md:grid-cols-3 gap-3 text-sm leading-6">
            <Explain title="需要優先陪練" text="最近至少作答 3 次，而且正確率低於 50%。" />
            <Explain title="需要再練習" text="最近錯 2 次以上，或至少作答 2 次且正確率低於 80%。" />
            <Explain title="持續觀察" text="近期曾答錯，但目前證據還不足以判定為穩定弱點。" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function Explain({ title, text }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="font-black">{title}</div>
      <div className="mt-1 text-slate-600">{text}</div>
    </div>
  );
}
