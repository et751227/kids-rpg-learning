import React, { useEffect, useMemo, useState } from "react";
import { learningApi } from "../api/learningClient";

function CountCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function AdminVocabulary() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  const loadVocabulary = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await learningApi.adminVocabularyList();
      setItems(Array.isArray(result?.items) ? result.items : []);
    } catch (error) {
      if (error?.status === 401) setAuthenticated(false);
      else setLoadError("無法讀取 PostgreSQL 題庫，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    learningApi.adminSession()
      .then((result) => {
        if (!active) return;
        const ok = result?.authenticated === true;
        setAuthenticated(ok);
        if (ok) loadVocabulary();
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => {
    const active = items.filter((item) => item.enabled).length;
    return { total: items.length, active, staged: items.length - active };
  }, [items]);

  const categories = useMemo(() => (
    [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  ), [items]);

  const difficulties = useMemo(() => (
    [...new Set(items.map((item) => String(item.difficulty || "")).filter(Boolean))].sort()
  ), [items]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (keyword) {
        const haystack = `${item.english || ""} ${item.chinese || ""} ${item.vocabularyId || ""}`.toLocaleLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (category !== "all" && item.category !== category) return false;
      if (difficulty !== "all" && String(item.difficulty || "") !== difficulty) return false;
      if (stateFilter === "active" && !item.enabled) return false;
      if (stateFilter === "staged" && item.enabled) return false;
      return true;
    });
  }, [items, search, category, difficulty, stateFilter]);

  const login = async (event) => {
    event.preventDefault();
    setLoginError("");
    try {
      await learningApi.adminLogin(accessKey);
      setAccessKey("");
      setAuthenticated(true);
      await loadVocabulary();
    } catch (error) {
      setLoginError(error?.status === 401 ? "管理密碼不正確。" : "管理登入尚未設定完成。");
    }
  };

  const logout = async () => {
    try { await learningApi.adminLogout(); } catch { /* cookie cleanup is best effort */ }
    setAuthenticated(false);
    setItems([]);
  };

  if (checking) {
    return <div className="min-h-screen bg-slate-50 p-8 text-slate-600">正在確認管理權限…</div>;
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <form onSubmit={login} className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-indigo-600">Kids Content Admin</div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">題庫管理登入</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">這個管理入口與孩子的家庭登入分離。</p>
          <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="admin-key">管理密碼</label>
          <input
            id="admin-key"
            type="password"
            autoComplete="current-password"
            value={accessKey}
            onChange={(event) => setAccessKey(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />
          {loginError && <div className="mt-3 text-sm font-medium text-red-600">{loginError}</div>}
          <button type="submit" className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">登入管理台</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-indigo-600">Kids Content Admin</div>
            <h1 className="text-2xl font-bold">Vocabulary</h1>
            <p className="mt-1 text-sm text-slate-500">PostgreSQL canonical curriculum · v0.1 read-only</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadVocabulary} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">重新讀取</button>
            <button onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">登出</button>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-3 gap-3">
          <CountCard label="Total" value={counts.total} />
          <CountCard label="Active" value={counts.active} />
          <CountCard label="Staged" value={counts.staged} />
        </section>

        <section className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜尋英文、中文或 ID"
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2">
            <option value="all">全部 category</option>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2">
            <option value="all">全部 difficulty</option>
            {difficulties.map((value) => <option key={value} value={value}>Difficulty {value}</option>)}
          </select>
          <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2">
            <option value="all">全部狀態</option>
            <option value="active">Active</option>
            <option value="staged">Staged</option>
          </select>
        </section>

        <div className="mt-3 text-sm text-slate-500">顯示 {filtered.length} / {items.length}</div>
        {loadError && <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{loadError}</div>}
        {loading ? (
          <div className="mt-6 text-slate-500">讀取中…</div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">English</th>
                  <th className="px-4 py-3">中文</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.vocabularyId} className="align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.english}</td>
                    <td className="px-4 py-3">{item.chinese}</td>
                    <td className="px-4 py-3 text-slate-600">{item.category || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{item.difficulty || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.enabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {item.enabled ? "Active" : "Staged"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{item.vocabularyId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
